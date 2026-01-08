"""
Schemas Pydantic para la bitácora de resoluciones
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class AccionBitacoraResolucion(str, Enum):
    CREACION = "creacion"
    ACTUALIZACION = "actualizacion"
    ELIMINACION = "eliminacion"
    CAMBIO_ESTADO = "cambio_estado"
    OBSERVACION = "observacion"


class BitacoraResolucionBase(BaseModel):
    resolucion_id: int = Field(..., description="ID de la resolución")
    accion: AccionBitacoraResolucion = Field(..., description="Tipo de acción realizada")
    campo_modificado: Optional[str] = Field(None, description="Campo específico modificado")
    valor_anterior: Optional[str] = Field(None, description="Valor anterior del campo")
    valor_nuevo: Optional[str] = Field(None, description="Valor nuevo del campo")
    descripcion: Optional[str] = Field(None, description="Descripción detallada del cambio")


class BitacoraResolucionCreate(BitacoraResolucionBase):
    usuario_id: Optional[int] = Field(None, description="ID del usuario que realizó el cambio")


class BitacoraResolucionResponse(BitacoraResolucionBase):
    id: int
    usuario_id: Optional[int]
    fecha_cambio: datetime
    usuario_nombre: Optional[str] = Field(None, description="Nombre completo del usuario")

    class Config:
        from_attributes = True


class BitacoraResolucionDetalle(BitacoraResolucionResponse):
    """Schema con información adicional del usuario y resolución"""
    resolucion_numero: Optional[str] = Field(None, description="Número de la resolución")
    usuario_email: Optional[str] = Field(None, description="Email del usuario")
