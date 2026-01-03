from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UsuarioBase(BaseModel):
    """Esquema base para usuarios"""
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    rol: str = "abogado"


class UsuarioCreate(UsuarioBase):
    """Esquema para crear usuario"""
    password: str


class UsuarioUpdate(BaseModel):
    """Esquema para actualizar usuario"""
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None


class UsuarioInDB(UsuarioBase):
    """Esquema para usuario en base de datos"""
    id: int
    activo: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Usuario(UsuarioInDB):
    """Esquema público para usuario (sin password_hash)"""
    pass


# Esquemas de autenticación
class LoginRequest(BaseModel):
    """Esquema para solicitud de login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Esquema para respuesta de token"""
    access_token: str
    token_type: str = "bearer"
    user: Usuario


class PasswordChange(BaseModel):
    """Esquema para cambio de contraseña"""
    current_password: str
    new_password: str