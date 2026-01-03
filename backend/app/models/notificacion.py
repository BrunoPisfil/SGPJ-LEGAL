from sqlalchemy import Column, BigInteger, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from backend.app.core.database import Base


class TipoNotificacion(str, Enum):
    AUDIENCIA_PROGRAMADA = "audiencia_programada"
    AUDIENCIA_RECORDATORIO = "audiencia_recordatorio" 
    PROCESO_ACTUALIZADO = "proceso_actualizado"
    VENCIMIENTO_PLAZO = "vencimiento_plazo"
    SISTEMA = "sistema"


class CanalNotificacion(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    SISTEMA = "sistema"


class EstadoNotificacion(str, Enum):
    PENDIENTE = "PENDIENTE"
    ENVIADO = "ENVIADO"  # Cambiar para coincidir con la DB
    ERROR = "ERROR"
    LEIDO = "LEIDO"  # Cambiar para coincidir con la DB


class Notificacion(Base):
    """Modelo para notificaciones del sistema"""
    __tablename__ = "notificaciones"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    # Relacionado con la audiencia (opcional)
    audiencia_id = Column(BigInteger, ForeignKey('audiencias.id', ondelete='SET NULL'), nullable=True)
    proceso_id = Column(BigInteger, ForeignKey('procesos.id', ondelete='CASCADE'), nullable=True)
    
    # Contenido de la notificación
    tipo = Column(SQLEnum(TipoNotificacion), nullable=False)
    canal = Column(SQLEnum(CanalNotificacion), nullable=False)
    titulo = Column(String(255), nullable=False)
    mensaje = Column(Text, nullable=False)
    
    # Destinatario
    email_destinatario = Column(String(255), nullable=True)
    telefono_destinatario = Column(String(20), nullable=True)
    
    # Estado y tracking
    estado = Column(SQLEnum(EstadoNotificacion), nullable=False, default=EstadoNotificacion.PENDIENTE)
    fecha_programada = Column(DateTime, nullable=True)  # Para notificaciones programadas
    fecha_envio = Column(DateTime, nullable=True)  # Cambiar nombre para coincidir con DB
    fecha_leida = Column(DateTime, nullable=True)
    
    # Metadata adicional
    metadata_extra = Column(Text, nullable=True)  # JSON con datos adicionales
    error_mensaje = Column(Text, nullable=True)   # Mensaje de error si falla
    
    # Campos adicionales para compatibilidad con DB
    expediente = Column(String(120), nullable=True)
    destinatario = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    audiencia = relationship("Audiencia", back_populates="notificaciones")
    proceso = relationship("Proceso", back_populates="notificaciones")

    def __repr__(self):
        return f"<Notificacion(id={self.id}, tipo='{self.tipo}', estado='{self.estado}')>"