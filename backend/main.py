from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from sqlalchemy import text
from app.core.database import engine  # ajusta si tu engine está en otra ruta

# Crear la instancia de FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="API para el Sistema de Gestión de Procesos Judiciales",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas de la API
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Endpoint raíz de la API"""
    return {
        "message": "¡Bienvenido a SGPJ Legal API!",
        "version": settings.version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Endpoint de salud de la API"""
    return {"status": "healthy", "service": settings.app_name}


@app.get("/db-check")
async def db_check():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"db": "connected"}
