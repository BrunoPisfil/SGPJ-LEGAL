from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.api.dependencies import get_current_user, get_db
from backend.app.schemas.notificacion import (
    NotificacionCreate, NotificacionUpdate, NotificacionResponse, 
    NotificacionList, EnviarNotificacionRequest, 
    EstadoNotificacionEnum, TipoNotificacionEnum, CanalNotificacionEnum
)
from backend.app.services.notificacion import NotificacionService

router = APIRouter()


@router.get("/", response_model=NotificacionList)
async def get_notificaciones(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    estado: Optional[EstadoNotificacionEnum] = Query(None),
    tipo: Optional[TipoNotificacionEnum] = Query(None),
    canal: Optional[CanalNotificacionEnum] = Query(None),
    solo_no_leidas: bool = Query(False),
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)  # Temporalmente deshabilitado para pruebas
):
    """Obtener lista de notificaciones con filtros opcionales"""
    try:
        notificaciones, total, no_leidas = NotificacionService.get_all(
            db=db,
            skip=skip,
            limit=limit,
            estado=estado,
            tipo=tipo,
            canal=canal,
            solo_no_leidas=solo_no_leidas
        )
        
        return NotificacionList(
            notificaciones=notificaciones,
            total=total,
            no_leidas=no_leidas,
            page=(skip // limit) + 1,
            per_page=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener notificaciones: {str(e)}")


@router.post("/", response_model=NotificacionResponse)
async def create_notificacion(
    notificacion_data: NotificacionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crear nueva notificación"""
    try:
        notificacion = NotificacionService.create(db=db, notificacion_data=notificacion_data)
        return notificacion
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear notificación: {str(e)}")


@router.get("/{notificacion_id}", response_model=NotificacionResponse)
async def get_notificacion(
    notificacion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener notificación por ID"""
    try:
        notificacion = NotificacionService.get_by_id(db=db, notificacion_id=notificacion_id)
        return notificacion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener notificación: {str(e)}")


@router.put("/{notificacion_id}", response_model=NotificacionResponse)
async def update_notificacion(
    notificacion_id: int,
    notificacion_data: NotificacionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar notificación"""
    try:
        notificacion = NotificacionService.update(
            db=db, 
            notificacion_id=notificacion_id, 
            notificacion_data=notificacion_data
        )
        return notificacion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar notificación: {str(e)}")


@router.put("/{notificacion_id}/marcar-leida", response_model=NotificacionResponse)
async def marcar_notificacion_leida(
    notificacion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Marcar notificación como leída"""
    try:
        notificacion = NotificacionService.marcar_como_leida(
            db=db, 
            notificacion_id=notificacion_id
        )
        return notificacion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al marcar notificación como leída: {str(e)}")


@router.delete("/{notificacion_id}")
async def eliminar_notificacion(
    notificacion_id: int,
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user)  # Temporalmente deshabilitado para pruebas
):
    """Eliminar notificación"""
    try:
        success = NotificacionService.delete(db=db, notificacion_id=notificacion_id)
        if not success:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        return {"message": "Notificación eliminada correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar notificación: {str(e)}")


@router.post("/enviar-audiencia", response_model=list[NotificacionResponse])
async def enviar_notificacion_audiencia(
    request: EnviarNotificacionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Enviar notificación de audiencia por email y/o SMS"""
    try:
        notificaciones = NotificacionService.enviar_notificacion_audiencia(
            db=db, 
            request=request
        )
        return notificaciones
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar notificación: {str(e)}")


@router.get("/stats/resumen")
async def get_stats_notificaciones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener estadísticas de notificaciones"""
    try:
        _, total, no_leidas = NotificacionService.get_all(db=db, limit=1)
        
        return {
            "total_notificaciones": total,
            "no_leidas": no_leidas,
            "leidas": total - no_leidas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")


# Importar servicio de notificaciones automáticas
from backend.app.services.auto_notifications import AutoNotificationService

@router.post("/auto-check", response_model=dict)
async def ejecutar_notificaciones_automaticas(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Ejecutar verificación y envío de notificaciones automáticas"""
    try:
        stats = AutoNotificationService.check_and_send_notifications(db)
        return {
            "message": "Verificación de notificaciones automáticas completada",
            "audiencias_notificadas": stats["audiencias"],
            "procesos_notificados": stats["procesos"],
            "errores": stats["errors"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en notificaciones automáticas: {str(e)}")


@router.get("/auto-summary", response_model=dict)
async def obtener_resumen_notificaciones_pendientes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener resumen de notificaciones automáticas pendientes"""
    try:
        summary = AutoNotificationService.get_pending_notifications_summary(db)
        return {
            "audiencias_proximas_24h": summary["audiencias_proximas"],
            "procesos_sin_revisar": summary["procesos_sin_revisar"],
            "proxima_verificacion": summary["next_check"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen: {str(e)}")