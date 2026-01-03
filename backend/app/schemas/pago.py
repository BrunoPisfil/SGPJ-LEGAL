from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime, date
from typing import Optional

class PagoBase(BaseModel):
    contrato_id: int
    monto: Decimal
    medio: Optional[str] = None  # efectivo, transferencia, yape/plin
    referencia: Optional[str] = None
    notas: Optional[str] = None

class PagoCreate(PagoBase):
    fecha_pago: Optional[date] = None  # Si no se proporciona, usa la fecha actual

class PagoUpdate(BaseModel):
    monto: Optional[Decimal] = None
    medio: Optional[str] = None
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha_pago: Optional[date] = None

class PagoSchema(PagoBase):
    id: int
    fecha_pago: date
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PagoDetalle(PagoSchema):
    # Información expandida del contrato
    contrato_codigo: Optional[str] = None
    cliente_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True