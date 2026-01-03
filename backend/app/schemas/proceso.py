from pydantic import BaseModel, Field, computed_field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class EstadoProceso(str, Enum):
    ACTIVO = "Activo"
    EN_TRAMITE = "En trámite"
    SUSPENDIDO = "Suspendido"
    ARCHIVADO = "Archivado"
    FINALIZADO = "Finalizado"

class TipoProceso(str, Enum):
    CIVIL = "Civil"
    PENAL = "Penal"
    LABORAL = "Laboral"
    ADMINISTRATIVO = "Administrativo"
    FAMILIA = "Familia"
    COMERCIAL = "Comercial"

class EstadoJuridico(str, Enum):
    PENDIENTE_IMPULSAR = "pendiente_impulsar"
    PENDIENTE_SENTENCIA = "pendiente_sentencia"
    RESOLUCION = "resolucion"
    AUDIENCIA_PROGRAMADA = "audiencia_programada"

class ProcesoBase(BaseModel):
    expediente: str = Field(..., description="Número de expediente único")
    tipo: TipoProceso = Field(..., description="Tipo de proceso judicial")
    materia: str = Field(..., description="Materia del proceso")
    demandante: str = Field(..., description="Nombre del demandante")
    demandado: str = Field(..., description="Nombre del demandado")
    juzgado: str = Field(..., description="Juzgado asignado")
    juez: Optional[str] = Field(None, description="Juez asignado")
    estado: EstadoProceso = Field(default=EstadoProceso.ACTIVO, description="Estado actual del proceso")
    monto_pretension: Optional[float] = Field(None, description="Monto de la pretensión")
    fecha_inicio: date = Field(..., description="Fecha de inicio del proceso")
    fecha_notificacion: Optional[date] = Field(None, description="Fecha de notificación")
    fecha_ultima_revision: Optional[date] = Field(None, description="Fecha de última revisión")
    observaciones: Optional[str] = Field(None, description="Observaciones del proceso")

class ProcesoCreate(ProcesoBase):
    cliente_id: Optional[int] = Field(None, description="ID del cliente si es nuestro cliente")

class ProcesoUpdate(BaseModel):
    tipo: Optional[TipoProceso] = None
    materia: Optional[str] = None
    demandante: Optional[str] = None
    demandado: Optional[str] = None
    juzgado: Optional[str] = None
    juez: Optional[str] = None
    estado: Optional[EstadoProceso] = None
    estado_juridico: Optional[EstadoJuridico] = None
    monto_pretension: Optional[float] = None
    fecha_inicio: Optional[date] = None
    fecha_notificacion: Optional[date] = None
    fecha_ultima_revision: Optional[date] = None
    observaciones: Optional[str] = None

class ProcesoResponse(BaseModel):
    id: int
    expediente: str
    tipo: TipoProceso
    materia: str
    estado: Optional[EstadoProceso] = None
    estado_juridico: Optional[EstadoJuridico] = None
    monto_pretension: Optional[float] = None
    fecha_inicio: date
    fecha_notificacion: Optional[date] = None
    fecha_ultima_revision: Optional[date] = None
    observaciones: Optional[str] = None
    abogado_responsable_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nuevos campos normalizados
    juzgado_nombre: str = Field(..., description="Nombre del juzgado")
    juez_nombre: Optional[str] = Field(None, description="Nombre del juez")
    demandantes: List[str] = Field(default_factory=list, description="Lista de demandantes")
    demandados: List[str] = Field(default_factory=list, description="Lista de demandados")
    
    # Campos concatenados para compatibilidad con frontend
    demandantes_nombres: Optional[str] = Field(None, description="Demandantes concatenados")
    demandados_nombres: Optional[str] = Field(None, description="Demandados concatenados")
    
    # Campos de compatibilidad - estos se asignan manualmente en el endpoint
    demandante: Optional[str] = Field(None, description="Primer demandante (compatibilidad)")
    demandado: Optional[str] = Field(None, description="Primer demandado (compatibilidad)")
    juzgado: Optional[str] = Field(None, description="Nombre del juzgado (compatibilidad)")
    juez: Optional[str] = Field(None, description="Nombre del juez (compatibilidad)")

    class Config:
        from_attributes = True