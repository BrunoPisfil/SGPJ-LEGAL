from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import Optional, List
from datetime import datetime
from fastapi import HTTPException
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.models.notificacion import Notificacion, TipoNotificacion, CanalNotificacion, EstadoNotificacion
from app.models.audiencia import Audiencia
from app.models.proceso import Proceso
from app.schemas.notificacion import NotificacionCreate, NotificacionUpdate, EnviarNotificacionRequest
from app.core.config import settings


class NotificacionService:
    """Servicio para gestión de notificaciones"""

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        estado: Optional[EstadoNotificacion] = None,
        tipo: Optional[TipoNotificacion] = None,
        canal: Optional[CanalNotificacion] = None,
        solo_no_leidas: bool = False
    ) -> tuple[List[Notificacion], int, int]:
        """Obtener todas las notificaciones con filtros opcionales"""
        query = db.query(Notificacion)
        
        # Aplicar filtros
        if estado:
            query = query.filter(Notificacion.estado == estado)
            
        if tipo:
            query = query.filter(Notificacion.tipo == tipo)
            
        if canal:
            query = query.filter(Notificacion.canal == canal)

        if solo_no_leidas:
            query = query.filter(Notificacion.fecha_leida.is_(None))

        total = query.count()
        no_leidas = db.query(Notificacion).filter(Notificacion.fecha_leida.is_(None)).count()
        
        notificaciones = query.order_by(desc(Notificacion.created_at)).offset(skip).limit(limit).all()
        
        return notificaciones, total, no_leidas

    @staticmethod
    def get_by_id(db: Session, notificacion_id: int) -> Notificacion:
        """Obtener notificación por ID"""
        notificacion = db.query(Notificacion).filter(Notificacion.id == notificacion_id).first()
        if not notificacion:
            raise HTTPException(status_code=404, detail=f"Notificación con ID {notificacion_id} no encontrada")
        return notificacion

    @staticmethod
    def create(db: Session, notificacion_data: NotificacionCreate) -> Notificacion:
        """Crear nueva notificación"""
        notificacion = Notificacion(**notificacion_data.model_dump())
        db.add(notificacion)
        db.commit()
        db.refresh(notificacion)
        return notificacion

    @staticmethod
    def update(db: Session, notificacion_id: int, notificacion_data: NotificacionUpdate) -> Notificacion:
        """Actualizar notificación existente"""
        notificacion = NotificacionService.get_by_id(db, notificacion_id)
        
        update_data = notificacion_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(notificacion, field, value)
        
        db.commit()
        db.refresh(notificacion)
        return notificacion

    @staticmethod
    def marcar_como_leida(db: Session, notificacion_id: int) -> Notificacion:
        """Marcar notificación como leída"""
        return NotificacionService.update(
            db, 
            notificacion_id, 
            NotificacionUpdate(
                estado=EstadoNotificacion.LEIDA,
                fecha_leida=datetime.now()
            )
        )

    @staticmethod
    def delete(db: Session, notificacion_id: int) -> bool:
        """Eliminar notificación"""
        notificacion = db.query(Notificacion).filter(Notificacion.id == notificacion_id).first()
        if not notificacion:
            return False
        
        db.delete(notificacion)
        db.commit()
        return True

    @staticmethod
    def enviar_notificacion_audiencia(
        db: Session, 
        request: EnviarNotificacionRequest
    ) -> List[Notificacion]:
        """Enviar notificación de audiencia por los canales especificados"""
        
        # Obtener la audiencia y proceso relacionado
        audiencia = db.query(Audiencia).filter(Audiencia.id == request.audiencia_id).first()
        if not audiencia:
            raise HTTPException(status_code=404, detail="Audiencia no encontrada")
        
        proceso = db.query(Proceso).filter(Proceso.id == audiencia.proceso_id).first()
        if not proceso:
            raise HTTPException(status_code=404, detail="Proceso no encontrado")

        notificaciones_creadas = []

        for canal in request.canales:
            # Crear el contenido de la notificación
            titulo, mensaje = NotificacionService._generar_contenido_audiencia(
                audiencia, proceso, request.mensaje_personalizado
            )
            
            # Crear la notificación en la base de datos
            notificacion_data = NotificacionCreate(
                audiencia_id=audiencia.id,
                proceso_id=proceso.id,
                tipo=TipoNotificacion.AUDIENCIA_RECORDATORIO,
                canal=canal,
                titulo=titulo,
                mensaje=mensaje,
                email_destinatario=request.email_destinatario if canal == CanalNotificacion.EMAIL else None,
                telefono_destinatario=request.telefono_destinatario if canal == CanalNotificacion.SMS else None,
                metadata_extra=json.dumps({
                    "expediente": proceso.expediente,
                    "tipo_audiencia": audiencia.tipo,
                    "fecha_audiencia": audiencia.fecha.isoformat(),
                    "hora_audiencia": audiencia.hora.strftime("%H:%M")
                })
            )
            
            notificacion = NotificacionService.create(db, notificacion_data)
            
            # Intentar enviar la notificación
            try:
                if canal == CanalNotificacion.EMAIL:
                    NotificacionService._enviar_email(notificacion, audiencia, proceso)
                elif canal == CanalNotificacion.SMS:
                    NotificacionService._enviar_sms(notificacion, audiencia, proceso)
                
                # Marcar como enviada
                NotificacionService.update(
                    db, 
                    notificacion.id,
                    NotificacionUpdate(
                        estado=EstadoNotificacion.ENVIADO,
                        fecha_envio=datetime.now()
                    )
                )
                
            except Exception as e:
                # Marcar como error
                NotificacionService.update(
                    db,
                    notificacion.id,
                    NotificacionUpdate(
                        estado=EstadoNotificacion.ERROR,
                        error_mensaje=str(e)
                    )
                )
            
            notificaciones_creadas.append(notificacion)

        return notificaciones_creadas

    @staticmethod
    def _generar_contenido_audiencia(
        audiencia: Audiencia, 
        proceso: Proceso, 
        mensaje_personalizado: Optional[str] = None
    ) -> tuple[str, str]:
        """Generar título y mensaje para notificación de audiencia"""
        
        titulo = f"Recordatorio: Audiencia {audiencia.tipo}"
        
        if mensaje_personalizado:
            mensaje = mensaje_personalizado
        else:
            fecha_str = audiencia.fecha.strftime("%d/%m/%Y")
            hora_str = audiencia.hora.strftime("%H:%M")
            
            mensaje = f"""Se le recuerda que tiene una audiencia programada:\r\n\r\n📋 Expediente: {proceso.expediente}\r\n\r\n📅 Fecha: {fecha_str}\r\n\r\n⏰ Hora: {hora_str}\r\n\r\n📍 Tipo: {audiencia.tipo}\r\n\r\n🏛️ Materia: {proceso.materia}\r\n\r\nDemandante(s): {proceso.demandantes_nombres}\r\n\r\nDemandado(s): {proceso.demandados_nombres}"""

            if audiencia.sede:
                mensaje += f"\r\n\r\n🏢 Sede: {audiencia.sede}"
            elif audiencia.link:
                mensaje += f"\r\n\r\n💻 Enlace virtual: {audiencia.link}"
                
            if audiencia.notas:
                mensaje += f"\r\n\r\n📝 Notas adicionales:\r\n{audiencia.notas}"

        return titulo, mensaje.strip()

    @staticmethod
    def _enviar_email(notificacion: Notificacion, audiencia: Audiencia, proceso: Proceso):
        """Enviar notificación por email"""
        if not settings.email_enabled:
            raise ValueError("El envío de emails está deshabilitado")
            
        if not notificacion.email_destinatario:
            raise ValueError("Email destinatario no especificado")

        if not settings.smtp_username or not settings.smtp_password:
            raise ValueError("Credenciales SMTP no configuradas")

        # Crear el mensaje HTML más completo
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{notificacion.titulo}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f8fafc; padding: 20px; }}
                .footer {{ background-color: #e2e8f0; padding: 15px; text-align: center; font-size: 0.9em; }}
                .highlight {{ background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 10px; margin: 15px 0; }}
                .btn {{ display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{settings.email_from_name}</h1>
                    <p>Notificaciones del sistema de Pisfil Leon Abogado & Asociados</p>
                </div>
                <div class="content">
                    <h2>{notificacion.titulo}</h2>
                    <div style="white-space: pre-line; font-family: Arial, sans-serif;">
                        {notificacion.mensaje}
                    </div>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático de Pisfil Leon Abogados & Asociados.</p>
                    <p>Por favor, no responda a este correo.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Crear el mensaje
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{settings.email_from_name} <{settings.email_from}>"
        msg['To'] = notificacion.email_destinatario
        msg['Subject'] = notificacion.titulo
        
        # Agregar versión texto plano y HTML
        msg.attach(MIMEText(notificacion.mensaje, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # Enviar el email
        with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)

    @staticmethod
    def _enviar_sms(notificacion: Notificacion, audiencia: Audiencia, proceso: Proceso):
        """Enviar notificación por SMS usando Twilio"""
        if not notificacion.telefono_destinatario:
            raise ValueError("Teléfono destinatario no especificado")
        
        # Esta implementación requiere Twilio
        # Por ahora, solo simulamos el envío
        print(f"SMS simulado enviado a {notificacion.telefono_destinatario}")
        print(f"Mensaje: {notificacion.mensaje}")
        
        # Implementación real con Twilio:
        # from twilio.rest import Client
        # client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        # message = client.messages.create(
        #     body=notificacion.mensaje,
        #     from_=settings.twilio_phone_number,
        #     to=notificacion.telefono_destinatario
        # )