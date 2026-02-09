# Sistema de Notificaciones Automáticas - Guía de Configuración y Monitoreo

## 📋 Resumen

El sistema está configurado para enviar notificaciones automáticas de diligencias **24 horas antes** de que ocurran, directamente a **ppisfil@hotmail.com**.

## 🔧 Configuración Actual

### Timezone
- **Zona Horaria:** America/Lima (UTC-5) - Perú
- **Ubicación:** `backend/app/core/config.py`
- **Variable:** `app_timezone: str = "America/Lima"`

### Notificaciones de Diligencias
- **Habilitado:** Sí ✅
- **Envío a:** ppisfil@hotmail.com, deyabeca22@gmail.com
- **Anticipación:** 2 horas antes
- **Verificación:** Cada 60 minutos

### Notificaciones de Audiencias
- **Habilitado:** Sí ✅
- **Envío a:** ppisfil@hotmail.com, deyabeca22@gmail.com
- **Anticipación:** 24 horas y 12 horas antes (dos notificaciones)
- **Verificación:** Cada 60 minutos

### Configuración en `config.py`
```python
app_timezone: str = "America/Lima"  # UTC-5 (Perú)
auto_notifications_enabled: bool = True

# Emails para notificaciones automáticas (múltiples destinatarios)
notification_emails: List[str] = [
    "ppisfil@hotmail.com",
    "deyabeca22@gmail.com"
]

# Audiencias: notificar 24h y 12h antes
audiencia_notification_hours_list: List[int] = [24, 12]

# Diligencias: notificar 2h antes
diligencia_notification_hours: int = 2

notification_check_interval_minutes: int = 60  # Verificar cada X minutos
```

## 📞 Monitoreo de Notificaciones

### 1. **Ver Estado General del Sistema**
```bash
GET /api/v1/admin/notificaciones-automaticas/status
```

Respuesta ejemplo:
```json
{
  "status": "ok",
  "timestamp": "2025-02-09T14:30:00-05:00",
  "pending": {
    "audiencias_proximas": 0,
    "diligencias_proximas": 2,
    "procesos_sin_revisar": 0,
    "next_check": "2025-02-09T15:30:00-05:00"
  },
  "scheduler": {
    "enabled": true,
    "check_interval_minutes": 60,
    "next_check": "2025-02-09T15:30:00-05:00"
  }
}
```

### 2. **Ejecutar Verificación Manual Ahora**
```bash
POST /api/v1/admin/notificaciones-automaticas/check-now
```

Respuesta ejemplo:
```json
{
  "status": "ok",
  "message": "Verificación completada",
  "results": {
    "audiencias_notificadas": 0,
    "diligencias_notificadas": 2,
    "procesos_notificados": 0,
    "errors": []
  },
  "timestamp": "2025-02-09T14:32:15-05:00"
}
```

### 3. **Ver Diligencias que Serán Notificadas Próximamente**
```bash
GET /api/v1/admin/notificaciones-automaticas/diligencias/proximas
```

Respuesta ejemplo:
```json
{
  "fecha_notificacion": "2025-02-10",
  "total": 2,
  "diligencias": [
    {
      "id": 1,
      "titulo": "Audiencia Preliminar",
      "motivo": "Presentación de evidencia",
      "fecha": "2025-02-10",
      "hora": "10:30:00",
      "estado": "PENDIENTE",
      "notificacion_enviada": false
    },
    {
      "id": 2,
      "titulo": "Junta de Información",
      "motivo": "Recolección de documentos",
      "fecha": "2025-02-10",
      "hora": "14:00:00",
      "estado": "EN_PROGRESO",
      "notificacion_enviada": false
    }
  ]
}
```

### 4. **Ver Logs Recientes de Notificaciones**
```bash
GET /api/v1/admin/notificaciones-automaticas/logs/recent?limit=20&type_filter=DILIGENCIA_RECORDATORIO
```

Parámetros:
- `limit` (default: 50) - Cantidad de logs a mostrar
- `type_filter` - Filtrar por tipo (ej: DILIGENCIA_RECORDATORIO, AUDIENCIA_RECORDATORIO)

Respuesta ejemplo:
```json
{
  "count": 3,
  "notificaciones": [
    {
      "id": 15,
      "tipo": "DILIGENCIA_RECORDATORIO",
      "titulo": "Recordatorio: Diligencia Audiencia Preliminar",
      "estado": "ENVIADO",
      "fecha_creacion": "2025-02-09T14:32:15-05:00",
      "fecha_envio": "2025-02-09T14:32:20-05:00",
      "email_destinatario": "ppisfil@hotmail.com",
      "diligencia_id": 1,
      "error_mensaje": null
    }
  ]
}
```

### 5. **Ver Notificaciones de una Diligencia Específica**
```bash
GET /api/v1/admin/notificaciones-automaticas/notificaciones/por-diligencia/{diligencia_id}
```

Ejemplo: `GET /api/v1/admin/notificaciones-automaticas/notificaciones/por-diligencia/1`

