from sqlalchemy import Column, BigInteger, String, DateTime, Boolean, Enum, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Cliente(Base):
    """Modelo para clientes"""
    __tablename__ = "clientes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tipo_persona = Column(Enum('natural', 'juridica', name='tipo_persona_enum'), nullable=False)
    nombres = Column(String(120), nullable=True)
    apellidos = Column(String(120), nullable=True)
    razon_social = Column(String(180), nullable=True)
    doc_tipo = Column(
        Enum('DNI', 'RUC', 'CE', 'PAS', name='doc_tipo_enum'), 
        nullable=False, 
        default='DNI'
    )
    doc_numero = Column(String(20), nullable=False)
    telefono = Column(String(30), nullable=True)
    email = Column(String(190), nullable=True)
    direccion = Column(String(250), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index('uk_clientes_doc', 'doc_tipo', 'doc_numero', unique=True),
        Index('idx_clientes_nombre', 'nombres', 'apellidos'),
        Index('idx_clientes_razon', 'razon_social'),
    )

    # Relaciones
    contratos = relationship("Contrato", back_populates="cliente")

    def __repr__(self):
        if self.tipo_persona == 'natural':
            return f"<Cliente(id={self.id}, nombre='{self.nombres} {self.apellidos}')>"
        else:
            return f"<Cliente(id={self.id}, razon_social='{self.razon_social}')>"