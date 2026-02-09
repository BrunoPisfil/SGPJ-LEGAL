# 🎯 GUÍA RÁPIDA: Cómo Saber si tu Sistema Está Notificando

## ⏰ Configuración Actual

- **Audiencias:** Notificación a **24 HORAS y 12 HORAS** antes
- **Diligencias:** Notificación a **2 HORAS** antes
- **Emails destino:** ppisfil@hotmail.com y deyabeca22@gmail.com
- **Timezone:** America/Lima (UTC-5)

1. **Crea una diligencia** para mañana con "Notificar" activado
2. **Ejecuta el test:** `python backend/test_notificaciones.py`
3. **Verifica ppisfil@hotmail.com** - si llegó el email, ¡funciona!

---

## 🔍 Verificación Paso a Paso

### PASO 1: ¿El Backend Está Corriendo?

**Terminal 1: Inicia el API**
```bash
cd backend
python -m uvicorn main:app --reload
```

Deberías ver:
```
Uvicorn running on http://127.0.0.1:8000
```

### PASO 2: ¿El Scheduler Está Corriendo?

**Terminal 2: Inicia el Scheduler (IMPORTANTE)**
```bash
cd backend
python scheduler.py
```

Deberías ver:
```
📅 Scheduler iniciado - Verificando cada 60 minutos
🚀 Ejecutando verificación inicial...
```

⚠️ **IMPORTANTE:** Sin el scheduler, las notificaciones NO se envían automáticamente.

### PASO 3: Crear una Diligencia de Prueba

1. Ve a: http://localhost:3000/diligencias/nueva
2. Llena el formulario:
   - **Título:** "Prueba de Notificación"
   - **Motivo:** "Test del sistema"
   - **Fecha:** Selecciona MAÑANA
   - **Hora:** Selecciona una hora (ej: 10:00)
   - **Descripción:** "Diligencia de prueba"
   - **Notificar:** ☑️ ACTIVADO
3. Click en "Crear Diligencia"

✅ Deberías ver: "Diligencia creada correctamente"

### PASO 4: Ejecutar Test del Sistema

**Terminal 3: Ejecuta el test**
```bash
cd backend
python test_notificaciones.py
```

#### Resultado Esperado:

```
✅ Conectividad API
✅ Estado Notificaciones
✅ Diligencias Próximas (debe mostrar tu diligencia)
✅ Verificación Manual (debe mostrar "diligencias_notificadas": 1)
✅ Logs Recientes (debe mostrar [ENVIADO])

Total: 5/5 pruebas pasadas
✅ ¡Todas las pruebas pasaron! El sistema está funcionando correctamente.
```

### PASO 5: Verificar el Email

1. **Abre tu correo:** ppisfil@hotmail.com
2. **Busca un email con:**
   - Asunto: "Recordatorio: Diligencia Prueba de Notificación"
   - Contenido: Hora, fecha, motivo
   - Enviado HACE POCO

✅ Si está ahí, ¡el sistema funciona!

---

## 🔧 Si NO Funciona

### ❌ El test falla en "Conectividad API"

```
❌ No se puede conectar a la API
ℹ️  Asegúrate de que el backend está corriendo
```

**Solución:**
```bash
cd backend
python -m uvicorn main:app --reload
```

### ❌ El test muestra "Diligencias Próximas: 0"

**Posibles causas:**
1. La diligencia está para HOY, no para mañana
2. El checkbox "Notificar" no estaba activado
3. La diligencia se marcó como ya notificada

**Solución:**
```bash
# Crear una diligencia nueva para mañana
# Asegúrate de activar el checkbox "Notificar"
```

### ❌ El test muestra "Diligencias Próximas" pero NO envía

```
Verificación Manual
✅ Se encontraron 1 diligencias
Results:
  • Diligencias notificadas: 0  ← PROBLEMA
```

**Posibles causas:**
1. El scheduler NO está corriendo
2. Credenciales SMTP incorrectas
3. ppisfil@hotmail.com está mal configurado

**Solución:**

A) **Verificar scheduler:**
```bash
# Terminal 2 debe mostrar:
🔔 Iniciando verificación de notificaciones automáticas...
✅ Verificación completada:
   - Diligencias notificadas: 1
```

