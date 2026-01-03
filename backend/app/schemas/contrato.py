from pydantic import BaseModel, Field, validator
from datetime import datetime
from decimal import Decimal
from typing import Optional
from enum import Enum


class EstadoContrato(str, Enum):
    activo = "activo"
    completado = "completado"
    cancelado = "cancelado"


# Schema base para Contrato
class ContratoBase(BaseModel):
    cliente_id: int = Field(..., description="ID del cliente")
    proceso_id: int = Field(..., description="ID del proceso")
    monto_total: Decimal = Field(..., ge=0, description="Monto total del contrato")
    monto_pagado: Decimal = Field(default=Decimal('0.00'), ge=0, description="Monto pagado")
    estado: EstadoContrato = Field(default=EstadoContrato.activo, description="Estado del contrato")
    notas: Optional[str] = Field(None, description="Notas adicionales")

    @validator('monto_pagado')
    def validate_monto_pagado(cls, v, values):
        if 'monto_total' in values and v > values['monto_total']:
            raise ValueError('El monto pagado no puede ser mayor al monto total')
        return v


# Schema para crear contrato
class ContratoCreate(ContratoBase):
    pass


# Schema para actualizar contrato
class ContratoUpdate(BaseModel):
    monto_total: Optional[Decimal] = Field(None, ge=0)
    monto_pagado: Optional[Decimal] = Field(None, ge=0)
    estado: Optional[EstadoContrato] = None
    notas: Optional[str] = None

    @validator('monto_pagado')
    def validate_monto_pagado(cls, v, values):
        if v is not None and 'monto_total' in values and values['monto_total'] is not None:
            if v > values['monto_total']:
                raise ValueError('El monto pagado no puede ser mayor al monto total')
        return v


# Schema para datos expandidos del contrato (con información del cliente y proceso)
class ContratoDetalle(ContratoBase):
    id: int
    codigo: str
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime]
    
    # Información expandida
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    proceso_expediente: Optional[str] = None
    proceso_demandante: Optional[str] = None
    proceso_demandado: Optional[str] = None
    
    # Campos calculados
    monto_pendiente: Decimal
    porcentaje_pagado: float
    esta_completado: bool

    class Config:
        from_attributes = True


# Schema básico para respuestas de la API
class Contrato(ContratoBase):
    id: int
    codigo: str
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime]

    class Config:
        from_attributes = True


# Schema para búsqueda de contratos
class ContratoSearch(BaseModel):
    cliente_id: Optional[int] = None
    proceso_id: Optional[int] = None
    estado: Optional[EstadoContrato] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None


# Schema para estadísticas de contratos
class ContratoStats(BaseModel):
    total: int
    activos: int
    completados: int
    cancelados: int
    monto_total: Decimal
    monto_pagado: Decimal
    monto_pendiente: Decimal
    porcentaje_cobrado: float


# Schema para respuesta de listado con paginación
class ContratoListResponse(BaseModel):
    contratos: list[ContratoDetalle]
    total: int
    page: int
    size: int
    pages: int