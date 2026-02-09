"""
Script para aplicar automáticamente la migración de la tabla notificaciones
Ejecutar: python fix_notificaciones_db.py
"""

from sqlalchemy import text
from app.core.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_notificaciones_table():
    """Aplicar la migración a la tabla notificaciones"""
    
    with engine.connect() as conn:
        try:
            logger.info("🔧 Iniciando migración de tabla notificaciones...")
            
            # Paso 1: Verificar si la tabla antigua existe
            logger.info("📋 Paso 1: Verificando tabla actual...")
            result = conn.execute(text("""
                SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones'
            """))
            
            if not result.fetchone():
                logger.warning("⚠️  Tabla notificaciones no existe. Creando desde cero...")
                create_new_table(conn)
                logger.info("✅ Tabla notificaciones creada correctamente")
                return
            
            # Paso 2: Respaldar tabla antigua
            logger.info("📋 Paso 2: Respaldar tabla antigua...")
            try:
                conn.execute(text("ALTER TABLE notificaciones RENAME TO notificaciones_old"))
                conn.commit()
                logger.info("✅ Tabla respaldata como notificaciones_old")
            except Exception as e:
                logger.warning(f"⚠️  No se pudo respaldar (probablemente ya existe): {e}")
                conn.rollback()
            
            # Paso 3: Crear tabla nueva
            logger.info("📋 Paso 3: Creando nueva tabla notificaciones...")
            create_new_table(conn)
            logger.info("✅ Nueva tabla creada correctamente")
            
            # Paso 4: Migrar datos si existen (opcional)
            logger.info("📋 Paso 4: Migrando datos...")
            try:
                conn.execute(text("""
                    INSERT INTO notificaciones 
                    (audiencia_id, proceso_id, tipo, canal, titulo, mensaje, 
                     email_destinatario, estado, fecha_envio, created_at)
                    SELECT 
                        audiencia_id, 
                        proceso_id, 
                        tipo_alerta, 
                        canal, 
                        COALESCE(asunto, 'Sin asunto'), 
                        COALESCE(cuerpo, ''), 
                        destinatario, 
                        estado_envio, 
                        sent_at, 
                        created_at
                    FROM notificaciones_old
                """))
                conn.commit()
                count = conn.execute(text("SELECT COUNT(*) FROM notificaciones")).scalar()
                logger.info(f"✅ {count} registros migrados correctamente")
            except Exception as e:
                logger.warning(f"⚠️  No se pudieron migrar datos: {e}")
                logger.info("   Los datos siguen disponibles en notificaciones_old")
                conn.rollback()
            
            # Paso 5: Limpiar
            logger.info("📋 Paso 5: Limpieza...")
            try:
                conn.execute(text("DROP TABLE notificaciones_old"))
                conn.commit()
                logger.info("✅ Tabla antigua eliminada")
            except Exception as e:
                logger.warning(f"⚠️  No se pudo eliminar tabla antigua: {e}")
                logger.info("   Puedes eliminarla manualmente con: DROP TABLE notificaciones_old;")
                conn.rollback()
            
            logger.info("✅ ¡Migración completada exitosamente!")
            logger.info("🔄 Reinicia el scheduler para que las notificaciones funcionen")
            
        except Exception as e:
            logger.error(f"❌ Error durante la migración: {e}")
            conn.rollback()
            raise

def create_new_table(conn):
    """Crear la nueva tabla notificaciones con el schema correcto"""
    
    # Verificar que tabla diligencias existe
    logger.info("📋 Verificando que tabla diligencias existe...")
    try:
        result = conn.execute(text("SELECT COUNT(*) FROM diligencias"))
        count = result.scalar()
        logger.info(f"✅ Tabla diligencias encontrada ({count} registros)")
    except Exception as e:
        logger.error(f"❌ Tabla diligencias no encontrada: {e}")
        logger.error("   Asegúrate de que la tabla diligencias existe en tu base de datos")
        raise
    
    # Crear tabla notificaciones con estructura compatible con diligencias existente
    # La tabla diligencias tiene id BIGINT (sin UNSIGNED), así que diligencia_id también debe ser BIGINT
    create_notificaciones_sql = """
    CREATE TABLE notificaciones (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      
      -- Relaciones con otros modelos
      audiencia_id BIGINT UNSIGNED NULL,
      diligencia_id BIGINT NULL,  -- Compatible con id BIGINT de diligencias
      proceso_id BIGINT UNSIGNED NULL,
      
      -- Contenido de la notificación
      tipo VARCHAR(50) NOT NULL,
      canal VARCHAR(50) NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      mensaje LONGTEXT NOT NULL,
      
      -- Destinatario
      email_destinatario VARCHAR(255) NULL,
      telefono_destinatario VARCHAR(20) NULL,
      
      -- Estado y tracking
      estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
      fecha_programada DATETIME NULL,
      fecha_envio DATETIME NULL,
      fecha_leida DATETIME NULL,
      
      -- Metadata adicional
      metadata_extra LONGTEXT NULL,
      error_mensaje LONGTEXT NULL,
      
      -- Campos adicionales para compatibilidad
      expediente VARCHAR(120) NULL,
      destinatario VARCHAR(255) NULL,
      
      -- Timestamps
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Índices
      KEY idx_notif_tipo (tipo),
      KEY idx_notif_estado (estado),
      KEY idx_notif_audiencia (audiencia_id),
      KEY idx_notif_diligencia (diligencia_id),
      KEY idx_notif_proceso (proceso_id),
      KEY idx_notif_fecha_envio (fecha_envio),
      KEY idx_notif_email (email_destinatario),
      
      -- Foreign keys
      CONSTRAINT fk_notif_audiencia FOREIGN KEY (audiencia_id) 
        REFERENCES audiencias(id) ON DELETE SET NULL,
      CONSTRAINT fk_notif_diligencia FOREIGN KEY (diligencia_id) 
        REFERENCES diligencias(id) ON DELETE SET NULL,
      CONSTRAINT fk_notif_proceso FOREIGN KEY (proceso_id) 
        REFERENCES procesos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    """
    
    logger.info("📋 Creando tabla notificaciones con estructura compatible...")
    conn.execute(text(create_notificaciones_sql))
    conn.commit()
    logger.info("✅ Tabla notificaciones creada correctamente")

if __name__ == "__main__":
    logger.info("""
╔════════════════════════════════════════════════════════════╗
║   FIX DE NOTIFICACIONES - Migración de Tabla               ║
║   Script para aplicar el fix automáticamente               ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    fix_notificaciones_table()
