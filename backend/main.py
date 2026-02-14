from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import engine, SessionLocal
from sqlalchemy import text
from app.services.auto_notifications import AutoNotificationService
import logging
import threading
import time
import os

# Solo importar schedule en desarrollo (no en Vercel)
# Vercel siempre tiene VERCEL=true o VERCEL=1
# En desarrollo local, VERCEL no existe
is_vercel_env = os.getenv('VERCEL') in ('true', '1', 'True')

if not is_vercel_env:
    try:
        import schedule
        has_schedule = True
    except ImportError:
        has_schedule = False
        schedule = None
else:
    has_schedule = False
    schedule = None

# Configurar logging
logger = logging.getLogger(__name__)

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


# ============================================================
# SCHEDULER DE NOTIFICACIONES AUTOMÁTICAS
# ============================================================

def ejecutar_notificaciones_automaticas():
    """Función que ejecuta las notificaciones automáticas"""
    
    if not settings.auto_notifications_enabled:
        logger.info("🔇 Notificaciones automáticas deshabilitadas")
        return
    
    try:
        logger.info("🔔 Ejecutando verificación de notificaciones automáticas...")
        db = SessionLocal()
        
        stats = AutoNotificationService.check_and_send_notifications(db)
        
        logger.info(f"✅ Verificación completada:")
        logger.info(f"   📧 Audiencias notificadas: {stats.get('audiencias', 0)}")
        logger.info(f"   📋 Diligencias notificadas: {stats.get('diligencias', 0)}")
        logger.info(f"   ⚠️  Errores: {len(stats.get('errors', []))}")
        
        if stats.get('errors'):
            for error in stats['errors']:
                logger.error(f"     ❌ {error}")
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Error en verificación automática: {e}")


def scheduler_worker():
    """Worker del scheduler que corre en background"""
    
    if schedule is None or not has_schedule:
        logger.error("⚠️  Schedule no disponible, scheduler no puede iniciar")
        return
    
    logger.info(f"📅 Scheduler configurado:")
    logger.info(f"   ⏰ Intervalo de verificación: {settings.notification_check_interval_minutes} minutos")
    logger.info(f"   📧 Audiencias: {settings.audiencia_notification_hours_list}h antes")
    logger.info(f"   📋 Diligencias: {settings.diligencia_notification_hours}h antes")
    
    # Programar la tarea
    schedule.every(settings.notification_check_interval_minutes).minutes.do(
        ejecutar_notificaciones_automaticas
    )
    
    # Ejecutar una vez al inicio para verificar que funciona
    logger.info("🚀 Ejecutando verificación inicial...")
    ejecutar_notificaciones_automaticas()
    
    # Loop infinito del scheduler
    while True:
        schedule.run_pending()
        time.sleep(60)  # Verificar cada minuto


@app.on_event("startup")
async def startup_event():
    """Eventos al iniciar la aplicación"""
    logger.info("🚀 Iniciando SGPJ Legal API...")
    
    # Verificar conexión a la base de datos
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Base de datos conectada")
    except Exception as e:
        logger.error(f"❌ Error de conexión a base de datos: {e}")
    
    # Iniciar scheduler en thread de background (solo en desarrollo, no en Vercel)
    if settings.auto_notifications_enabled and not is_vercel_env and has_schedule:
        scheduler_thread = threading.Thread(
            target=scheduler_worker,
            daemon=True,
            name="NotificationsScheduler"
        )
        scheduler_thread.start()
        logger.info("✅ Scheduler de notificaciones iniciado en background")
    elif is_vercel_env:
        logger.info("📌 Ejecutando en Vercel (serverless): Scheduler deshabilitado. Usar endpoint manual o cron job externo.")
    elif not has_schedule:
        logger.warning("⚠️  Módulo 'schedule' no disponible: Scheduler deshabilitado")
    elif not settings.auto_notifications_enabled:
        logger.warning("⚠️  Notificaciones automáticas deshabilitadas en configuración")


@app.on_event("shutdown")
async def shutdown_event():
    """Eventos al apagar la aplicación"""
    logger.info("🛑 Apagando SGPJ Legal API...")
    schedule.clear()  # Limpiar tareas programadas


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
