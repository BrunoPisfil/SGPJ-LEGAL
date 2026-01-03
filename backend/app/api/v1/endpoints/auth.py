from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.auth import verify_password, get_password_hash, create_access_token
from backend.app.models.usuario import Usuario
from backend.app.schemas.usuario import LoginRequest, TokenResponse, UsuarioCreate, Usuario as UsuarioSchema
from backend.app.api.deps import get_current_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Autenticación de usuarios"""
    # Buscar el usuario por email
    user = db.query(Usuario).filter(Usuario.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    # Crear token de acceso
    access_token = create_access_token(data={"sub": user.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UsuarioSchema.from_orm(user)
    )


@router.post("/register", response_model=UsuarioSchema)
async def register(
    user_data: UsuarioCreate,
    db: Session = Depends(get_db)
):
    """Registro de nuevos usuarios"""
    # Verificar si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear el nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    db_user = Usuario(
        nombre=user_data.nombre,
        email=user_data.email,
        telefono=user_data.telefono,
        password_hash=hashed_password,
        rol=user_data.rol
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UsuarioSchema.from_orm(db_user)


@router.get("/me", response_model=UsuarioSchema)
async def get_current_user_info(
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener información del usuario actual"""
    return UsuarioSchema.from_orm(current_user)


@router.post("/refresh")
async def refresh_token(
    current_user: Usuario = Depends(get_current_user)
):
    """Refrescar token de acceso"""
    access_token = create_access_token(data={"sub": current_user.email})
    return {"access_token": access_token, "token_type": "bearer"}