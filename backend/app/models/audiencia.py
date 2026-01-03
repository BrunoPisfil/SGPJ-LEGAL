from sqlalchemy import (
    Column, BigInteger, String, DateTime, Text, Date, Time, 
    Boolean, ForeignKey, Index, CheckConstraint, text
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Audiencia(Base):
    """Modelo para audiencias"""
    __tablename__ = "audiencias"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    proceso_id = Column(BigInteger, ForeignKey('procesos.id', ondelete='CASCADE'), nullable=False)
    tipo = Column(String(100), nullable=False)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    sede = Column(Text, nullable=True)
    link = Column(Text, nullable=True)
    notas = Column(Text, nullable=True)
    notificar = Column(Boolean, nullable=False, default=True)
    
    # Columna generada para facilitar consultas (fecha + hora)
    fecha_hora = Column(
        DateTime,
        server_default=text("(TIMESTAMP(fecha, hora))"),
        nullable=True
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    proceso = relationship("Proceso", back_populates="audiencias")
    notificaciones = relationship("Notificacion", back_populates="audiencia")

    __table_args__ = (
        Index('idx_audiencias_proceso', 'proceso_id'),
        Index('idx_audiencias_fecha', 'fecha'),
        Index('idx_audiencias_fechahora', 'fecha_hora'),
        Index('idx_audiencias_notificar', 'notificar', 'fecha_hora'),
        CheckConstraint(
            "(sede IS NOT NULL AND TRIM(sede) != '') OR (link IS NOT NULL AND TRIM(link) != '')",
            name='chk_audiencia_sede_o_link'
        ),
    )

    def __repr__(self):
        return f"<Audiencia(id={self.id}, tipo='{self.tipo}', fecha={self.fecha})>"