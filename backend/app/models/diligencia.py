"""
Modelo para Diligencias en SGPJ Legal
Diligencias son actividades u trámites dentro de un proceso judicial
"""

from sqlalchemy import Column, Integer, BigInteger, String, DateTime, Date, Time, Text, Boolean, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from datetime import datetime, date, time as datetime_time
import enum

from app.core.database import Base


class EstadoDiligencia(str, enum.Enum):
    """Estados posibles de una diligencia"""
    PENDIENTE = "PENDIENTE"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADA = "COMPLETADA"
    CANCELADA = "CANCELADA"


class Diligencia(Base):
    """Modelo de Diligencia"""
    __tablename__ = "diligencias"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    # Relación con Proceso
    proceso_id = Column(BigInteger, ForeignKey("procesos.id"), nullable=True, index=True)
    proceso = relationship("Proceso", back_populates="diligencias")
    
    # Campos básicos
    titulo = Column(String(255), nullable=False, index=True)
    motivo = Column(Text, nullable=False)
    fecha = Column(Date, nullable=False, index=True)
    hora = Column(Time, nullable=False)
    
    # Estado y control
    estado = Column(SQLEnum(EstadoDiligencia, native_enum=False), default=EstadoDiligencia.PENDIENTE, index=True)
    descripcion = Column(Text, nullable=True)
    
    # Notificación
    notificar = Column(Boolean, default=True)
    notificacion_enviada = Column(Boolean, default=False, index=True)
    
    # Auditoria
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relación con Notificaciones
    notificaciones = relationship("Notificacion", back_populates="diligencia", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Diligencia(id={self.id}, titulo='{self.titulo}', fecha={self.fecha}, hora={self.hora}, estado={self.estado})>"
