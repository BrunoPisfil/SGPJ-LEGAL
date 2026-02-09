"""
Endpoints para monitoreo y debugging de notificaciones automáticas
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.timezone import get_current_time_peru
from app.services.auto_notifications import AutoNotificationService
from app.models.notificacion import Notificacion, EstadoNotificacion
from app.models.diligencia import Diligencia

router = APIRouter(prefix="/api/v1/admin/notificaciones-automaticas", tags=["Admin - Notificaciones Automáticas"])

logger = logging.getLogger(__name__)


@router.get("/status")
async def get_notification_status(db: Session = Depends(get_db)):
    """
    Obtener estado actual del sistema de notificaciones automáticas
    """
    try:
        summary = AutoNotificationService.get_pending_notifications_summary(db)
        
        return {
            "status": "ok",
            "timestamp": get_current_time_peru().isoformat(),
            "pending": summary,
            "scheduler": {
                "enabled": True,
                "check_interval_minutes": 60,
                "next_check": summary.get("next_check").isoformat() if summary.get("next_check") else None
            }
        }
    except Exception as e:
        logger.error(f"Error obteniendo estado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-now")
async def run_notification_check_now(db: Session = Depends(get_db)):
    """
    Ejecutar verificación de notificaciones ahora (sin esperar al scheduler)
    """
    try:
        stats = AutoNotificationService.check_and_send_notifications(db)
        
        return {
            "status": "ok",
            "message": "Verificación completada",
            "results": {
                "audiencias_notificadas": stats.get("audiencias", 0),
                "diligencias_notificadas": stats.get("diligencias", 0),
                "procesos_notificados": stats.get("procesos", 0),
                "errors": stats.get("errors", [])
            },
            "timestamp": get_current_time_peru().isoformat()
        }
    except Exception as e:
        logger.error(f"Error en verificación manual: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/recent")
async def get_recent_notification_logs(
    limit: int = 50,
    type_filter: str = None,
    db: Session = Depends(get_db)
):
    """
    Obtener los últimos logs de notificaciones
    type_filter: 'DILIGENCIA_RECORDATORIO', 'AUDIENCIA_RECORDATORIO', etc.
    """
    try:
        query = db.query(Notificacion).order_by(Notificacion.fecha_creacion.desc())
        
        if type_filter:
            query = query.filter(Notificacion.tipo == type_filter)
        
        notificaciones = query.limit(limit).all()
        
        return {
            "count": len(notificaciones),
            "notificaciones": [
                {
                    "id": n.id,
                    "tipo": n.tipo,
                    "titulo": n.titulo,
                    "estado": n.estado,
                    "fecha_creacion": n.fecha_creacion.isoformat(),
                    "fecha_envio": n.fecha_envio.isoformat() if n.fecha_envio else None,
                    "email_destinatario": n.email_destinatario,
                    "diligencia_id": n.diligencia_id,
                    "audiencia_id": n.audiencia_id,
                    "proceso_id": n.proceso_id,
                    "error_mensaje": n.error_mensaje
                }
                for n in notificaciones
            ]
        }
    except Exception as e:
        logger.error(f"Error obteniendo logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/diligencias/proximas")
async def get_diligencias_proximas_a_notificar(db: Session = Depends(get_db)):
    """
    Obtener diligencias que se notificarán en el próximo ciclo
    """
    try:
        from sqlalchemy import and_
        from app.models.diligencia import EstadoDiligencia
        
        now = get_current_time_peru()
        today = now.date()
        tomorrow = today + timedelta(days=1)
        
        # Diligencias que serán notificadas mañana
        diligencias = db.query(Diligencia).filter(
            and_(
                Diligencia.fecha == tomorrow,
                Diligencia.notificar == True,
                Diligencia.notificacion_enviada == False,
                Diligencia.estado.in_([EstadoDiligencia.PENDIENTE, EstadoDiligencia.EN_PROGRESO])
            )
        ).all()
        
        return {
            "fecha_notificacion": tomorrow.isoformat(),
            "total": len(diligencias),
            "diligencias": [
                {
                    "id": d.id,
                    "titulo": d.titulo,
                    "motivo": d.motivo,
                    "fecha": d.fecha.isoformat(),
                    "hora": d.hora.isoformat() if d.hora else None,
                    "estado": d.estado,
                    "notificacion_enviada": d.notificacion_enviada,
                    "descripcion": d.descripcion
                }
                for d in diligencias
            ]
        }
    except Exception as e:
        logger.error(f"Error obteniendo diligencias próximas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notificaciones/por-diligencia/{diligencia_id}")
async def get_notificaciones_diligencia(diligencia_id: int, db: Session = Depends(get_db)):
    """
    Obtener todas las notificaciones asociadas a una diligencia
    """
    try:
        notificaciones = db.query(Notificacion).filter(
            Notificacion.diligencia_id == diligencia_id
        ).order_by(Notificacion.fecha_creacion.desc()).all()
        
        return {
            "diligencia_id": diligencia_id,
            "total": len(notificaciones),
            "notificaciones": [
                {
                    "id": n.id,
                    "tipo": n.tipo,
                    "titulo": n.titulo,
                    "mensaje": n.mensaje,
                    "estado": n.estado,
                    "canal": n.canal,
                    "fecha_creacion": n.fecha_creacion.isoformat(),
                    "fecha_envio": n.fecha_envio.isoformat() if n.fecha_envio else None,
                    "email_destinatario": n.email_destinatario,
                    "error_mensaje": n.error_mensaje
                }
                for n in notificaciones
            ]
        }
    except Exception as e:
        logger.error(f"Error obteniendo notificaciones de diligencia: {e}")
        raise HTTPException(status_code=500, detail=str(e))
