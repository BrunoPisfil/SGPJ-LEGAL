"""
Servicio de notificaciones automáticas para SGPJ Legal
Maneja:
- Notificaciones de audiencias 24 horas antes
- Notificaciones de diligencias 24 horas antes
- Notificaciones de procesos sin revisar
- Envío automático por email y sistema
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta, date
from typing import List, Tuple
import logging

from app.core.config import settings
from app.core.timezone import get_current_time_peru, get_current_date_peru, format_fecha_hora
from app.models.audiencia import Audiencia
from app.models.proceso import Proceso
from app.models.diligencia import Diligencia, EstadoDiligencia
from app.models.notificacion import Notificacion, TipoNotificacion, CanalNotificacion, EstadoNotificacion
from app.services.notificacion import NotificacionService
from app.schemas.notificacion import EnviarNotificacionRequest

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AutoNotificationService:
    """Servicio para notificaciones automáticas"""
    
    @staticmethod
    def check_and_send_notifications(db: Session) -> dict:
        """
        Verificar y enviar todas las notificaciones automáticas pendientes
        Retorna estadísticas de envío
        """
        if not settings.auto_notifications_enabled:
            logger.info("Notificaciones automáticas deshabilitadas")
            return {"audiencias": 0, "procesos": 0, "errors": []}
        
        stats = {
            "audiencias": 0,
            "diligencias": 0,
            "procesos": 0,
            "errors": []
        }
        
        try:
            # Notificar audiencias próximas
            audiencias_notificadas = AutoNotificationService._check_audiencias_proximas(db)
            stats["audiencias"] = len(audiencias_notificadas)
            
            # Notificar diligencias próximas
            diligencias_notificadas = AutoNotificationService._check_diligencias_proximas(db)
            stats["diligencias"] = len(diligencias_notificadas)
            
            # Notificar procesos sin revisar
            procesos_notificados = AutoNotificationService._check_procesos_sin_revisar(db)
            stats["procesos"] = len(procesos_notificados)
            
            logger.info(f"Notificaciones enviadas - Audiencias: {stats['audiencias']}, Diligencias: {stats['diligencias']}, Procesos: {stats['procesos']}")
            
        except Exception as e:
            logger.error(f"Error en notificaciones automáticas: {e}")
            stats["errors"].append(str(e))
        
        return stats
    
    @staticmethod
    def _check_audiencias_proximas(db: Session) -> List[Notificacion]:
        """Verificar audiencias que necesitan notificación 24 horas antes"""
        
        # Usar timezone de Perú
        now = get_current_time_peru()
        
        # SIEMPRE 24 horas antes (sin usar settings que puede tener múltiples horas)
        target_hours = 24
        target_time = now + timedelta(hours=target_hours)
        
        logger.info(f"Buscando audiencias próximas para notificar en {target_hours}h (fecha/hora objetivo: {target_time})")
        
        # Buscar audiencias próximas que no han sido notificadas
        # Se buscan todas las audiencias futuras con notificar=True
        audiencias = db.query(Audiencia).filter(
            and_(
                Audiencia.fecha_hora >= now,
                Audiencia.fecha_hora <= target_time,
                Audiencia.notificar == True
            )
        ).all()
        
        notificaciones_creadas = []
        
        for audiencia in audiencias:
            try:
                # Verificar si ya se envió notificación para esta audiencia
                notificacion_existente = db.query(Notificacion).filter(
                    and_(
                        Notificacion.audiencia_id == audiencia.id,
                        Notificacion.tipo == TipoNotificacion.AUDIENCIA_RECORDATORIO,
                        Notificacion.estado.in_([EstadoNotificacion.ENVIADO, EstadoNotificacion.PENDIENTE])
                    )
                ).first()
                
                if notificacion_existente:
                    logger.info(f"Audiencia {audiencia.id} ya tiene notificación automática")
                    continue
                
                # Crear notificaciones para cada email configurado
                for email_destino in settings.notification_emails:
                    try:
                        notificacion = Notificacion(
                            audiencia_id=audiencia.id,
                            proceso_id=audiencia.proceso_id,
                            tipo=TipoNotificacion.AUDIENCIA_RECORDATORIO,
                            canal=CanalNotificacion.EMAIL,
                            titulo=f"Recordatorio: Audiencia en {target_hours}h",
                            mensaje=f"Recordatorio automático: Su audiencia está programada para las {audiencia.fecha_hora.strftime('%H:%M')} del {audiencia.fecha_hora.strftime('%d/%m/%Y')}.",
                            destinatario=email_destino,
                            email_destinatario=email_destino,
                            estado=EstadoNotificacion.PENDIENTE
                        )
                        
                        db.add(notificacion)
                        db.flush()
                        
                        # Intentar enviar por email
                        try:
                            NotificacionService._enviar_email(notificacion, audiencia, None)
                            notificacion.estado = EstadoNotificacion.ENVIADO
                            notificacion.fecha_envio = datetime.now()
                            logger.info(f"✅ Email enviado a {email_destino} para audiencia {audiencia.id}")
                            
                        except Exception as e:
                            logger.warning(f"⚠️ No se pudo enviar email a {email_destino} para audiencia {audiencia.id}: {e}")
                            notificacion.estado = EstadoNotificacion.PENDIENTE
                            notificacion.error_mensaje = str(e)
                        
                        notificaciones_creadas.append(notificacion)
                        
                    except Exception as e:
                        logger.error(f"❌ Error creando notificación para {email_destino} en audiencia {audiencia.id}: {e}")
                
                db.commit()
                
                logger.info(f"✅ Notificación automática registrada para audiencia {audiencia.id}")
                
            except Exception as e:
                logger.error(f"❌ Error notificando audiencia {audiencia.id}: {e}")
                db.rollback()
        
        return notificaciones_creadas
    
    @staticmethod
    def _check_diligencias_proximas(db: Session) -> List[Notificacion]:
        """Verificar diligencias que necesitan notificación (2 horas antes)"""
        
        # Usar timezone de Perú
        now = get_current_time_peru()
        today = get_current_date_peru()
        
        # Calcular fecha y hora objetivo (X horas adelante)
        target_hours = settings.diligencia_notification_hours
        target_time = now + timedelta(hours=target_hours)
        target_date = target_time.date()
        
        logger.info(f"Buscando diligencias próximas para notificar en {target_hours}h (fecha: {target_date})")
        
        # Buscar diligencias que ocurren en X horas que no han sido notificadas
        # Ahora buscamos en la fecha objetivo, no necesariamente "mañana"
        diligencias = db.query(Diligencia).filter(
            and_(
                Diligencia.fecha == target_date,
                Diligencia.notificar == True,
                Diligencia.notificacion_enviada == False,
                Diligencia.estado.in_([EstadoDiligencia.PENDIENTE, EstadoDiligencia.EN_PROGRESO])
            )
        ).all()
        
        notificaciones_creadas = []
        
        for diligencia in diligencias:
            try:
                # Verificar si ya se envió notificación para esta diligencia
                notificacion_existente = db.query(Notificacion).filter(
                    and_(
                        Notificacion.diligencia_id == diligencia.id,
                        Notificacion.tipo == TipoNotificacion.DILIGENCIA_RECORDATORIO,
                        Notificacion.estado.in_([EstadoNotificacion.ENVIADO, EstadoNotificacion.PENDIENTE])
                    )
                ).first()
                
                if notificacion_existente:
                    logger.info(f"Diligencia {diligencia.id} ya tiene notificación automática")
                    continue
                
                # Formatear información de la diligencia
                fecha_hora_str = format_fecha_hora(diligencia.fecha, diligencia.hora)
                
                # Crear notificaciones para cada email configurado
                for email_destino in settings.notification_emails:
                    try:
                        notificacion = Notificacion(
                            diligencia_id=diligencia.id,
                            proceso_id=diligencia.proceso_id,
                            tipo=TipoNotificacion.DILIGENCIA_RECORDATORIO,
                            canal=CanalNotificacion.EMAIL,
                            titulo=f"Recordatorio: Diligencia {diligencia.titulo}",
                            mensaje=f"Recordatorio automático: La diligencia '{diligencia.titulo}' está programada para las {fecha_hora_str}. Motivo: {diligencia.motivo}",
                            destinatario=email_destino,
                            email_destinatario=email_destino,
                            estado=EstadoNotificacion.PENDIENTE
                        )
                        
                        db.add(notificacion)
                        db.flush()
                        
                        # Intentar enviar por email
                        try:
                            NotificacionService._enviar_email(notificacion, None, None)
                            notificacion.estado = EstadoNotificacion.ENVIADO
                            notificacion.fecha_envio = datetime.now()
                            logger.info(f"✅ Email enviado a {email_destino} para diligencia {diligencia.id}")
                            
                        except Exception as e:
                            logger.warning(f"⚠️ No se pudo enviar email a {email_destino} para diligencia {diligencia.id}: {e}")
                            notificacion.estado = EstadoNotificacion.PENDIENTE
                            notificacion.error_mensaje = str(e)
                        
                        notificaciones_creadas.append(notificacion)
                        
                    except Exception as e:
                        logger.error(f"❌ Error creando notificación para {email_destino} en diligencia {diligencia.id}: {e}")
                
                # Marcar diligencia como notificada solo después de intentar todos los emails
                diligencia.notificacion_enviada = True
                
                db.commit()
                
                logger.info(f"✅ Notificación automática registrada para diligencia {diligencia.id}")
                
            except Exception as e:
                logger.error(f"❌ Error notificando diligencia {diligencia.id}: {e}")
                db.rollback()
        
        return notificaciones_creadas
    
    @staticmethod
    def _check_procesos_sin_revisar(db: Session) -> List[Proceso]:
        """Verificar procesos que llevan tiempo sin revisar"""
        
        # Calcular fecha límite (N días atrás)
        limite_fecha = datetime.now() - timedelta(days=settings.proceso_review_notification_days)
        
        logger.info(f"Buscando procesos sin actualizar desde {limite_fecha}")
        
        # Buscar procesos sin actualizar en el tiempo especificado
        procesos = db.query(Proceso).filter(
            and_(
                Proceso.updated_at < limite_fecha,
                or_(
                    Proceso.estado == "En trámite",
                    Proceso.estado == "Activo"
                )
            )
        ).all()
        
        procesos_notificados = []
        
        for proceso in procesos:
            try:
                # Verificar si ya se envió notificación de revisión reciente para este proceso
                notificacion_reciente = db.query(Notificacion).filter(
                    and_(
                        Notificacion.proceso_id == proceso.id,
                        Notificacion.tipo == TipoNotificacion.PROCESO_ACTUALIZADO,
                        Notificacion.created_at >= limite_fecha
                    )
                ).first()
                
                if notificacion_reciente:
                    logger.info(f"Proceso {proceso.id} ya tiene notificación reciente")
                    continue
                
                # Crear notificación de proceso sin revisar para cada email configurado
                dias_sin_revisar = (datetime.now() - proceso.updated_at).days
                
                for email_destino in settings.notification_emails:
                    try:
                        notificacion = Notificacion(
                            proceso_id=proceso.id,
                            tipo=TipoNotificacion.PROCESO_ACTUALIZADO,
                            canal=CanalNotificacion.EMAIL,
                            titulo=f"Proceso {proceso.expediente} - Requiere Revisión",
                            mensaje=f"El proceso {proceso.expediente} lleva {dias_sin_revisar} días sin actualizaciones. Estado actual: {proceso.estado}. Se recomienda revisar y actualizar el estado.",
                            destinatario=email_destino,
                            email_destinatario=email_destino,
                            estado=EstadoNotificacion.PENDIENTE,
                            expediente=proceso.expediente
                        )
                        
                        db.add(notificacion)
                        db.flush()
                        
                        # Intentar enviar por email
                        try:
                            proceso_audiencia = db.query(Audiencia).filter(Audiencia.proceso_id == proceso.id).first()
                            NotificacionService._enviar_email(notificacion, proceso_audiencia, proceso)
                            
                            notificacion.estado = EstadoNotificacion.ENVIADO
                            notificacion.fecha_envio = datetime.now()
                            logger.info(f"✅ Email enviado a {email_destino} para proceso {proceso.id}")
                            
                        except Exception as e:
                            logger.warning(f"⚠️ No se pudo enviar email a {email_destino} para proceso {proceso.id}: {e}")
                            notificacion.estado = EstadoNotificacion.PENDIENTE
                            notificacion.error_mensaje = str(e)
                        
                    except Exception as e:
                        logger.error(f"❌ Error creando notificación para {email_destino} en proceso {proceso.id}: {e}")
                
                db.commit()
                procesos_notificados.append(proceso)
                
                logger.info(f"✅ Notificación automática registrada para proceso {proceso.id}")
                
            except Exception as e:
                logger.error(f"Error notificando proceso {proceso.id}: {e}")
                db.rollback()
        
        return procesos_notificados
    
    @staticmethod
    def get_pending_notifications_summary(db: Session) -> dict:
        """Obtener resumen de notificaciones pendientes"""
        
        now = datetime.now()
        today = now.date()
        tomorrow = today + timedelta(days=1)
        target_time = now + timedelta(hours=settings.audiencia_notification_hours)
        limite_fecha = now - timedelta(days=settings.proceso_review_notification_days)
        
        # Contar audiencias próximas sin notificar
        audiencias_pendientes = db.query(Audiencia).filter(
            and_(
                Audiencia.fecha_hora >= now,
                Audiencia.fecha_hora <= target_time + timedelta(hours=1),
                Audiencia.notificar == True
            )
        ).count()
        
        # Contar diligencias próximas sin notificar
        diligencias_pendientes = db.query(Diligencia).filter(
            and_(
                Diligencia.fecha == tomorrow,
                Diligencia.notificar == True,
                Diligencia.notificacion_enviada == False,
                Diligencia.estado.in_([EstadoDiligencia.PENDIENTE, EstadoDiligencia.EN_PROGRESO])
            )
        ).count()
        
        # Contar procesos sin revisar
        procesos_pendientes = db.query(Proceso).filter(
            and_(
                Proceso.updated_at < limite_fecha,
                or_(
                    Proceso.estado == "En trámite",
                    Proceso.estado == "Activo"
                )
            )
        ).count()
        
        return {
            "audiencias_proximas": audiencias_pendientes,
            "diligencias_proximas": diligencias_pendientes,
            "procesos_sin_revisar": procesos_pendientes,
            "next_check": now + timedelta(minutes=settings.notification_check_interval_minutes)
        }