from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Abogado(Base):
    """Modelo para abogados"""
    __tablename__ = "abogados"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombres = Column(String(120), nullable=False)
    apellidos = Column(String(120), nullable=False)
    colegiatura = Column(String(40), nullable=True)
    telefono = Column(String(30), nullable=True)
    email = Column(String(190), nullable=True)
    usuario_id = Column(BigInteger, ForeignKey('usuarios.id'), nullable=True, unique=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    usuario = relationship("Usuario", back_populates="abogado")

    __table_args__ = (
        Index('idx_abogados_nombre', 'apellidos', 'nombres'),
        Index('uk_abogados_usuario', 'usuario_id', unique=True),
    )

    def __repr__(self):
        return f"<Abogado(id={self.id}, nombre='{self.nombres} {self.apellidos}')>"