"""
Schemas de Pydantic para ParteProceso
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


class TipoParteEnum(str, Enum):
    demandante = "demandante"
    demandado = "demandado"
    tercero = "tercero"


class TipoPersonaEnum(str, Enum):
    cliente = "cliente"
    entidad = "entidad"


class ParteProcesoBase(BaseModel):
    tipo_parte: TipoParteEnum
    tipo_persona: TipoPersonaEnum
    cliente_id: Optional[int] = None
    entidad_id: Optional[int] = None
    es_nuestro_cliente: bool = False
    nombre_completo: Optional[str] = None
    documento: Optional[str] = None
    observaciones: Optional[str] = None

    @validator('cliente_id', 'entidad_id', 'nombre_completo')
    def validar_identificacion(cls, v, values):
        """Al menos uno debe estar presente: cliente_id, entidad_id o nombre_completo"""
        cliente_id = values.get('cliente_id')
        entidad_id = values.get('entidad_id')
        nombre_completo = values.get('nombre_completo')
        
        # Contar cuántos están presentes
        presentes = sum([
            bool(cliente_id),
            bool(entidad_id), 
            bool(nombre_completo and nombre_completo.strip())
        ])
        
        if presentes == 0:
            raise ValueError('Debe especificar cliente_id, entidad_id o nombre_completo')
        if presentes > 1:
            raise ValueError('Solo puede especificar uno: cliente_id, entidad_id o nombre_completo')
            
        return v


class ParteProcesoCreate(ParteProcesoBase):
    proceso_id: int


class ParteProcesoUpdate(BaseModel):
    tipo_parte: Optional[TipoParteEnum] = None
    es_nuestro_cliente: Optional[bool] = None
    observaciones: Optional[str] = None


class ParteProcesoSchema(ParteProcesoBase):
    id: int
    proceso_id: int
    created_at: datetime
    updated_at: datetime
    
    # Campos calculados
    nombre_mostrar: Optional[str] = None
    documento_mostrar: Optional[str] = None

    class Config:
        from_attributes = True


class ParteProcesoDetalle(ParteProcesoSchema):
    """Schema con información detallada incluyendo datos de cliente/entidad"""
    cliente: Optional[dict] = None
    entidad: Optional[dict] = None

    class Config:
        from_attributes = True