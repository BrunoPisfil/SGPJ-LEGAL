from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioUpdate, Usuario as UsuarioSchema
from app.api.deps import get_current_user

router = APIRouter()


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


@router.get("/profile", response_model=UsuarioSchema)
async def get_profile(
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener el perfil del usuario autenticado"""
    return UsuarioSchema.from_orm(current_user)
