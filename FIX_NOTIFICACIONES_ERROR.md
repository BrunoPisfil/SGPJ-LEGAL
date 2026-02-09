# 🔧 FIX: Error de Notificaciones - Data truncated for column 'tipo'

## ❌ Problema

Error al enviar notificaciones automáticas:
```
(pymysql.err.DataError) (1265, "Data truncated for column 'tipo' at row 1")
```

## 🎯 Causa Raíz

**Mismatch entre el schema de la BD y el modelo de SQLAlchemy**

### Lo que estaba en la BD (viejo):
```sql
tipo_alerta ENUM('audiencia_3d','impulso_25d','impulso_30d','plazo_7d','plazo_3d','plazo_hoy')
canal ENUM('email','sms')
```

### Lo que el código intenta insertar:
```python
tipo='DILIGENCIA_RECORDATORIO'  # ❌ No existe en el ENUM
canal='SISTEMA'                 # ❌ No existe en el ENUM
```

## ✅ Solución

### Paso 1: Ejecutar la Migración SQL

En tu MySQL, ejecutar:

```bash
cd database/migrations
mysql -u root -p sgpj_legal < 001_fix_notificaciones_schema.sql
```

O manually en MySQL:

```sql
-- Respaldar la tabla antigua
ALTER TABLE notificaciones RENAME TO notificaciones_old;

-- Crear nueva tabla con columnas VARCHAR en lugar de ENUM
CREATE TABLE notificaciones (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  audiencia_id BIGINT UNSIGNED NULL,
  diligencia_id BIGINT UNSIGNED NULL,
  proceso_id BIGINT UNSIGNED NULL,
  tipo VARCHAR(50) NOT NULL,
  canal VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje LONGTEXT NOT NULL,
  email_destinatario VARCHAR(255) NULL,
  telefono_destinatario VARCHAR(20) NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  fecha_programada DATETIME NULL,
  fecha_envio DATETIME NULL,
  fecha_leida DATETIME NULL,
  metadata_extra LONGTEXT NULL,
  error_mensaje LONGTEXT NULL,
  expediente VARCHAR(120) NULL,
  destinatario VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  KEY idx_notif_tipo (tipo),
  KEY idx_notif_estado (estado),
  KEY idx_notif_audiencia (audiencia_id),
  KEY idx_notif_diligencia (diligencia_id),
  KEY idx_notif_proceso (proceso_id),
  
  CONSTRAINT fk_notif_audiencia FOREIGN KEY (audiencia_id) REFERENCES audiencias(id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_diligencia FOREIGN KEY (diligencia_id) REFERENCES diligencias(id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_proceso FOREIGN KEY (proceso_id) REFERENCES procesos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Luego borrar tabla antigua:
DROP TABLE notificaciones_old;
```

### Paso 2: Reiniciar el Scheduler

```bash
# Terminal 2
cd backend
python scheduler.py
```

### Paso 3: Probar Nuevamente

```bash
# Crear diligencia de prueba
# Esperar 2 horas o ejecutar manual:
curl -X POST http://localhost:8000/api/v1/admin/notificaciones-automaticas/check-now
```

## 📊 Cambios en la Tabla

| Campo | Antes | Después |
|-------|-------|---------|
| `tipo_alerta` | ENUM limitado | `tipo` VARCHAR(50) - flexible |
| `canal` | ENUM('email','sms') | VARCHAR(50) - soporta 'SISTEMA' |
| `estado_envio` | ENUM | `estado` VARCHAR(50) |
| Estructura | Vieja (3 tipos) | Nueva (múltiples tipos) |

## 🎨 Valores Soportados Ahora

### tipo:
- `AUDIENCIA_RECORDATORIO` ✅
- `DILIGENCIA_RECORDATORIO` ✅
- `PROCESO_ACTUALIZADO` ✅
- Cualquier otro tipo que agregues

### canal:
- `SISTEMA` ✅
- `EMAIL` ✅
- `SMS` ✅
- Cualquier otro canal

### estado:
- `PENDIENTE` ✅
- `ENVIADO` ✅
- `ERROR` ✅
- `LEIDO` ✅

## 🚀 Luego de Aplicar el Fix

Las notificaciones deberían funcionar correctamente:

```bash
# Ver estado
curl http://localhost:8000/api/v1/admin/notificaciones-automaticas/status

# Ver logs de notificaciones
curl http://localhost:8000/api/v1/admin/notificaciones-automaticas/logs/recent
```

Deberías ver:
```json
{
  "notificaciones": [
    {
      "tipo": "DILIGENCIA_RECORDATORIO",
      "estado": "ENVIADO",
      "email_destinatario": "ppisfil@hotmail.com"
    }
  ]
}
```

## 📝 Archivos Modificados

- ✅ `database/schema.sql` - Actualizado para futuras instalaciones
- ✅ `database/migrations/001_fix_notificaciones_schema.sql` - Script de migración

## ⚠️ Importante

Si tenías notificaciones en la BD antigua que quieres preservar, antes de eliminar `notificaciones_old`, puedes hacer:

```sql
-- Copiar datos
INSERT INTO notificaciones (audiencia_id, proceso_id, tipo, canal, titulo, mensaje, email_destinatario, estado, fecha_envio, created_at)
SELECT audiencia_id, proceso_id, tipo_alerta, canal, asunto, cuerpo, destinatario, estado_envio, sent_at, created_at
FROM notificaciones_old;

-- Luego borrar
DROP TABLE notificaciones_old;
```

---

**Una vez aplicado este fix, las notificaciones automáticas funcionarán correctamente.** 🎉
