-- =========================================================
-- SGPJ Legal - Schema de Base de Datos MySQL
-- Sistema de Gestión de Procesos Judiciales
-- =========================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS sgpj_legal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sgpj_legal;

-- =========================================================
-- Tablas de seguridad (opcional básico)
-- =========================================================
CREATE TABLE usuarios (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','abogado','asistente','cliente') NOT NULL DEFAULT 'abogado',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- Directorio
-- =========================================================
CREATE TABLE juzgados (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(180) NOT NULL,
  distrito_judicial VARCHAR(120),
  direccion VARCHAR(250),
  telefono VARCHAR(30),
  creado_por BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_juzgados_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tipo_persona ENUM('natural','juridica') NOT NULL,
  nombres VARCHAR(120),
  apellidos VARCHAR(120),
  razon_social VARCHAR(180),
  doc_tipo ENUM('DNI','RUC','CE','PAS') NOT NULL DEFAULT 'DNI',
  doc_numero VARCHAR(20) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(190),
  direccion VARCHAR(250),
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_clientes_doc (doc_tipo, doc_numero),
  KEY idx_clientes_nombre (nombres, apellidos),
  KEY idx_clientes_razon (razon_social)
) ENGINE=InnoDB;

CREATE TABLE entidades (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(200) NOT NULL,
  ruc VARCHAR(11),
  telefono VARCHAR(30),
  email VARCHAR(190),
  direccion VARCHAR(250),
  notas TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_entidades_nombre (nombre),
  KEY idx_entidades_ruc (ruc)
) ENGINE=InnoDB;

CREATE TABLE abogados (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  colegiatura VARCHAR(40),
  telefono VARCHAR(30),
  email VARCHAR(190),
  usuario_id BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_abogados_nombre (apellidos, nombres),
  UNIQUE KEY uk_abogados_usuario (usuario_id),
  CONSTRAINT fk_abogados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE especialistas (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(190),
  juzgado_id BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_especialista_nombre (apellidos, nombres),
  CONSTRAINT fk_especialistas_juzgado FOREIGN KEY (juzgado_id) REFERENCES juzgados(id)
) ENGINE=InnoDB;

-- =========================================================
-- Procesos y Audiencias
-- =========================================================
CREATE TABLE procesos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  codigo_expediente VARCHAR(120) NOT NULL,
  materia VARCHAR(150) NOT NULL,
  demandante_id BIGINT UNSIGNED NOT NULL,
  -- Demandado puede ser cliente O entidad (una sola opción)
  demandado_cliente_id BIGINT UNSIGNED NULL,
  demandado_entidad_id BIGINT UNSIGNED NULL,
  juzgado_id BIGINT UNSIGNED,
  especialista_id BIGINT UNSIGNED,
  abogado_responsable_id BIGINT UNSIGNED,
  estado ENUM('pendiente_impulsar','pendiente_sentencia','resolucion','audiencia_programada') NOT NULL,
  descripcion_estado TEXT,
  fecha_ultima_actuacion DATE NULL,
  fecha_ultima_revision DATE NULL, -- para control de impulso (25/30 días)
  creado_por BIGINT UNSIGNED,
  updated_por BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_procesos_expediente (codigo_expediente),
  KEY idx_procesos_estado (estado),
  KEY idx_procesos_juzgado (juzgado_id),
  KEY idx_procesos_revision (fecha_ultima_revision),
  CONSTRAINT fk_proc_demandante FOREIGN KEY (demandante_id) REFERENCES clientes(id),
  CONSTRAINT fk_proc_dem_cliente FOREIGN KEY (demandado_cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_proc_dem_entidad FOREIGN KEY (demandado_entidad_id) REFERENCES entidades(id),
  CONSTRAINT fk_proc_juzgado FOREIGN KEY (juzgado_id) REFERENCES juzgados(id),
  CONSTRAINT fk_proc_especialista FOREIGN KEY (especialista_id) REFERENCES especialistas(id),
  CONSTRAINT fk_proc_abogado FOREIGN KEY (abogado_responsable_id) REFERENCES abogados(id),
  CONSTRAINT fk_proc_creado FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  CONSTRAINT fk_proc_actualizado FOREIGN KEY (updated_por) REFERENCES usuarios(id),
  CONSTRAINT chk_un_solo_demandado CHECK (
    (demandado_cliente_id IS NOT NULL) <> (demandado_entidad_id IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE audiencias (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  proceso_id BIGINT UNSIGNED NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  sede TEXT NULL,
  link TEXT NULL,
  notas TEXT,
  notificar TINYINT(1) NOT NULL DEFAULT 1,
  -- columna generada para consultas (fecha+hora)
  fecha_hora DATETIME AS (TIMESTAMP(fecha, hora)) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_audiencias_proceso (proceso_id),
  KEY idx_audiencias_fecha (fecha),
  KEY idx_audiencias_fechahora (fecha_hora),
  CONSTRAINT fk_audiencia_proceso FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE CASCADE,
  CONSTRAINT chk_audiencia_sede_o_link CHECK (
    (sede IS NOT NULL AND TRIM(sede) <> '') OR (link IS NOT NULL AND TRIM(link) <> '')
  )
) ENGINE=InnoDB;

-- =========================================================
-- Resoluciones y plazos (alertas 7d/3d/hoy)
-- =========================================================
CREATE TABLE resoluciones (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  proceso_id BIGINT UNSIGNED NOT NULL,
  tipo_resolucion ENUM('improcedente','infundada','fundada_en_parte','rechazo_medios_probatorios','no_ha_lugar') NOT NULL,
  fecha_notificacion DATE NOT NULL,
  accion_requerida ENUM('apelar','subsanar') NOT NULL,
  fecha_limite_accion DATE NOT NULL, -- definida por el abogado
  responsable_id BIGINT UNSIGNED,
  estado_accion ENUM('pendiente','en_tramite','completada') NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_resoluciones_plazo (fecha_limite_accion, estado_accion),
  CONSTRAINT fk_res_proceso FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================================================
-- Notificaciones (log de envíos)
-- =========================================================
CREATE TABLE notificaciones (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  
  -- Relaciones con otros modelos
  audiencia_id BIGINT UNSIGNED NULL,
  diligencia_id BIGINT UNSIGNED NULL,
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
) ENGINE=InnoDB;

-- =========================================================
-- Finanzas
-- =========================================================
CREATE TABLE contratos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  cliente_id BIGINT UNSIGNED NOT NULL,
  proceso_id BIGINT UNSIGNED NULL,
  descripcion TEXT,
  monto_total DECIMAL(12,2) NOT NULL CHECK (monto_total >= 0),
  moneda CHAR(3) NOT NULL DEFAULT 'PEN',
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_contratos_cliente (cliente_id),
  KEY idx_contratos_proceso (proceso_id),
  CONSTRAINT fk_contrato_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_contrato_proceso FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE pagos (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  contrato_id BIGINT UNSIGNED NOT NULL,
  fecha_pago DATE NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  medio VARCHAR(50),
  referencia VARCHAR(150),
  notas TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_pagos_contrato (contrato_id),
  CONSTRAINT fk_pago_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- Vistas útiles
-- =========================================================
CREATE OR REPLACE VIEW vw_saldos AS
SELECT
  c.id AS contrato_id,
  c.cliente_id,
  c.proceso_id,
  c.monto_total,
  COALESCE(SUM(p.monto),0) AS total_pagado,
  (c.monto_total - COALESCE(SUM(p.monto),0)) AS saldo_pendiente
FROM contratos c
LEFT JOIN pagos p ON p.contrato_id = c.id
GROUP BY c.id;

-- Próximas audiencias en 3 días exactos (útil para job)
CREATE OR REPLACE VIEW vw_audiencias_recordatorio_3d AS
SELECT a.*, pr.codigo_expediente, pr.materia, pr.abogado_responsable_id
FROM audiencias a
JOIN procesos pr ON pr.id = a.proceso_id
WHERE DATE(a.fecha_hora) = DATE(DATE_ADD(CURRENT_DATE(), INTERVAL 3 DAY));

-- Procesos sin impulso (25 y 30+ días) según fecha_ultima_revision
CREATE OR REPLACE VIEW vw_procesos_impulso_alertas AS
SELECT
  pr.*,
  DATEDIFF(CURRENT_DATE(), COALESCE(pr.fecha_ultima_revision, pr.created_at)) AS dias_sin_revision,
  CASE
    WHEN DATEDIFF(CURRENT_DATE(), COALESCE(pr.fecha_ultima_revision, pr.created_at)) >= 30 THEN 'critica_30d'
    WHEN DATEDIFF(CURRENT_DATE(), COALESCE(pr.fecha_ultima_revision, pr.created_at)) >= 25 THEN 'preventiva_25d'
    ELSE 'ok'
  END AS nivel_alerta
FROM procesos pr;

-- Resoluciones con plazos (7d/3d/hoy)
CREATE OR REPLACE VIEW vw_resoluciones_alertas AS
SELECT
  r.*,
  DATEDIFF(r.fecha_limite_accion, CURRENT_DATE()) AS dias_para_vencer,
  CASE
    WHEN DATEDIFF(r.fecha_limite_accion, CURRENT_DATE()) = 0 THEN 'plazo_hoy'
    WHEN DATEDIFF(r.fecha_limite_accion, CURRENT_DATE()) = 3 THEN 'plazo_3d'
    WHEN DATEDIFF(r.fecha_limite_accion, CURRENT_DATE()) = 7 THEN 'plazo_7d'
    ELSE 'sin_alerta'
  END AS tipo_alerta
FROM resoluciones r
WHERE r.estado_accion IN ('pendiente','en_tramite');

-- =========================================================
-- Índices recomendados adicionales (según carga real)
-- =========================================================
CREATE INDEX idx_procesos_estado_juzgado ON procesos(estado, juzgado_id);
CREATE INDEX idx_audiencias_notificar ON audiencias(notificar, fecha_hora);

-- =========================================================
-- Usuario administrador por defecto
-- =========================================================
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@sgpj.com', '$2b$12$ejemplo_hash_cambiar_en_produccion', 'admin');