"""
Modelo para bitácora de cambios de resoluciones
"""
from sqlalchemy import Column, BigInteger, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class BitacoraResolucion(Base):
    """Modelo para registrar cambios en resoluciones"""
    __tablename__ = "bitacora_resoluciones"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    resolucion_id = Column(BigInteger, ForeignKey("resoluciones.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(BigInteger, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    accion = Column(
        Enum('creacion', 'actualizacion', 'eliminacion', 'cambio_estado', 'observacion', name='accion_bitacora_resolucion_enum'),
        nullable=False
    )
    campo_modificado = Column(String(100), nullable=True)  # Campo específico que cambió
    valor_anterior = Column(Text, nullable=True)  # Valor antes del cambio
    valor_nuevo = Column(Text, nullable=True)  # Valor después del cambio
    descripcion = Column(Text, nullable=True)  # Descripción detallada del cambio
    fecha_cambio = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relaciones
    resolucion = relationship("Resolucion", backref="bitacora")
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    
    def __repr__(self):
        return f"<BitacoraResolucion(resolucion_id={self.resolucion_id}, accion='{self.accion}', fecha={self.fecha_cambio})>"
