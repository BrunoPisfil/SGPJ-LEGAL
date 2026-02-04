"""
Endpoints para gestión de Diligencias
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.diligencia import DiligenciaService
from app.schemas.diligencia import DiligenciaCreate, DiligenciaUpdate, DiligenciaResponse, DiligenciaListResponse

router = APIRouter(
    prefix="/diligencias",
    tags=["diligencias"],
    responses={404: {"description": "Not found"}}
)


@router.post("", response_model=DiligenciaResponse, status_code=status.HTTP_201_CREATED)
def crear_diligencia(diligencia: DiligenciaCreate, db: Session = Depends(get_db)):
    """Crear una nueva diligencia"""
    try:
        db_diligencia = DiligenciaService.crear_diligencia(db, diligencia)
        return DiligenciaResponse.from_orm(db_diligencia)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear diligencia: {str(e)}"
        )


@router.get("", response_model=List[DiligenciaListResponse])
def listar_diligencias(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Listar todas las diligencias"""
    try:
        diligencias = DiligenciaService.obtener_todas_diligencias(db, skip=skip, limit=limit)
        return [DiligenciaListResponse.from_orm(d) for d in diligencias]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar diligencias: {str(e)}"
        )


@router.get("/proceso/{proceso_id}", response_model=List[DiligenciaListResponse])
def listar_diligencias_proceso(
    proceso_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Listar diligencias de un proceso específico"""
    try:
        diligencias = DiligenciaService.obtener_diligencias_proceso(
            db, proceso_id=proceso_id, skip=skip, limit=limit
        )
        return [DiligenciaListResponse.from_orm(d) for d in diligencias]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar diligencias: {str(e)}"
        )


@router.get("/{diligencia_id}", response_model=DiligenciaResponse)
def obtener_diligencia(diligencia_id: int, db: Session = Depends(get_db)):
    """Obtener una diligencia específica"""
    try:
        diligencia = DiligenciaService.obtener_diligencia(db, diligencia_id)
        if not diligencia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Diligencia con ID {diligencia_id} no encontrada"
            )
        return DiligenciaResponse.from_orm(diligencia)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener diligencia: {str(e)}"
        )


@router.put("/{diligencia_id}", response_model=DiligenciaResponse)
def actualizar_diligencia(
    diligencia_id: int,
    diligencia: DiligenciaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una diligencia"""
    try:
        db_diligencia = DiligenciaService.actualizar_diligencia(db, diligencia_id, diligencia)
        if not db_diligencia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Diligencia con ID {diligencia_id} no encontrada"
            )
        return DiligenciaResponse.from_orm(db_diligencia)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar diligencia: {str(e)}"
        )


@router.delete("/{diligencia_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_diligencia(diligencia_id: int, db: Session = Depends(get_db)):
    """Eliminar una diligencia"""
    try:
        eliminada = DiligenciaService.eliminar_diligencia(db, diligencia_id)
        if not eliminada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Diligencia con ID {diligencia_id} no encontrada"
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar diligencia: {str(e)}"
        )
