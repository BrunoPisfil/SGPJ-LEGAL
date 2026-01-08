from sqlalchemy import (
    Column, String, DateTime, Text, Enum, 
    ForeignKey, Numeric, Integer
)
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Contrato(Base):
    """Modelo para contratos de servicios legales"""
    __tablename__ = "contratos"

    id = Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    codigo = Column(String(50), nullable=False, unique=True)
    
    # Relaciones
    cliente_id = Column(BIGINT(unsigned=True), nullable=False)
    proceso_id = Column(BIGINT(unsigned=True), ForeignKey('procesos.id'), nullable=False)
    
    # Montos
    monto_total = Column(Numeric(10, 2), nullable=False)
    monto_inicial = Column(Numeric(10, 2), nullable=False, default=0.00)  # Adelanto/seña
    monto_pagado = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    # Estado del contrato
    estado = Column(
        Enum('activo', 'completado', 'cancelado', name='estado_contrato_enum'),
        nullable=False,
        default='activo'
    )
    
    # Notas adicionales
    notas = Column(Text, nullable=True)
    
    # Timestamps
    fecha_creacion = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime, onupdate=func.now(), nullable=True)
    
    # Relaciones
    # cliente_id viene del directorio (tabla directorio con tipo='cliente')
    cliente = relationship("Directorio", foreign_keys=[cliente_id], primaryjoin="Contrato.cliente_id == Directorio.id")
    proceso = relationship("Proceso", back_populates="contratos")
    pagos = relationship("Pago", back_populates="contrato", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Contrato(id={self.id}, codigo='{self.codigo}', monto_total={self.monto_total})>"
    
    @property
    def monto_pendiente(self) -> float:
        """Calcula el monto pendiente de pago (monto_total - monto_inicial - monto_pagado)"""
        return float(self.monto_total - self.monto_inicial - self.monto_pagado)
    
    @property
    def total_pagado_incluye_inicial(self) -> float:
        """Total pagado incluyendo el monto inicial"""
        return float(self.monto_inicial + self.monto_pagado)
    
    @property
    def porcentaje_pagado(self) -> float:
        """Calcula el porcentaje pagado basado en monto_total"""
        if self.monto_total == 0:
            return 0.0
        return float((self.total_pagado_incluye_inicial / float(self.monto_total)) * 100)
    
    @property
    def esta_completado(self) -> bool:
        """Verifica si el contrato está completamente pagado"""
        return self.monto_pagado >= self.monto_total