from pydantic import BaseModel, validator
from datetime import date, time, datetime
from typing import Optional


class AudienciaBase(BaseModel):
    """Schema base para audiencias"""
    proceso_id: int
    tipo: str
    fecha: date
    hora: time
    sede: Optional[str] = None
    link: Optional[str] = None
    notas: Optional[str] = None
    notificar: bool = True

    @validator('sede', 'link')
    def validate_sede_or_link(cls, v, values):
        """Validar que al menos sede o link esté presente"""
        if not values.get('sede') and not v:
            raise ValueError('Debe proporcionar sede o link de la audiencia')
        return v


class AudienciaCreate(AudienciaBase):
    """Schema para crear audiencia"""
    pass


class AudienciaUpdate(BaseModel):
    """Schema para actualizar audiencia"""
    tipo: Optional[str] = None
    fecha: Optional[date] = None
    hora: Optional[time] = None
    sede: Optional[str] = None
    link: Optional[str] = None
    notas: Optional[str] = None
    notificar: Optional[bool] = None


class AudienciaResponse(BaseModel):
    """Schema para respuesta de audiencia"""
    id: int
    proceso_id: int
    tipo: str
    fecha: date
    hora: time
    sede: Optional[str] = None
    link: Optional[str] = None
    notas: Optional[str] = None
    notificar: bool = True
    fecha_hora: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AudienciaList(BaseModel):
    """Schema para lista de audiencias"""
    audiencias: list[AudienciaResponse]
    total: int
    page: int
    per_page: int