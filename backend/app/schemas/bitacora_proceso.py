"""
Schemas Pydantic para la bitácora de procesos
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class AccionBitacora(str, Enum):
    CREACION = "creacion"
    ACTUALIZACION = "actualizacion"
    ELIMINACION = "eliminacion"
    AUDIENCIA = "audiencia"
    ESTADO = "estado"
    OBSERVACION = "observacion"


class BitacoraProcesoBase(BaseModel):
    proceso_id: int = Field(..., description="ID del proceso")
    accion: AccionBitacora = Field(..., description="Tipo de acción realizada")
    campo_modificado: Optional[str] = Field(None, description="Campo específico modificado")
    valor_anterior: Optional[str] = Field(None, description="Valor anterior del campo")
    valor_nuevo: Optional[str] = Field(None, description="Valor nuevo del campo")
    descripcion: Optional[str] = Field(None, description="Descripción detallada del cambio")


class BitacoraProcesoCreate(BitacoraProcesoBase):
    usuario_id: Optional[int] = Field(None, description="ID del usuario que realizó el cambio")


class BitacoraProcesoResponse(BitacoraProcesoBase):
    id: int
    usuario_id: Optional[int]
    fecha_cambio: datetime
    usuario_nombre: Optional[str] = Field(None, description="Nombre completo del usuario")

    class Config:
        from_attributes = True


class BitacoraProcesoDetalle(BitacoraProcesoResponse):
    """Schema con información adicional del usuario y proceso"""
    proceso_expediente: Optional[str] = Field(None, description="Expediente del proceso")
    usuario_email: Optional[str] = Field(None, description="Email del usuario")