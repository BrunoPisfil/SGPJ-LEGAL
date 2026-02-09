from fastapi import APIRouter
from app.api.v1.endpoints import auth, procesos, audiencias, finanzas, directorio, dashboard, notificaciones, partes_proceso, bitacora, resoluciones, usuarios, diligencias, notificaciones_automaticas

api_router = APIRouter()

# Incluir todas las rutas de los endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["autenticación"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(procesos.router, prefix="/procesos", tags=["procesos"])
api_router.include_router(bitacora.router, prefix="/procesos", tags=["bitácora"])  # Anidado bajo procesos
api_router.include_router(audiencias.router, prefix="/audiencias", tags=["audiencias"])
api_router.include_router(diligencias.router, tags=["diligencias"])
api_router.include_router(resoluciones.router, prefix="/resoluciones", tags=["resoluciones"])
api_router.include_router(finanzas.router, prefix="/finanzas", tags=["finanzas"])
api_router.include_router(directorio.router, prefix="/directorio", tags=["directorio"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(notificaciones.router, prefix="/notificaciones", tags=["notificaciones"])
api_router.include_router(notificaciones_automaticas.router)  # Admin endpoints con su propio prefijo
api_router.include_router(partes_proceso.router, tags=["partes-proceso"])