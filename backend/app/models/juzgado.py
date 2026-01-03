from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Juzgado(Base):
    """Modelo para juzgados"""
    __tablename__ = "juzgados"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(180), nullable=False)
    distrito_judicial = Column(String(120), nullable=True)
    direccion = Column(String(250), nullable=True)
    telefono = Column(String(30), nullable=True)
    creado_por = Column(BigInteger, ForeignKey('usuarios.id'), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    creador = relationship("Usuario", foreign_keys=[creado_por])
    especialistas = relationship("Especialista", back_populates="juzgado")

    def __repr__(self):
        return f"<Juzgado(id={self.id}, nombre='{self.nombre}')>"