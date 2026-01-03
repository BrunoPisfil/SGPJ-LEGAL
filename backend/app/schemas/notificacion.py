from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional
from enum import Enum


class TipoNotificacionEnum(str, Enum):
    AUDIENCIA_PROGRAMADA = "audiencia_programada"
    AUDIENCIA_RECORDATORIO = "audiencia_recordatorio" 
    PROCESO_ACTUALIZADO = "proceso_actualizado"
    VENCIMIENTO_PLAZO = "vencimiento_plazo"
    SISTEMA = "sistema"


class CanalNotificacionEnum(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    SISTEMA = "sistema"


class EstadoNotificacionEnum(str, Enum):
    PENDIENTE = "PENDIENTE"
    ENVIADO = "ENVIADO"
    ERROR = "ERROR"
    LEIDO = "LEIDO"


class NotificacionBase(BaseModel):
    """Schema base para notificaciones"""
    audiencia_id: Optional[int] = None
    proceso_id: Optional[int] = None
    tipo: TipoNotificacionEnum
    canal: CanalNotificacionEnum
    titulo: str
    mensaje: str
    email_destinatario: Optional[str] = None
    telefono_destinatario: Optional[str] = None
    fecha_programada: Optional[datetime] = None
    metadata_extra: Optional[str] = None

    @validator('email_destinatario')
    def validate_email_for_email_channel(cls, v, values):
        if values.get('canal') == CanalNotificacionEnum.EMAIL and not v:
            raise ValueError('Email es requerido para notificaciones por email')
        return v

    @validator('telefono_destinatario')
    def validate_phone_for_sms_channel(cls, v, values):
        if values.get('canal') == CanalNotificacionEnum.SMS and not v:
            raise ValueError('Teléfono es requerido para notificaciones SMS')
        return v


class NotificacionCreate(NotificacionBase):
    """Schema para crear notificación"""
    pass


class NotificacionUpdate(BaseModel):
    """Schema para actualizar notificación"""
    estado: Optional[EstadoNotificacionEnum] = None
    fecha_enviada: Optional[datetime] = None
    fecha_leida: Optional[datetime] = None
    error_mensaje: Optional[str] = None


class NotificacionResponse(NotificacionBase):
    """Schema para respuesta de notificación"""
    id: int
    estado: EstadoNotificacionEnum
    fecha_enviada: Optional[datetime] = None
    fecha_leida: Optional[datetime] = None
    error_mensaje: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificacionList(BaseModel):
    """Schema para lista de notificaciones"""
    notificaciones: list[NotificacionResponse]
    total: int
    no_leidas: int
    page: int
    per_page: int


class EnviarNotificacionRequest(BaseModel):
    """Schema para enviar notificación de audiencia"""
    audiencia_id: int
    canales: list[CanalNotificacionEnum]
    email_destinatario: Optional[str] = None
    telefono_destinatario: Optional[str] = None
    mensaje_personalizado: Optional[str] = None