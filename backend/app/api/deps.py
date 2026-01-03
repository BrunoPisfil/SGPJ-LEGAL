from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import verify_token
from app.models.usuario import Usuario

# Configurar el esquema de seguridad Bearer
security = HTTPBearer()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Usuario:
    """
    Dependencia para obtener el usuario actual desde el token JWT
    """
    # Verificar el token y obtener el email
    email = verify_token(credentials.credentials)
    
    # Buscar el usuario en la base de datos
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    return user


def get_current_active_admin(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """
    Dependencia para verificar que el usuario actual es administrador
    """
    if current_user.rol != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )
    return current_user


def get_current_abogado(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """
    Dependencia para verificar que el usuario es abogado o admin
    """
    if current_user.rol not in ['admin', 'abogado']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes. Se requiere rol de abogado."
        )
    return current_user