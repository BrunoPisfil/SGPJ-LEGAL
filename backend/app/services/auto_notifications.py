"""
Servicio de notificaciones automáticas para SGPJ Legal
Maneja:
- Notificaciones de audiencias 24 horas antes
- Notificaciones de procesos sin revisar
- Envío automático por email y sistema
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import List, Tuple
import logging

from backend.app.core.config import settings
from backend.app.models.audiencia import Audiencia
from backend.app.models.proceso import Proceso
from backend.app.models.notificacion import Notificacion, TipoNotificacion, CanalNotificacion, EstadoNotificacion
from backend.app.services.notificacion import NotificacionService
from backend.app.schemas.notificacion import EnviarNotificacionRequest

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
            "procesos": 0,
            "errors": []
        }
        
        try:
            # Notificar audiencias próximas
            audiencias_notificadas = AutoNotificationService._check_audiencias_proximas(db)
            stats["audiencias"] = len(audiencias_notificadas)
            
            # Notificar procesos sin revisar
            procesos_notificados = AutoNotificationService._check_procesos_sin_revisar(db)
            stats["procesos"] = len(procesos_notificados)
            
            logger.info(f"Notificaciones enviadas - Audiencias: {stats['audiencias']}, Procesos: {stats['procesos']}")
            
        except Exception as e:
            logger.error(f"Error en notificaciones automáticas: {e}")
            stats["errors"].append(str(e))
        
        return stats
    
    @staticmethod
    def _check_audiencias_proximas(db: Session) -> List[Audiencia]:
        """Verificar audiencias que necesitan notificación 24h antes"""
        
        # Calcular el rango de tiempo (24 horas ± 1 hora para dar margen)
        now = datetime.now()
        target_time = now + timedelta(hours=settings.audiencia_notification_hours)
        time_margin = timedelta(hours=1)
        
        start_range = target_time - time_margin
        end_range = target_time + time_margin
        
        logger.info(f"Buscando audiencias entre {start_range} y {end_range}")
        
        # Buscar audiencias en el rango de tiempo que no han sido notificadas automáticamente
        audiencias = db.query(Audiencia).filter(
            and_(
                Audiencia.fecha_hora >= start_range,
                Audiencia.fecha_hora <= end_range,
                Audiencia.notificar == True  # Usar el campo notificar en lugar de activo
            )
        ).all()
        
        audiencias_notificadas = []
        
        for audiencia in audiencias:
            try:
                # Verificar si ya se envió notificación automática para esta audiencia
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
                
                # Enviar notificación automática
                request = EnviarNotificacionRequest(
                    audiencia_id=audiencia.id,
                    canales=['sistema', 'email'],
                    email_destinatario=settings.default_notification_email,
                    mensaje_personalizado=f"Recordatorio automático: Su audiencia está programada para las {audiencia.fecha_hora.strftime('%H:%M')} del {audiencia.fecha_hora.strftime('%d/%m/%Y')}"
                )
                
                notificaciones = NotificacionService.enviar_notificacion_audiencia(db, request)
                audiencias_notificadas.extend(notificaciones)
                
                logger.info(f"Notificación automática enviada para audiencia {audiencia.id}")
                
            except Exception as e:
                logger.error(f"Error notificando audiencia {audiencia.id}: {e}")
        
        return audiencias_notificadas
    
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
                        Notificacion.fecha_creacion >= limite_fecha
                    )
                ).first()
                
                if notificacion_reciente:
                    logger.info(f"Proceso {proceso.id} ya tiene notificación reciente")
                    continue
                
                # Crear notificación de proceso sin revisar
                dias_sin_revisar = (datetime.now() - proceso.updated_at).days
                
                notificacion = Notificacion(
                    proceso_id=proceso.id,
                    tipo=TipoNotificacion.PROCESO_ACTUALIZADO,
                    canal=CanalNotificacion.SISTEMA,
                    titulo=f"Proceso {proceso.expediente} - Requiere Revisión",
                    mensaje=f"El proceso {proceso.expediente} lleva {dias_sin_revisar} días sin actualizaciones. Estado actual: {proceso.estado}. Se recomienda revisar y actualizar el estado.",
                    destinatario=settings.default_notification_email,
                    estado=EstadoNotificacion.PENDIENTE,
                    expediente=proceso.expediente
                )
                
                db.add(notificacion)
                db.flush()
                
                # Enviar por email también
                try:
                    proceso_audiencia = db.query(Audiencia).filter(Audiencia.proceso_id == proceso.id).first()
                    NotificacionService._enviar_email(notificacion, proceso_audiencia, proceso)
                    
                    notificacion.estado = EstadoNotificacion.ENVIADO
                    notificacion.fecha_envio = datetime.now()
                    
                except Exception as e:
                    logger.error(f"Error enviando email para proceso {proceso.id}: {e}")
                    notificacion.estado = EstadoNotificacion.ERROR
                    notificacion.error_mensaje = str(e)
                
                db.commit()
                procesos_notificados.append(proceso)
                
                logger.info(f"Notificación de revisión enviada para proceso {proceso.id}")
                
            except Exception as e:
                logger.error(f"Error notificando proceso {proceso.id}: {e}")
                db.rollback()
        
        return procesos_notificados
    
    @staticmethod
    def get_pending_notifications_summary(db: Session) -> dict:
        """Obtener resumen de notificaciones pendientes"""
        
        now = datetime.now()
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
            "procesos_sin_revisar": procesos_pendientes,
            "next_check": now + timedelta(minutes=settings.notification_check_interval_minutes)
        }