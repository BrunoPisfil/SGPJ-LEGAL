# 📨 Actualización: Notificaciones Configuradas para Múltiples Emails y Horarios

## ✅ Cambios Realizados

### 1️⃣ **Emails Destino (Múltiples)**
Ahora las notificaciones se envían a **DOS** correos:
- ✅ ppisfil@hotmail.com
- ✅ deyabeca22@gmail.com

### 2️⃣ **Horarios de Notificación**

#### 📅 **AUDIENCIAS:** Dos notificaciones por audiencia
```
Primera notificación:  24 horas ANTES
Segunda notificación:  12 horas ANTES
```

**Ejemplo:**
- Audiencia programada para: **Viernes 15 de febrero a las 10:00 AM**
- 1ª Notificación:          **Jueves 14 de febrero a las 10:00 AM** ← 24h antes
- 2ª Notificación:          **Viernes 15 de febrero a las 10:00 AM** ← 12h antes (a las 10 AM del mismo día)

#### ⏰ **DILIGENCIAS:** Una notificación
```
Notificación: 2 horas ANTES (cambiado de 24 horas)
```

**Ejemplo:**
- Diligencia programada para: **Martes 17 de febrero a las 14:00 (2:00 PM)**
- Notificación:               **Martes 17 de febrero a las 12:00 (12:00 PM)** ← 2h antes

---

## 🔧 Archivos Modificados

### `backend/app/core/config.py`
```python
# Múltiples emails para notificaciones
notification_emails: List[str] = [
    "ppisfil@hotmail.com",
    "deyabeca22@gmail.com"
]

# Audiencias: notificar 24h Y 12h antes (lista)
audiencia_notification_hours_list: List[int] = [24, 12]

# Diligencias: notificar 2h antes (int)
diligencia_notification_hours: int = 2
```

### `backend/app/services/auto_notifications.py`

#### Audiencias (ahora notifica 2 veces)
```python
for target_hours in settings.audiencia_notification_hours_list:  # [24, 12]
    # Por cada hora configurada, se envía a todos los emails
    for email_destino in settings.notification_emails:
        # Crear y enviar notificación
```

#### Diligencias (notifica a múltiples emails)
```python
for email_destino in settings.notification_emails:
    # Crear notificación para cada email
    # Enviar a ppisfil@hotmail.com
    # Enviar a deyabeca22@gmail.com
```

---

## 📊 Resumida: Matriz de Notificaciones

| Tipo | Horario | Emails | Frecuencia |
|------|---------|--------|-----------|
| **Audiencia** | 24h antes | ppisfil@hotmail.com<br>deyabeca22@gmail.com | ✅ 1ª notificación |
| **Audiencia** | 12h antes | ppisfil@hotmail.com<br>deyabeca22@gmail.com | ✅ 2ª notificación |
| **Diligencia** | 2h antes | ppisfil@hotmail.com<br>deyabeca22@gmail.com | ✅ 1 notificación |

---

## 🧪 Testing

### Ver la configuración actual:
```bash
curl http://localhost:8000/api/v1/admin/notificaciones-automaticas/status
```

Verás:
```json
{
  "pending": {
    "audiencias_proximas": 2,  // 24h + 12h
    "diligencias_proximas": 1  // 2h
  }
}
```

### Ejecutar notificación manual:
```bash
curl -X POST http://localhost:8000/api/v1/admin/notificaciones-automaticas/check-now
```

### Ver logs:
```bash
curl http://localhost:8000/api/v1/admin/notificaciones-automaticas/logs/recent?type_filter=DILIGENCIA_RECORDATORIO
```

Verás que ahora aparecen **dos destinatarios** por notificación:
```json
{
  "notificaciones": [
    {
      "email_destinatario": "ppisfil@hotmail.com",
      "estado": "ENVIADO"
    },
    {
      "email_destinatario": "deyabeca22@gmail.com",
      "estado": "ENVIADO"
    }
  ]
}
```

---

## ⏰ Ejemplo Completo de Timeline

### Caso: Audiencia el Viernes 21 de febrero a las 3:00 PM

**Configuración:**
- Notificar 24h antes
- Notificar 12h antes
- Emails: ppisfil@hotmail.com, deyabeca22@gmail.com

**Timeline:**
```
Jueves 20 de febrero
14:00 - 15:00   → VERIFICACIÓN 1: Busca audiencias en 24h
                   ✅ Encuentra audiencia
                   ✅ Envía email #1 a ppisfil@hotmail.com
                   ✅ Envía email #2 a deyabeca22@gmail.com
                   💾 Registra en BD: 2 notificaciones ENVIADAS

Viernes 21 de febrero
02:00 - 03:00   → VERIFICACIÓN 2: Busca audiencias en 12h
                   ✅ Encuentra audiencia
                   ✅ Envía email #3 a ppisfil@hotmail.com
                   ✅ Envía email #4 a deyabeca22@gmail.com
                   💾 Registra en BD: 2 notificaciones ENVIADAS

15:00           → OCURRE LA AUDIENCIA
```

**Total de emails recibidos:**
- ppisfil@hotmail.com: 2 emails (24h antes + 12h antes)
- deyabeca22@gmail.com: 2 emails (24h antes + 12h antes)

---

## 🎯 Para Cambiar de Nuevo

Si quieres ajustar en el futuro:

### Cambiar horarios de audiencias:
En `backend/app/core/config.py`:
```python
# Para notificar solo 24h antes:
audiencia_notification_hours_list: List[int] = [24]

# Para notificar 24h, 12h y 6h antes:
audiencia_notification_hours_list: List[int] = [24, 12, 6]

# Para notificar 1 día, 1 hora y 30 min antes:
audiencia_notification_hours_list: List[int] = [24, 1]  # Nota: horas, no minutos
```

### Cambiar horas para diligencias:
En `backend/app/core/config.py`:
```python
# Para notificar 1 hora antes:
diligencia_notification_hours: int = 1

# Para notificar 6 horas antes:
diligencia_notification_hours: int = 6

# Para notificar 30 minutos antes (no soportado aún, solo horas):
diligencia_notification_hours: int = 1  # Mínimo 1 hora
```

### Agregar/quitar emails:
En `backend/app/core/config.py`:
```python
notification_emails: List[str] = [
    "ppisfil@hotmail.com",
    "deyabeca22@gmail.com",
    # "otro@email.com"  # Agregar aquí si necesitas más
]
```

Luego reinicia el scheduler:
```bash
# Ctrl+C para parar
python scheduler.py
```

---

## ✅ Resumen Visual

```
┌─────────────────────────────────────────────┐
│       SISTEMA DE NOTIFICACIONES              │
├─────────────────────────────────────────────┤
│                                              │
│  📅 AUDIENCIAS                               │
│     • 24 horas antes   →  2 emails           │
│     • 12 horas antes   →  2 emails           │
│     Total: 4 emails por audiencia            │
│                                              │
│  ⏰ DILIGENCIAS                               │
│     • 2 horas antes    →  2 emails           │
│     Total: 2 emails por diligencia           │
│                                              │
│  📧 DESTINATARIOS                            │
│     • ppisfil@hotmail.com      ✅            │
│     • deyabeca22@gmail.com     ✅            │
│                                              │
│  🌍 TIMEZONE: America/Lima (UTC-5)           │
│  ⚙️  VERIFICACIÓN: Cada 60 minutos           │
│                                              │
└─────────────────────────────────────────────┘
```

---

**Sistema actualizado y listo para usar.** 🚀

Si necesitas cambios futuros en horarios o emails, solo modifica el archivo `backend/app/core/config.py` y reinicia el scheduler.
