from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class TipoPersonaEnum(str, Enum):
    natural = "natural"
    juridica = "juridica"


class TipoDocumentoEnum(str, Enum):
    DNI = "DNI"
    RUC = "RUC"
    CE = "CE"
    PAS = "PAS"


# Esquemas para crear cliente
class ClienteCreate(BaseModel):
    tipo_persona: TipoPersonaEnum
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    razon_social: Optional[str] = None
    doc_tipo: TipoDocumentoEnum = TipoDocumentoEnum.DNI
    doc_numero: str
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    activo: bool = True

    class Config:
        from_attributes = True


# Esquemas para actualizar cliente
class ClienteUpdate(BaseModel):
    tipo_persona: Optional[TipoPersonaEnum] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    razon_social: Optional[str] = None
    doc_tipo: Optional[TipoDocumentoEnum] = None
    doc_numero: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None

    class Config:
        from_attributes = True


# Esquema de respuesta
class ClienteResponse(BaseModel):
    id: int
    tipo_persona: TipoPersonaEnum
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    razon_social: Optional[str] = None
    doc_tipo: TipoDocumentoEnum
    doc_numero: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Esquemas para listado con filtros
class ClienteListParams(BaseModel):
    skip: int = 0
    limit: int = 100
    search: Optional[str] = None
    tipo_persona: Optional[TipoPersonaEnum] = None
    activo: Optional[bool] = None

    class Config:
        from_attributes = True