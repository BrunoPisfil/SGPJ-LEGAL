"""
API endpoints para gestión de partes de procesos
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.parte_proceso import ParteProceso
from app.models.proceso import Proceso
from app.schemas.parte_proceso import (
    ParteProcesoCreate, 
    ParteProcesoUpdate, 
    ParteProcesoSchema,
    ParteProcesoDetalle
)

router = APIRouter()


@router.get("/procesos/{proceso_id}/partes", response_model=List[ParteProcesoDetalle])
def get_partes_proceso(
    proceso_id: int,
    db: Session = Depends(get_db)
):
    """Obtener todas las partes de un proceso"""
    # Verificar que el proceso existe
    proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
    if not proceso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    partes = db.query(ParteProceso).filter(
        ParteProceso.proceso_id == proceso_id
    ).all()
    
    return partes


@router.post("/procesos/{proceso_id}/partes", response_model=ParteProcesoSchema)
def create_parte_proceso(
    proceso_id: int,
    parte_data: ParteProcesoCreate,
    db: Session = Depends(get_db)
):
    """Agregar una nueva parte a un proceso"""
    # Verificar que el proceso existe
    proceso = db.query(Proceso).filter(Proceso.id == proceso_id).first()
    if not proceso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proceso no encontrado"
        )
    
    # Crear la nueva parte
    parte_data.proceso_id = proceso_id
    nueva_parte = ParteProceso(**parte_data.dict())
    
    db.add(nueva_parte)
    db.commit()
    db.refresh(nueva_parte)
    
    return nueva_parte


@router.put("/partes/{parte_id}", response_model=ParteProcesoSchema)
def update_parte_proceso(
    parte_id: int,
    parte_update: ParteProcesoUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una parte del proceso"""
    parte = db.query(ParteProceso).filter(ParteProceso.id == parte_id).first()
    if not parte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parte no encontrada"
        )
    
    # Actualizar campos
    for field, value in parte_update.dict(exclude_unset=True).items():
        setattr(parte, field, value)
    
    db.commit()
    db.refresh(parte)
    
    return parte


@router.patch("/procesos/{proceso_id}/partes/{cliente_id}", response_model=ParteProcesoSchema)
def update_parte_tipo(
    proceso_id: int,
    cliente_id: int,
    tipo_parte_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Actualizar el tipo de parte de un cliente en un proceso específico"""
    tipo_parte = tipo_parte_data.get("tipo_parte")
    
    if not tipo_parte or tipo_parte not in ["demandante", "demandado", "tercero"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tipo_parte debe ser 'demandante', 'demandado' o 'tercero'"
        )
    
    # Buscar la parte específica
    parte = db.query(ParteProceso).filter(
        ParteProceso.proceso_id == proceso_id,
        ParteProceso.cliente_id == cliente_id
    ).first()
    
    if not parte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parte no encontrada en este proceso"
        )
    
    # Actualizar tipo_parte
    parte.tipo_parte = tipo_parte
    
    db.commit()
    db.refresh(parte)
    
    return parte


@router.delete("/partes/{parte_id}")
def delete_parte_proceso(
    parte_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar una parte del proceso"""
    parte = db.query(ParteProceso).filter(ParteProceso.id == parte_id).first()
    if not parte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parte no encontrada"
        )
    
    # Verificar que no sea la única parte del proceso
    total_partes = db.query(ParteProceso).filter(
        ParteProceso.proceso_id == parte.proceso_id
    ).count()
    
    if total_partes <= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la parte. Un proceso debe tener al menos un demandante y un demandado"
        )
    
    db.delete(parte)
    db.commit()
    
    return {"message": "Parte eliminada exitosamente"}


@router.get("/procesos/{proceso_id}/partes/demandantes", response_model=List[ParteProcesoSchema])
def get_demandantes_proceso(
    proceso_id: int,
    db: Session = Depends(get_db)
):
    """Obtener todos los demandantes de un proceso"""
    demandantes = db.query(ParteProceso).filter(
        ParteProceso.proceso_id == proceso_id,
        ParteProceso.tipo_parte == 'demandante'
    ).all()
    
    return demandantes


@router.get("/procesos/{proceso_id}/partes/demandados", response_model=List[ParteProcesoSchema])
def get_demandados_proceso(
    proceso_id: int,
    db: Session = Depends(get_db)
):
    """Obtener todos los demandados de un proceso"""
    demandados = db.query(ParteProceso).filter(
        ParteProceso.proceso_id == proceso_id,
        ParteProceso.tipo_parte == 'demandado'
    ).all()
    
    return demandados


@router.get("/procesos/{proceso_id}/partes/nuestros-clientes", response_model=List[ParteProcesoSchema])
def get_nuestros_clientes_proceso(
    proceso_id: int,
    db: Session = Depends(get_db)
):
    """Obtener nuestros clientes en un proceso"""
    clientes = db.query(ParteProceso).filter(
        ParteProceso.proceso_id == proceso_id,
        ParteProceso.es_nuestro_cliente == True
    ).all()
    
    return clientes