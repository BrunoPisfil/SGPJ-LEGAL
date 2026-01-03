from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.api.dependencies import get_current_user, get_db
from app.schemas.audiencia import (
    AudienciaCreate, AudienciaUpdate, AudienciaResponse, AudienciaList
)
from app.services.audiencia import AudienciaService
from app.api.permissions import require_permission

router = APIRouter()


@router.get("/", response_model=AudienciaList)
async def get_audiencias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    proceso_id: Optional[int] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    tipo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener lista de audiencias con filtros opcionales"""
    try:
        audiencias, total = AudienciaService.get_all(
            db=db,
            skip=skip,
            limit=limit,
            proceso_id=proceso_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            tipo=tipo
        )
        
        return AudienciaList(
            audiencias=audiencias,
            total=total,
            page=(skip // limit) + 1,
            per_page=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener audiencias: {str(e)}")


@router.post("/", response_model=AudienciaResponse)
async def create_audiencia(
    audiencia_data: AudienciaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("audiencias", "create"))
):
    """Crear nueva audiencia - Admin y practicantes pueden crear"""
    try:
        audiencia = AudienciaService.create(db=db, audiencia_data=audiencia_data)
        return audiencia
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear audiencia: {str(e)}")


@router.get("/{audiencia_id}", response_model=AudienciaResponse)
async def get_audiencia(
    audiencia_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener audiencia por ID"""
    try:
        audiencia = AudienciaService.get_by_id(db=db, audiencia_id=audiencia_id)
        return audiencia
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener audiencia: {str(e)}")


@router.put("/{audiencia_id}", response_model=AudienciaResponse)
async def update_audiencia(
    audiencia_id: int,
    audiencia_data: AudienciaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("audiencias", "update"))
):
    """Actualizar audiencia - Admin y practicantes pueden editar"""
    try:
        audiencia = AudienciaService.update(
            db=db, 
            audiencia_id=audiencia_id, 
            audiencia_data=audiencia_data
        )
        return audiencia
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar audiencia: {str(e)}")


@router.delete("/{audiencia_id}")
async def delete_audiencia(
    audiencia_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("audiencias", "delete"))
):
    """Eliminar audiencia - Solo admin puede eliminar"""
    try:
        AudienciaService.delete(db=db, audiencia_id=audiencia_id)
        return {"message": "Audiencia eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar audiencia: {str(e)}")


@router.get("/proceso/{proceso_id}", response_model=list[AudienciaResponse])
async def get_audiencias_by_proceso(
    proceso_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener todas las audiencias de un proceso específico"""
    try:
        audiencias = AudienciaService.get_by_proceso(db=db, proceso_id=proceso_id)
        return audiencias
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener audiencias del proceso: {str(e)}")


@router.get("/proximas/list", response_model=list[AudienciaResponse])
async def get_proximas_audiencias(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener próximas audiencias"""
    try:
        audiencias = AudienciaService.get_proximas(db=db, limit=limit)
        return audiencias
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener próximas audiencias: {str(e)}")