Respuesta:
```json
{
  "diligencia_id": 1,
  "total": 1,
  "notificaciones": [
    {
      "id": 15,
      "tipo": "DILIGENCIA_RECORDATORIO",
      "titulo": "Recordatorio: Diligencia Audiencia Preliminar",
      "mensaje": "Recordatorio automático: La diligencia 'Audiencia Preliminar' está programada para las 10:30 del 10/02/2025. Motivo: Presentación de evidencia",
      "estado": "ENVIADO",
      "canal": "SISTEMA",
      "fecha_creacion": "2025-02-09T14:32:15-05:00",
      "fecha_envio": "2025-02-09T14:32:20-05:00",
      "email_destinatario": "ppisfil@hotmail.com",
      "error_mensaje": null
    }
  ]
}
```

## 🐛 Problemas Comunes y Soluciones

### Problema 1: Las fechas se muestran con un día anterior
**Causa:** Problema de timezone en el frontend
**Solución:** Ya está arreglado usando `parse()` en lugar de `new Date()`

```typescript
// ✅ CORRECTO (después del arreglo)
format(parse(diligencia.fecha as string, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", { locale: es })

// ❌ INCORRECTO (antes)
format(new Date(diligencia.fecha), "dd/MM/yyyy", { locale: es })
```

### Problema 2: Las notificaciones no se envían
**Checklist:**
1. ✅ Verificar que `auto_notifications_enabled` esté en `True` en config.py
2. ✅ Verificar que el scheduler esté corriendo en el backend
3. ✅ Verificar credenciales SMTP en el archivo `.env`
4. ✅ Ejecutar `/check-now` para verificación manual
5. ✅ Revisar logs en `/logs/recent`

### Problema 3: Las notificaciones se envían tarde
**Causa:** El scheduler verifica cada 60 minutos
**Solución:** Cambiar `notification_check_interval_minutes` en config.py

## 📧 Configuración de Email

El sistema usa SMTP de Gmail para enviar emails. Asegúrate de configurar:

```env
# En .env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-app  # Usar contraseña de aplicación
```

Para usar Gmail:
1. Habilitar autenticación de 2 factores
2. Generar contraseña de aplicación: https://support.google.com/accounts/answer/185833
3. Usar esa contraseña en SMTP_PASSWORD

## 🚀 Iniciar el Sistema

### Opción 1: Con Scheduler (Recomendado)
```bash
cd backend
python scheduler.py
```

### Opción 2: API solo (sin notificaciones automáticas)
```bash
cd backend
python -m uvicorn main:app --reload
```

Luego ejecutar verificación manual con:
```bash
POST /api/v1/admin/notificaciones-automaticas/check-now
```

## ✅ Verificación de Funcionamiento

### Paso 1: Crear una diligencia de prueba para mañana
1. Ir a http://localhost:3000/diligencias/nueva
2. Crear diligencia para mañana (ej: 10/02/2025)
3. Activar checkbox "Notificar"

### Paso 2: Verificar que será notificada
```bash
GET /api/v1/admin/notificaciones-automaticas/diligencias/proximas
```

Debe aparecer la diligencia en el listado con `"notificacion_enviada": false`

### Paso 3: Ejecutar verificación manual
```bash
POST /api/v1/admin/notificaciones-automaticas/check-now
```

### Paso 4: Confirmar envío
```bash
GET /api/v1/admin/notificaciones-automaticas/logs/recent?type_filter=DILIGENCIA_RECORDATORIO
```

Debe mostrar estado `"ENVIADO"` con la fecha y hora.

### Paso 5: Revisar correo
Revisar ppisfil@hotmail.com para confirmar que llegó el email.

## 📊 Logging y Debugging

El sistema registra todas las operaciones. Para ver logs en tiempo real:

```bash
# Backend (en la carpeta donde corre el scheduler)
# Los logs aparecen en consola con timestamps y detalles
```

Logs incluyen:
- ✅ Diligencias detectadas
- ✅ Emails enviados
- ❌ Errores con detalles
- 📍 Timestamps en timezone de Perú

## 🔄 Automático vs Manual

| Acción | Automático | Manual |
|--------|-----------|--------|
| **Frecuencia** | Cada 60 min | Bajo demanda |
| **Endpoint** | N/A | POST /check-now |
| **Requiere** | Scheduler corriendo | Token de admin |
| **Uso** | Producción | Testing/Debug |

## 📝 Cambios Implementados

1. ✅ Agregado `app_timezone = "America/Lima"` en config
2. ✅ Creado módulo `app/core/timezone.py` para utilidades
3. ✅ Actualizado `app/services/auto_notifications.py` para:
   - Usar timezone correcto
   - Enviar a ppisfil@hotmail.com
   - Mejor logging
4. ✅ Creado endpoint admin `/api/v1/admin/notificaciones-automaticas/`
5. ✅ Arreglado problema de fechas en frontend con `parse()`
6. ✅ Actualizado modelo `Diligencia` con soporte de timezone

---

**Última actualización:** 09/02/2025
**Sistema:** SGPJ Legal v1.0
