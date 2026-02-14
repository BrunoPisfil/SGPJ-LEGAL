# ⚙️ Configuración de GitHub Actions para Notificaciones Automáticas

## 📋 Pasos para configurar

### 1. Agregar Secret en GitHub

Ve a tu repositorio en GitHub y sigue estos pasos:

1. **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Nombre: `BACKEND_URL`
4. Valor: `https://sgpj-legal-backend.vercel.app`
5. Click en **Add secret**

### 2. Verificar el Workflow

1. Ve a **Actions** en tu repositorio
2. Busca el workflow: **"📧 Notificaciones Automáticas - Cron Job"**
3. Deberías ver que está programado para ejecutarse cada hora

### 3. Disparar manualmente (opcional)

Para probar que funciona:
1. Ve a **Actions**
2. Selecciona el workflow **"📧 Notificaciones Automáticas - Cron Job"**
3. Click en **Run workflow** → **Run workflow**

## 📅 Programación

- ⏰ Se ejecuta automáticamente **cada hora** (a las :00 minutos)
- 🌍 En horario UTC (puedes ajustar el cron si necesitas otro horario)
- 📊 Logs disponibles en GitHub Actions

## 🔧 Ajustar la hora

Si quieres cambiar el horario, edita `.github/workflows/notifications-cron.yml`:

Algunos ejemplos de cron:
- `'0 * * * *'` = Cada hora
- `'0 */2 * * *'` = Cada 2 horas
- `'0 9 * * *'` = Diariamente a las 09:00 UTC
- `'*/30 * * * *'` = Cada 30 minutos

## 📧 Emails de notificación

Las notificaciones se enviarán a:
- ppisfil@hotmail.com
- deyabeca22@gmail.com

Configuradas en: `backend/app/core/config.py`

## 🔍 Monitoreo

Los logs del workflow están disponibles en:
- GitHub Actions → "📧 Notificaciones Automáticas - Cron Job" → [Última ejecución]

Verás:
- ✅ Si se enviaron notificaciones
- 📊 Cantidad de audiencias/diligencias notificadas
- ⚠️ Cualquier error que haya ocurrido

## 📌 Notas

- El workflow es **no bloqueante**: Si falla, no afecta el resto del sistema
- Tiene **3 reintentos automáticos** en caso de error temporal
- Timeout de 30 segundos por ejecución
