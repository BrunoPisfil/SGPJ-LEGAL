-- ============================================================
-- Actualización de tabla notificaciones para soportar nuevos tipos
-- Cambiar estructura para ser compatible con el modelo de SQLAlchemy
-- ============================================================

-- Tabla diligencias ya existe, solo proceder con notificaciones

-- Primero, renombrar la tabla antigua de notificaciones
ALTER TABLE notificaciones RENAME TO notificaciones_old;

-- Crear la nueva tabla con la estructura correcta
CREATE TABLE notificaciones (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  
  -- Relaciones con otros modelos
  audiencia_id BIGINT UNSIGNED NULL,
  diligencia_id BIGINT NULL,  -- Compatible con el id de diligencias (BIGINT sin UNSIGNED)
  proceso_id BIGINT UNSIGNED NULL,
  
  -- Contenido de la notificación
  tipo VARCHAR(50) NOT NULL,  -- 'AUDIENCIA_RECORDATORIO', 'DILIGENCIA_RECORDATORIO', etc.
  canal VARCHAR(50) NOT NULL,  -- 'SISTEMA', 'EMAIL', 'SMS'
  titulo VARCHAR(255) NOT NULL,
  mensaje LONGTEXT NOT NULL,
  
  -- Destinatario
  email_destinatario VARCHAR(255) NULL,
  telefono_destinatario VARCHAR(20) NULL,
  
  -- Estado y tracking
  estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',  -- 'PENDIENTE', 'ENVIADO', 'ERROR', 'LEIDO'
  fecha_programada DATETIME NULL,
  fecha_envio DATETIME NULL,
  fecha_leida DATETIME NULL,
  
  -- Metadata adicional
  metadata_extra LONGTEXT NULL,  -- JSON con datos adicionales
  error_mensaje LONGTEXT NULL,   -- Mensaje de error si falla
  
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
  CONSTRAINT fk_notif_audiencia FOREIGN KEY (audiencia_id) REFERENCES audiencias(id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_diligencia FOREIGN KEY (diligencia_id) REFERENCES diligencias(id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_proceso FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrar datos de la tabla anterior si existen (opcional)
-- INSERT INTO notificaciones (audiencia_id, proceso_id, tipo, canal, titulo, mensaje, email_destinatario, estado, fecha_envio, created_at)
-- SELECT audiencia_id, proceso_id, tipo_alerta, canal, asunto, cuerpo, destinatario, estado_envio, sent_at, created_at
-- FROM notificaciones_old
-- WHERE 1=0;  -- Cambiar 1=0 a 1=1 si quieres migrar datos

-- Eliminar la tabla antigua (después de revisar que todo funcione)
-- DROP TABLE notificaciones_old;

-- ============================================================
-- Nota: Ejecuta este script en tu base de datos MySQL
-- Luego revisa que todo está bien antes de eliminar notificaciones_old
-- ============================================================
