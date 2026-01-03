from sqlalchemy import Column, BigInteger, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Usuario(Base):
    """Modelo para usuarios del sistema"""
    __tablename__ = "usuarios"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, nullable=False)
    telefono = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(
        Enum('admin', 'practicante', name='rol_enum'), 
        nullable=False, 
        default='practicante'
    )
    activo = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    abogado = relationship("Abogado", back_populates="usuario", uselist=False)

    def __repr__(self):
        return f"<Usuario(id={self.id}, email='{self.email}', nombre='{self.nombre}')>"