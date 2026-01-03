"""Pydantic schemas para Directorio (clientes, juzgados, especialistas unificados)"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TipoDirectorio(str, Enum):
    cliente = "cliente"
    juzgado = "juzgado"
    especialista = "especialista"


class TipoPersona(str, Enum):
    natural = "natural"
    juridica = "juridica"


class TipoDocumento(str, Enum):
    DNI = "DNI"
    RUC = "RUC"
    CE = "CE"
    PAS = "PAS"


# Base schema con campos comunes
class DirectorioBase(BaseModel):
    tipo: TipoDirectorio
    nombre: str = Field(..., max_length=180)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=30)
    direccion: Optional[str] = Field(None, max_length=250)
    activo: bool = True


# Campos específicos para CLIENTE
class DirectorioClienteCreate(DirectorioBase):
    tipo: TipoDirectorio = TipoDirectorio.cliente
    tipo_persona: TipoPersona
    nombres: Optional[str] = Field(None, max_length=120)
    apellidos: Optional[str] = Field(None, max_length=120)
    razon_social: Optional[str] = Field(None, max_length=180)
    doc_tipo: TipoDocumento = TipoDocumento.DNI
    doc_numero: str = Field(..., max_length=20)


# Campos específicos para JUZGADO
class DirectorioJuzgadoCreate(DirectorioBase):
    tipo: TipoDirectorio = TipoDirectorio.juzgado
    distrito_judicial: Optional[str] = Field(None, max_length=120)


# Campos específicos para ESPECIALISTA
class DirectorioEspecialistaCreate(DirectorioBase):
    tipo: TipoDirectorio = TipoDirectorio.especialista
    nombres: Optional[str] = Field(None, max_length=120)
    apellidos: Optional[str] = Field(None, max_length=120)
    especialidad: Optional[str] = Field(None, max_length=120)
    numero_colegiado: Optional[str] = Field(None, max_length=50)
    juzgado_id: Optional[int] = None  # Especialista vinculado a un juzgado


# Union type para crear cualquier tipo
class DirectorioCreate(BaseModel):
    tipo: TipoDirectorio
    nombre: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    tipo_persona: Optional[TipoPersona] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    razon_social: Optional[str] = None
    doc_tipo: Optional[TipoDocumento] = None
    doc_numero: Optional[str] = None
    distrito_judicial: Optional[str] = None
    especialidad: Optional[str] = None
    numero_colegiado: Optional[str] = None
    juzgado_id: Optional[int] = None
    activo: bool = True


class DirectorioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    tipo_persona: Optional[TipoPersona] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    razon_social: Optional[str] = None
    doc_tipo: Optional[TipoDocumento] = None
    doc_numero: Optional[str] = None
    distrito_judicial: Optional[str] = None
    especialidad: Optional[str] = None
    numero_colegiado: Optional[str] = None
    juzgado_id: Optional[int] = None
    activo: Optional[bool] = None


class DirectorioResponse(BaseModel):
    id: int
    tipo: TipoDirectorio
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    tipo_persona: Optional[TipoPersona] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    razon_social: Optional[str] = None
    doc_tipo: Optional[TipoDocumento] = None
    doc_numero: Optional[str] = None
    distrito_judicial: Optional[str] = None
    especialidad: Optional[str] = None
    numero_colegiado: Optional[str] = None
    juzgado_id: Optional[int] = None
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Respuesta especializada por tipo
class DirectorioClienteResponse(DirectorioResponse):
    tipo: TipoDirectorio = TipoDirectorio.cliente
    tipo_persona: TipoPersona
    doc_numero: str


class DirectorioJuzgadoResponse(DirectorioResponse):
    tipo: TipoDirectorio = TipoDirectorio.juzgado
    distrito_judicial: Optional[str] = None


class DirectorioEspecialistaResponse(DirectorioResponse):
    tipo: TipoDirectorio = TipoDirectorio.especialista
    nombres: str
    apellidos: str