B) **Verificar credenciales SMTP en `.env`:**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=contraseña-de-aplicación
```

C) **Verificar config en `app/core/config.py`:**
```python
auto_notifications_enabled: bool = True  # DEBE ser True
email_from: str = "onboarding@resend.dev"  # O tu email
```

### ❌ El email NO llega a ppisfil@hotmail.com

**Posibles causas:**
1. SPAM folder - revisa ahí
2. Credenciales SMTP inválidas
3. Gmail requiere "contraseña de aplicación"

**Solución:**

A) **Revisar SPAM:**
En ppisfil@hotmail.com, busca en la carpeta "Correo no deseado"

B) **Si usas Gmail, generar contraseña de aplicación:**
1. Ve a: https://myaccount.google.com/security
2. Activa "Verificación de 2 pasos"
3. Genera "Contraseña de aplicación"
4. Usa esa contraseña en `SMTP_PASSWORD`

C) **Revisar logs del backend:**
```bash
# En la terminal donde corre el scheduler
# Deberías ver algo como:
✅ Email enviado mediante SMTP Gmail a ppisfil@hotmail.com
```

---

## 📊 Dashboard de Monitoreo

En lugar de ejecutar el test cada vez, usa los endpoints:

### Ver estado general
```bash
curl http://localhost:8000/api/v1/admin/notificaciones-automaticas/status
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "pending": {
    "diligencias_proximas": 2
  },
  "scheduler": {
    "enabled": true,
    "check_interval_minutes": 60
  }
}
```

### Ver diligencias que se notificarán
```bash
curl http://localhost:8000/api/v1/admin/notificaciones-automaticas/diligencias/proximas
```

**Respuesta esperada:**
```json
{
  "fecha_notificacion": "2025-02-10",
  "total": 1,
  "diligencias": [
    {
      "id": 1,
      "titulo": "Prueba de Notificación",
      "notificacion_enviada": false
    }
  ]
}
```

### Ejecutar verificación AHORA (sin esperar 60 min)
```bash
curl -X POST http://localhost:8000/api/v1/admin/notificaciones-automaticas/check-now
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "results": {
    "diligencias_notificadas": 1
  }
}
```

### Ver logs de notificaciones
```bash
curl "http://localhost:8000/api/v1/admin/notificaciones-automaticas/logs/recent?type_filter=DILIGENCIA_RECORDATORIO"
```

**Respuesta esperada:**
```json
{
  "notificaciones": [
    {
      "id": 5,
      "estado": "ENVIADO",
      "fecha_envio": "2025-02-09T14:32:20-05:00",
      "email_destinatario": "ppisfil@hotmail.com"
    }
  ]
}
```

---

## 🕐 Explicación: ¿Cuándo se Envía la Notificación?

| Hora | Acción |
|------|--------|
| **HOY 14:00** | Creas diligencia para MAÑANA 10:00 |
| **HOY 14:30** | Scheduler ejecuta verificación (1/60 min) |
| **HOY 14:31** | Sistema detecta: "Diligencia de mañana" → Envía email |
| **HOY 14:32** | Email llega a ppisfil@hotmail.com ✅ |
| **MAÑANA 10:00** | Ocurre la diligencia |

**Resumen:** Email llega ~24 horas antes (en la próxima ejecución del scheduler).

---

## ⏰ Cambiar el Intervalo (Para Testing)

Por defecto se verifica cada 60 minutos. Para testing rápido, cambiar a cada 1 minuto:

**Archivo:** `backend/app/core/config.py`
```python
notification_check_interval_minutes: int = 1  # Cambiar de 60 a 1
```

Luego reiniciar el scheduler:
```bash
# Ctrl+C para parar
# Luego:
python scheduler.py
```

Ahora verás notificaciones en ~1 minuto en lugar de ~60 minutos.

---

## 🎓 Resumen Rápido

| Componente | Ubicación | Prueba |
|-----------|-----------|--------|
| **API** | http://localhost:8000 | Inicia con `uvicorn main:app` |
| **Scheduler** | Terminal 2 | Inicia con `python scheduler.py` |
| **Frontend** | http://localhost:3000 | Crea diligencia |
| **Test Suite** | `python test_notificaciones.py` | Verifica todo |
| **Email** | ppisfil@hotmail.com | Busca notificaciones |
| **Logs** | Console del Scheduler | Ve qué pasó |

---

## ✅ Checklist Final

- [ ] Terminal 1: `uvicorn main:app --reload` ✅
- [ ] Terminal 2: `python scheduler.py` ✅
- [ ] Creé diligencia para mañana ✅
- [ ] Activé "Notificar" ✅
- [ ] Ejecuté `python test_notificaciones.py` ✅
- [ ] Todas las pruebas pasaron ✅
- [ ] Revisé ppisfil@hotmail.com ✅
- [ ] Vi el email de notificación ✅

**Si todo está en ✅, ¡tu sistema de notificaciones funciona perfectamente!**

---

**¿Preguntas?** Revisa el archivo `NOTIFICACIONES_AUTOMATICAS.md` para documentación completa.
