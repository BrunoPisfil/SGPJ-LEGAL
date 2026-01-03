"""
Schemas de Pydantic actualizados para Proceso con estructura flexible
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from app.schemas.parte_proceso import ParteProcesoSchema, ParteProcesoCreate


class EstadoProcesoEnum(str, Enum):
    pendiente_impulsar = "pendiente_impulsar"
    pendiente_sentencia = "pendiente_sentencia"
    resolucion = "resolucion"
    audiencia_programada = "audiencia_programada"


class ProcesoBase(BaseModel):
    codigo_expediente: str = Field(..., min_length=1, max_length=120)
    materia: str = Field(..., min_length=1, max_length=150)
    juzgado_id: Optional[int] = None
    especialista_id: Optional[int] = None
    abogado_responsable_id: Optional[int] = None
    estado: EstadoProcesoEnum = EstadoProcesoEnum.pendiente_impulsar
    descripcion_estado: Optional[str] = None
    fecha_ultima_actuacion: Optional[date] = None
    fecha_ultima_revision: Optional[date] = None


class ProcesoCreate(ProcesoBase):
    partes: List[ParteProcesoCreate] = Field(..., min_items=2, description="Debe incluir al menos demandante y demandado")
    
    @validator('partes')
    def validar_partes(cls, v):
        """Validar que exista al menos un demandante y un demandado"""
        tipos_parte = [parte.tipo_parte for parte in v]
        
        if 'demandante' not in tipos_parte:
            raise ValueError('Debe incluir al menos un demandante')
        if 'demandado' not in tipos_parte:
            raise ValueError('Debe incluir al menos un demandado')
            
        return v


class ProcesoUpdate(BaseModel):
    codigo_expediente: Optional[str] = None
    materia: Optional[str] = None
    juzgado_id: Optional[int] = None
    especialista_id: Optional[int] = None
    abogado_responsable_id: Optional[int] = None
    estado: Optional[EstadoProcesoEnum] = None
    descripcion_estado: Optional[str] = None
    fecha_ultima_actuacion: Optional[date] = None
    fecha_ultima_revision: Optional[date] = None


class ProcesoSchema(ProcesoBase):
    id: int
    creado_por: Optional[int] = None
    updated_por: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # Campos calculados (propiedades del modelo)
    demandantes_nombres: Optional[str] = None
    demandados_nombres: Optional[str] = None
    nuestros_clientes_nombres: Optional[str] = None

    class Config:
        from_attributes = True


class ProcesoDetalle(ProcesoSchema):
    """Schema completo con todas las partes y relaciones"""
    partes: List[ParteProcesoSchema] = []
    juzgado: Optional[dict] = None
    especialista: Optional[dict] = None
    abogado_responsable: Optional[dict] = None

    class Config:
        from_attributes = True


class ProcesoResumen(BaseModel):
    """Schema resumido para listas"""
    id: int
    codigo_expediente: str
    materia: str
    estado: EstadoProcesoEnum
    fecha_ultima_actuacion: Optional[date] = None
    demandantes_nombres: str
    demandados_nombres: str
    nuestros_clientes_nombres: str
    juzgado_nombre: Optional[str] = None
    abogado_responsable_nombre: Optional[str] = None

    class Config:
        from_attributes = True


# Schema para agregar/quitar partes de un proceso existente
class AgregarParteRequest(BaseModel):
    tipo_parte: str = Field(..., regex="^(demandante|demandado|tercero)$")
    tipo_persona: str = Field(..., regex="^(cliente|entidad)$")
    cliente_id: Optional[int] = None
    entidad_id: Optional[int] = None
    es_nuestro_cliente: bool = False
    nombre_completo: Optional[str] = None
    documento: Optional[str] = None
    observaciones: Optional[str] = None