"""
Tarea programada para notificaciones automáticas
Ejecuta cada hora para verificar:
- Audiencias próximas (24h antes)
- Procesos sin revisar (7 días)
"""

import asyncio
import schedule
import time
import logging
from datetime import datetime

from backend.app.core.database import SessionLocal
from backend.app.services.auto_notifications import AutoNotificationService
from backend.app.core.config import settings

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def ejecutar_notificaciones_automaticas():
    """Función que ejecuta las notificaciones automáticas"""
    
    if not settings.auto_notifications_enabled:
        logger.info("Notificaciones automáticas deshabilitadas")
        return
    
    logger.info("🔔 Iniciando verificación de notificaciones automáticas...")
    
    db = SessionLocal()
    try:
        stats = AutoNotificationService.check_and_send_notifications(db)
        
        logger.info(f"✅ Verificación completada:")
        logger.info(f"   - Audiencias notificadas: {stats['audiencias']}")
        logger.info(f"   - Procesos notificados: {stats['procesos']}")
        
        if stats['errors']:
            logger.error(f"   - Errores: {len(stats['errors'])}")
            for error in stats['errors']:
                logger.error(f"     {error}")
        
    except Exception as e:
        logger.error(f"❌ Error en tarea automática: {e}")
    finally:
        db.close()


def iniciar_scheduler():
    """Iniciar el programador de tareas"""
    
    # Programar ejecución cada X minutos según configuración
    interval = settings.notification_check_interval_minutes
    schedule.every(interval).minutes.do(ejecutar_notificaciones_automaticas)
    
    logger.info(f"📅 Scheduler iniciado - Verificando cada {interval} minutos")
    logger.info(f"🔔 Notificaciones de audiencias: {settings.audiencia_notification_hours}h antes")
    logger.info(f"📋 Notificaciones de procesos: {settings.proceso_review_notification_days} días sin revisar")
    
    # Ejecutar una vez al inicio
    logger.info("🚀 Ejecutando verificación inicial...")
    ejecutar_notificaciones_automaticas()
    
    # Mantener el scheduler corriendo
    while True:
        schedule.run_pending()
        time.sleep(60)  # Verificar cada minuto si hay tareas pendientes


if __name__ == "__main__":
    iniciar_scheduler()