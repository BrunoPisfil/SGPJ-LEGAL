from sqlalchemy import Column, BigInteger, String, DateTime, Text, Index
from sqlalchemy.sql import func
from backend.app.core.database import Base


class Entidad(Base):
    """Modelo para entidades (empresas, instituciones)"""
    __tablename__ = "entidades"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    ruc = Column(String(11), nullable=True)
    telefono = Column(String(30), nullable=True)
    email = Column(String(190), nullable=True)
    direccion = Column(String(250), nullable=True)
    notas = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index('uk_entidades_nombre', 'nombre', unique=True),
        Index('idx_entidades_ruc', 'ruc'),
    )

    def __repr__(self):
        return f"<Entidad(id={self.id}, nombre='{self.nombre}')>"