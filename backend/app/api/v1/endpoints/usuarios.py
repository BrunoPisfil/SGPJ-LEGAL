from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import verify_password, get_password_hash
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioUpdate, Usuario as UsuarioSchema
from app.api.deps import get_current_user

router = APIRouter()

# Esquemas adicionales
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.put("/profile", response_model=UsuarioSchema)
async def update_profile(
    user_data: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar el perfil del usuario autenticado"""
    
    # Actualizar los campos permitidos
    if user_data.nombre is not None:
        current_user.nombre = user_data.nombre
    
    if user_data.telefono is not None:
        current_user.telefono = user_data.telefono
    
    # Nota: El email no se puede cambiar por seguridad y para mantener integridad de la BD
    # Si deseas permitir cambios de email, necesitarías implementar verificación por email
    
    db.commit()
    db.refresh(current_user)
    
    return UsuarioSchema.from_orm(current_user)


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cambiar la contraseña del usuario autenticado"""
    
    # Verificar que la contraseña actual sea correcta
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    # Validar que la nueva contraseña sea diferente
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la actual"
        )
    
    # Actualizar la contraseña
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}


@router.get("/profile", response_model=UsuarioSchema)
async def get_profile(
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener el perfil del usuario autenticado"""
    return UsuarioSchema.from_orm(current_user)
