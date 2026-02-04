from sqlalchemy import (
    Column, String, DateTime, Text, Enum, 
    Date, ForeignKey, Numeric, BigInteger
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Proceso(Base):
    """Modelo para procesos judiciales con estructura flexible de partes"""
    __tablename__ = "procesos"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    expediente = Column(String(120), nullable=False, unique=True)
    tipo = Column(
        Enum('Civil', 'Penal', 'Laboral', 'Administrativo', 'Familia', 'Comercial', 
             name='tipo_proceso_enum'), 
        nullable=False
    )
    materia = Column(String(150), nullable=False)
    juzgado_id = Column(BigInteger, ForeignKey('juzgados.id'), nullable=True)
    especialista_id = Column(BigInteger, ForeignKey('especialistas.id'), nullable=True)
    
    # Estado general del proceso (opcional)
    estado = Column(
        Enum('Activo', 'En trámite', 'Suspendido', 'Archivado', 'Finalizado',
             name='estado_proceso_enum'), 
        nullable=True, 
        default=None
    )
    
    # Estado jurídico específico (opcional)
    estado_juridico = Column(
        Enum('pendiente_impulsar', 'pendiente_sentencia', 'resolucion', 'audiencia_programada',
             name='estado_juridico_enum'), 
        nullable=True, 
        default=None
    )
    
    # Etapa procesal y composición del tribunal
    etapa_procesal = Column(
        Enum('investigación_preparatoria', 'etapa_intermedia', 'juzgamiento',
             name='etapa_procesal_enum'),
        nullable=True,
        default=None
    )
    tipo_composicion = Column(
        Enum('unipersonal', 'colegiado',
             name='tipo_composicion_enum'),
        nullable=True,
        default=None
    )
    
    monto_pretension = Column(Numeric(15, 2), nullable=True)
    fecha_inicio = Column(Date, nullable=False)
    fecha_notificacion = Column(Date, nullable=True)
    fecha_ultima_revision = Column(Date, nullable=True)
    observaciones = Column(Text, nullable=True)
    carpeta_fiscal = Column(String(120), nullable=True)
    
    # Referencias
    abogado_responsable_id = Column(BigInteger, ForeignKey('usuarios.id'), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=True
    )

    # Relaciones
    abogado_responsable = relationship("Usuario", foreign_keys=[abogado_responsable_id])
    juzgado = relationship("Juzgado", foreign_keys=[juzgado_id])
    especialista = relationship("Especialista", foreign_keys=[especialista_id])
    audiencias = relationship("Audiencia", back_populates="proceso", cascade="all, delete-orphan")
    notificaciones = relationship("Notificacion", back_populates="proceso", cascade="all, delete-orphan")
    contratos = relationship("Contrato", back_populates="proceso", cascade="all, delete-orphan")
    resoluciones = relationship("Resolucion", back_populates="proceso", cascade="all, delete-orphan")
    bitacora = relationship("BitacoraProceso", back_populates="proceso", cascade="all, delete-orphan")
    
    # Relación con las partes del proceso (nueva estructura)
    partes = relationship("ParteProceso", back_populates="proceso", cascade="all, delete-orphan")
    diligencias = relationship("Diligencia", back_populates="proceso", cascade="all, delete-orphan")

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

    @property
    def juzgado_nombre(self):
        """Obtiene el nombre del juzgado"""
        return self.juzgado.nombre if self.juzgado else 'Sin asignar'
    
    @property
    def juez_nombre(self):
        """Obtiene el nombre completo del juez/especialista"""
        if self.especialista:
            return f"{self.especialista.nombres} {self.especialista.apellidos}".strip()
        return 'Sin asignar'

    def __repr__(self):
        return f"<Proceso(id={self.id}, expediente='{self.expediente}', estado='{self.estado}')>"