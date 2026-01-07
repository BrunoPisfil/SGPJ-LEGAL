"""
Modelo SQLAlchemy actualizado para procesos judiciales
Compatible con la nueva estructura de partes flexibles
"""

from sqlalchemy import (
    Column, String, DateTime, Text, Enum, 
    Date, ForeignKey, BigInteger
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Proceso(Base):
    """Modelo para procesos judiciales con estructura flexible de partes"""
    __tablename__ = "procesos"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    codigo_expediente = Column(String(120), nullable=False, unique=True)
    materia = Column(String(150), nullable=False)
    
    # Referencias a tablas relacionadas
    juzgado_id = Column(BigInteger, ForeignKey('juzgados.id'), nullable=True)
    especialista_id = Column(BigInteger, ForeignKey('especialistas.id'), nullable=True)
    abogado_responsable_id = Column(BigInteger, ForeignKey('abogados.id'), nullable=True)
    
    # Estado del proceso
    estado = Column(
        Enum('pendiente_impulsar', 'pendiente_sentencia', 'resolucion', 'audiencia_programada',
             name='estado_proceso_enum'), 
        nullable=False, 
        default='pendiente_impulsar'
    )
    descripcion_estado = Column(Text, nullable=True)
    
    # Fechas importantes
    fecha_ultima_actuacion = Column(Date, nullable=True)
    fecha_ultima_revision = Column(Date, nullable=True)
    
    # Auditoría
    creado_por = Column(BigInteger, ForeignKey('usuarios.id'), nullable=True)
    updated_por = Column(BigInteger, ForeignKey('usuarios.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )

    # Relaciones
    juzgado = relationship("Juzgado", foreign_keys=[juzgado_id])
    especialista = relationship("Especialista", foreign_keys=[especialista_id])
    abogado_responsable = relationship("Abogado", foreign_keys=[abogado_responsable_id])
    creador = relationship("Usuario", foreign_keys=[creado_por])
    actualizador = relationship("Usuario", foreign_keys=[updated_por])
    
    # Relación con las partes del proceso (nueva estructura)
    partes = relationship("ParteProceso", back_populates="proceso", cascade="all, delete-orphan")
    
    # Relaciones existentes con cascade para eliminar dependencias
    audiencias = relationship("Audiencia", back_populates="proceso", cascade="all, delete-orphan")
    notificaciones = relationship("Notificacion", back_populates="proceso", cascade="all, delete-orphan")
    contratos = relationship("Contrato", back_populates="proceso", cascade="all, delete-orphan")
    resoluciones = relationship("Resolucion", back_populates="proceso", cascade="all, delete-orphan")

    @property
    def demandantes(self):
        """Obtiene todas las partes demandantes"""
        return [parte for parte in self.partes if parte.tipo_parte == 'demandante']
    
    @property
    def demandados(self):
        """Obtiene todas las partes demandadas"""
        return [parte for parte in self.partes if parte.tipo_parte == 'demandado']
    
    @property
    def nuestros_clientes(self):
        """Obtiene las partes que son nuestros clientes"""
        return [parte for parte in self.partes if parte.es_nuestro_cliente]
    
    @property
    def demandantes_nombres(self):
        """Obtiene los nombres de los demandantes concatenados"""
        nombres = [parte.nombre_mostrar for parte in self.demandantes]
        return ', '.join(nombres) if nombres else 'Sin demandantes'
    
    @property
    def demandados_nombres(self):
        """Obtiene los nombres de los demandados concatenados"""
        nombres = [parte.nombre_mostrar for parte in self.demandados]
        return ', '.join(nombres) if nombres else 'Sin demandados'
    
    @property
    def nuestros_clientes_nombres(self):
        """Obtiene los nombres de nuestros clientes en el proceso"""
        nombres = [f"{parte.tipo_parte.capitalize()}: {parte.nombre_mostrar}" 
                  for parte in self.nuestros_clientes]
        return ', '.join(nombres) if nombres else 'Sin clientes nuestros'

    def agregar_parte(self, tipo_parte, tipo_persona, es_nuestro_cliente=False, 
                     cliente_id=None, entidad_id=None, nombre_completo=None, 
                     documento=None, observaciones=None):
        """Método helper para agregar una parte al proceso"""
        from app.models.parte_proceso import ParteProceso
        
        nueva_parte = ParteProceso(
            proceso_id=self.id,
            tipo_parte=tipo_parte,
            tipo_persona=tipo_persona,
            es_nuestro_cliente=es_nuestro_cliente,
            cliente_id=cliente_id,
            entidad_id=entidad_id,
            nombre_completo=nombre_completo,
            documento=documento,
            observaciones=observaciones
        )
        self.partes.append(nueva_parte)
        return nueva_parte

    def __repr__(self):
        return f"<Proceso(id={self.id}, expediente='{self.codigo_expediente}', estado='{self.estado}')>"