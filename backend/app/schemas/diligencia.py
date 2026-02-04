"""
Esquemas Pydantic para Diligencias
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date, time
from typing import Optional, List
from enum import Enum


class EstadoDiligenciaEnum(str, Enum):
    """Estados posibles de una diligencia"""
    PENDIENTE = "PENDIENTE"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADA = "COMPLETADA"
    CANCELADA = "CANCELADA"
    
    @classmethod
    def _missing_(cls, value):
        """Permitir valores en minúsculas"""
        if isinstance(value, str):
            value_upper = value.upper()
            for member in cls:
                if member.value == value_upper:
                    return member
        return super()._missing_(value)


class DiligenciaBase(BaseModel):
    """Base schema para Diligencia"""
    titulo: str = Field(..., min_length=1, max_length=255, description="Título de la diligencia")
    motivo: str = Field(..., min_length=1, description="Motivo o descripción de la diligencia")
    fecha: date = Field(..., description="Fecha de la diligencia")
    hora: time = Field(..., description="Hora de la diligencia")
    descripcion: Optional[str] = Field(None, description="Descripción adicional")
    estado: EstadoDiligenciaEnum = Field(default=EstadoDiligenciaEnum.PENDIENTE)
    notificar: bool = Field(default=True, description="Si se debe enviar notificación automática")
    
    @field_validator('estado', mode='before')
    @classmethod
    def convert_estado(cls, v):
        """Convertir estado a MAYÚSCULAS si viene en minúsculas"""
        if isinstance(v, str):
            v_upper = v.upper()
            # Reemplazar guiones bajos si es necesario
            if v_upper == "EN_PROGRESO":
                return EstadoDiligenciaEnum.EN_PROGRESO
            elif v_upper == "COMPLETADA":
                return EstadoDiligenciaEnum.COMPLETADA
            elif v_upper == "CANCELADA":
                return EstadoDiligenciaEnum.CANCELADA
            elif v_upper == "PENDIENTE":
                return EstadoDiligenciaEnum.PENDIENTE
        return v


class DiligenciaCreate(DiligenciaBase):
    """Schema para crear una diligencia"""
    proceso_id: Optional[int] = Field(None, description="ID del proceso asociado (opcional)")


class DiligenciaUpdate(BaseModel):
    """Schema para actualizar una diligencia"""
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    motivo: Optional[str] = Field(None, min_length=1)
    fecha: Optional[date] = None
    hora: Optional[time] = None
    descripcion: Optional[str] = None
    estado: Optional[EstadoDiligenciaEnum] = None
    notificar: Optional[bool] = None


class DiligenciaResponse(BaseModel):
    """Schema para respuesta de Diligencia"""
    id: int
    proceso_id: Optional[int] = None
    titulo: str
    motivo: str
    fecha: date
    hora: time
    descripcion: Optional[str]
    estado: EstadoDiligenciaEnum
    notificar: bool
    notificacion_enviada: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DiligenciaListResponse(BaseModel):
    """Schema para lista de diligencias"""
    id: int
    proceso_id: Optional[int] = None
    titulo: str
    fecha: date
    hora: time
    estado: EstadoDiligenciaEnum
    notificar: bool
    notificacion_enviada: bool
    created_at: datetime

    class Config:
        from_attributes = True
