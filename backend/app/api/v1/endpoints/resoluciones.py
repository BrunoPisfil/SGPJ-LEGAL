from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.resolucion import Resolucion
from app.schemas.resolucion import ResolucionResponse, ResolucionCreate, ResolucionUpdate
from app.services.resolucion import ResolucionService
from app.api.dependencies import get_current_user
from app.models.usuario import Usuario
from app.api.permissions import require_permission

router = APIRouter()


def resolucion_to_response(resolucion: Resolucion) -> dict:
    """Convierte un modelo Resolucion a diccionario para respuesta API"""
    return {
        "id": resolucion.id,
        "proceso_id": resolucion.proceso_id,
        "tipo": resolucion.tipo.value,
        "fecha_notificacion": resolucion.fecha_notificacion,
        "accion_requerida": resolucion.accion_requerida.value,
        "fecha_limite": resolucion.fecha_limite,
        "responsable": resolucion.responsable,
        "estado_accion": resolucion.estado_accion.value,
        "notas": resolucion.notas,
        "created_at": resolucion.created_at,
        "updated_at": resolucion.updated_at,
        "expediente": resolucion.proceso.expediente if resolucion.proceso else None
    }


@router.get("/", response_model=List[ResolucionResponse])
async def get_resoluciones(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    proceso_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener lista de resoluciones con paginación y filtros opcionales"""
    try:
        service = ResolucionService(db)
        resoluciones = service.get_resoluciones(skip=skip, limit=limit, proceso_id=proceso_id)
        
        return [resolucion_to_response(resolucion) for resolucion in resoluciones]
    except Exception as e:
        print(f"Error getting resoluciones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{resolucion_id}", response_model=ResolucionResponse)
async def get_resolucion(
    resolucion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener una resolución específica por ID"""
    try:
        service = ResolucionService(db)
        resolucion = service.get_resolucion_by_id(resolucion_id)
        
        if not resolucion:
            raise HTTPException(status_code=404, detail="Resolución no encontrada")
            
        return resolucion_to_response(resolucion)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting resolucion {resolucion_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ResolucionResponse)
async def create_resolucion(
    resolucion_data: ResolucionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("resoluciones", "create"))
):
    """Crear una nueva resolución - Solo admin puede crear"""
    try:
        service = ResolucionService(db)
        resolucion = service.create_resolucion(resolucion_data)
        
        return resolucion_to_response(resolucion)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating resolucion: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{resolucion_id}", response_model=ResolucionResponse)
async def update_resolucion(
    resolucion_id: int,
    resolucion_update: ResolucionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("resoluciones", "update"))
):
    """Actualizar una resolución existente - Solo admin puede editar"""
    try:
        service = ResolucionService(db)
        resolucion = service.update_resolucion(resolucion_id, resolucion_update)
        
        if not resolucion:
            raise HTTPException(status_code=404, detail="Resolución no encontrada")
            
        return resolucion_to_response(resolucion)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating resolucion {resolucion_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{resolucion_id}")
async def delete_resolucion(
    resolucion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("resoluciones", "delete"))
):
    """Eliminar una resolución - Solo admin puede eliminar"""
    try:
        service = ResolucionService(db)
        deleted = service.delete_resolucion(resolucion_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Resolución no encontrada")
            
        return {"message": "Resolución eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting resolucion {resolucion_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proceso/{proceso_id}", response_model=List[ResolucionResponse])
async def get_resoluciones_by_proceso(
    proceso_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener todas las resoluciones de un proceso específico"""
    try:
        service = ResolucionService(db)
        resoluciones = service.get_resoluciones_by_proceso(proceso_id)
        
        return [resolucion_to_response(resolucion) for resolucion in resoluciones]
    except Exception as e:
        print(f"Error getting resoluciones for proceso {proceso_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))