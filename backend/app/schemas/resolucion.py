from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from enum import Enum


class TipoResolucion(str, Enum):
    improcedente = "improcedente"
    infundada = "infundada"
    fundada_en_parte = "fundada_en_parte"
    rechazo_medios_probatorios = "rechazo_medios_probatorios"
    no_ha_lugar = "no_ha_lugar"


class AccionRequerida(str, Enum):
    apelar = "apelar"
    subsanar = "subsanar"


class EstadoAccion(str, Enum):
    pendiente = "pendiente"
    en_tramite = "en_tramite"
    completada = "completada"


class ResolucionBase(BaseModel):
    """Schema base para resoluciones"""
    proceso_id: int = Field(..., description="ID del proceso asociado")
    tipo: TipoResolucion = Field(..., description="Tipo de resolución")
    fecha_notificacion: date = Field(..., description="Fecha de notificación")
    accion_requerida: AccionRequerida = Field(..., description="Acción requerida")
    fecha_limite: date = Field(..., description="Fecha límite para la acción")
    responsable: str = Field(..., description="Responsable de la acción")
    estado_accion: EstadoAccion = Field(default=EstadoAccion.pendiente, description="Estado de la acción")
    notas: Optional[str] = Field(None, description="Notas adicionales")


class ResolucionCreate(ResolucionBase):
    """Schema para crear resolución"""
    pass


class ResolucionUpdate(BaseModel):
    """Schema para actualizar resolución"""
    tipo: Optional[TipoResolucion] = None
    fecha_notificacion: Optional[date] = None
    accion_requerida: Optional[AccionRequerida] = None
    fecha_limite: Optional[date] = None
    responsable: Optional[str] = None
    estado_accion: Optional[EstadoAccion] = None
    notas: Optional[str] = None


class ResolucionResponse(ResolucionBase):
    """Schema para respuesta de resolución"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Información del proceso asociado para facilitar la visualización
    expediente: Optional[str] = Field(None, description="Expediente del proceso")

    class Config:
        from_attributes = True