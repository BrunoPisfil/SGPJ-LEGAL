from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import BIGINT
from backend.app.core.database import Base
import enum


class TipoResolucion(enum.Enum):
    improcedente = "improcedente"
    infundada = "infundada" 
    fundada_en_parte = "fundada_en_parte"
    rechazo_medios_probatorios = "rechazo_medios_probatorios"
    no_ha_lugar = "no_ha_lugar"


class AccionRequerida(enum.Enum):
    apelar = "apelar"
    subsanar = "subsanar"


class EstadoAccion(enum.Enum):
    pendiente = "pendiente"
    en_tramite = "en_tramite"
    completada = "completada"


class Resolucion(Base):
    __tablename__ = "resoluciones"

    id = Column(BIGINT(unsigned=True), primary_key=True, index=True)
    proceso_id = Column(BIGINT(unsigned=True), ForeignKey("procesos.id"), nullable=False)
    tipo = Column(Enum(TipoResolucion), nullable=False)
    fecha_notificacion = Column(Date, nullable=False)
    accion_requerida = Column(Enum(AccionRequerida), nullable=False)
    fecha_limite = Column(Date, nullable=False)
    responsable = Column(String(255), nullable=False)
    estado_accion = Column(Enum(EstadoAccion), nullable=False, default=EstadoAccion.pendiente)
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    proceso = relationship("Proceso", back_populates="resoluciones")