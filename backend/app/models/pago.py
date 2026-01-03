from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Text, ForeignKey, Date
from sqlalchemy.dialects.mysql import BIGINT, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base
from datetime import datetime, date

class Pago(Base):
    __tablename__ = "pagos"
    
    id = Column(BIGINT(unsigned=True), primary_key=True, index=True)
    contrato_id = Column(BIGINT(unsigned=True), ForeignKey("contratos.id"), nullable=False, index=True)
    fecha_pago = Column(Date, nullable=False, default=date.today)
    monto = Column(DECIMAL(12, 2), nullable=False)
    medio = Column(String(50), nullable=True)  # efectivo, transferencia, yape/plin
    referencia = Column(String(150), nullable=True)  # Número de operación, referencia, etc.
    notas = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relación con contrato
    contrato = relationship("Contrato", back_populates="pagos")
    
    @property
    def monto_decimal(self):
        """Devolver monto como decimal para cálculos"""
        return float(self.monto)