from sqlalchemy import Column, BigInteger, String, DateTime, Boolean, Enum, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Directorio(Base):
    """Modelo unificado para directorio de clientes, juzgados y especialistas"""
    __tablename__ = "directorio"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    
    # Tipo de entidad
    tipo = Column(
        Enum('cliente', 'juzgado', 'especialista', name='directorio_tipo_enum'),
        nullable=False,
        index=True
    )
    
    # Datos básicos comunes a todos
    nombre = Column(String(180), nullable=False)
    email = Column(String(190), nullable=True)
    telefono = Column(String(30), nullable=True)
    direccion = Column(String(250), nullable=True)
    
    # Campos específicos para CLIENTE (tipo='cliente')
    tipo_persona = Column(
        Enum('natural', 'juridica', name='tipo_persona_enum'),
        nullable=True  # Solo para clientes
    )
    nombres = Column(String(120), nullable=True)  # Para clientes naturales
    apellidos = Column(String(120), nullable=True)  # Para clientes naturales
    razon_social = Column(String(180), nullable=True)  # Para clientes jurídicos
    doc_tipo = Column(
        Enum('DNI', 'RUC', 'CE', 'PAS', name='doc_tipo_enum'),
        nullable=True  # Solo para clientes
    )
    doc_numero = Column(String(20), nullable=True)  # Solo para clientes
    
    # Campos específicos para JUZGADO (tipo='juzgado')
    distrito_judicial = Column(String(120), nullable=True)  # Solo para juzgados
    
    # Campos específicos para ESPECIALISTA (tipo='especialista')
    especialidad = Column(String(120), nullable=True)  # Solo para especialistas
    numero_colegiado = Column(String(50), nullable=True)  # Solo para especialistas
    juzgado_id = Column(BigInteger, nullable=True)  # FK a directorio para especialistas vinculados a juzgados
    
    # Control general
    activo = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    __table_args__ = (
        Index('idx_directorio_tipo', 'tipo'),
        Index('idx_directorio_nombre', 'nombre'),
        Index('idx_directorio_doc', 'doc_tipo', 'doc_numero'),
        Index('idx_directorio_juzgado', 'juzgado_id'),
    )

    def __repr__(self):
        if self.tipo == 'cliente':
            if self.tipo_persona == 'natural':
                return f"<Directorio(id={self.id}, tipo='cliente', nombre='{self.nombres} {self.apellidos}')>"
            else:
                return f"<Directorio(id={self.id}, tipo='cliente', nombre='{self.razon_social}')>"
        elif self.tipo == 'juzgado':
            return f"<Directorio(id={self.id}, tipo='juzgado', nombre='{self.nombre}')>"
        else:  # especialista
            return f"<Directorio(id={self.id}, tipo='especialista', nombre='{self.nombres} {self.apellidos}')>"
