"""
Modelo SQLAlchemy para la tabla partes_proceso
Maneja las partes involucradas en un proceso (demandantes, demandados, terceros)
"""

from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base


class ParteProceso(Base):
    __tablename__ = "partes_proceso"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    proceso_id = Column(BigInteger, ForeignKey("procesos.id", ondelete="CASCADE"), nullable=False)
    tipo_parte = Column(Enum('demandante', 'demandado', 'tercero', name='tipo_parte_enum'), nullable=False)
    tipo_persona = Column(Enum('cliente', 'entidad', name='tipo_persona_enum'), nullable=False)
    cliente_id = Column(BigInteger, ForeignKey("clientes.id", ondelete="SET NULL"), nullable=True)
    entidad_id = Column(BigInteger, ForeignKey("entidades.id", ondelete="SET NULL"), nullable=True)
    es_nuestro_cliente = Column(Boolean, nullable=False, default=False)
    nombre_completo = Column(String(200), nullable=True)  # Para casos donde no esté en nuestras tablas
    documento = Column(String(50), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    proceso = relationship("Proceso", back_populates="partes")
    cliente = relationship("Cliente", foreign_keys=[cliente_id])
    entidad = relationship("Entidad", foreign_keys=[entidad_id])
    
    @property
    def nombre_mostrar(self) -> str:
        """Retorna el nombre a mostrar según el tipo de parte"""
        if self.cliente_id and self.cliente:
            if self.cliente.tipo_persona == 'natural':
                return f"{self.cliente.nombres} {self.cliente.apellidos}".strip()
            else:
                return self.cliente.razon_social
        elif self.entidad_id and self.entidad:
            return self.entidad.nombre
        elif self.nombre_completo:
            return self.nombre_completo
        else:
            return "Sin identificar"
    
    @property
    def documento_mostrar(self) -> str:
        """Retorna el documento a mostrar"""
        if self.cliente_id and self.cliente:
            return f"{self.cliente.doc_tipo}: {self.cliente.doc_numero}"
        elif self.documento:
            return self.documento
        else:
            return ""
    
    def __repr__(self):
        return f"<ParteProceso(id={self.id}, proceso_id={self.proceso_id}, tipo='{self.tipo_parte}', nombre='{self.nombre_mostrar}')>"