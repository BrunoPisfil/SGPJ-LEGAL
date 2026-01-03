from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Especialista(Base):
    """Modelo para especialistas de juzgados"""
    __tablename__ = "especialistas"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombres = Column(String(120), nullable=False)
    apellidos = Column(String(120), nullable=False)
    telefono = Column(String(30), nullable=True)
    email = Column(String(190), nullable=True)
    juzgado_id = Column(BigInteger, ForeignKey('juzgados.id'), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    juzgado = relationship("Juzgado", back_populates="especialistas")

    __table_args__ = (
        Index('idx_especialista_nombre', 'apellidos', 'nombres'),
    )

    def __repr__(self):
        return f"<Especialista(id={self.id}, nombre='{self.nombres} {self.apellidos}')>"