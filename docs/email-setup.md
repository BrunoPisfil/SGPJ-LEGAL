# 📧 Configuración de Email - SGPJ Legal

Esta guía te ayudará a configurar el sistema de notificaciones por email en SGPJ Legal.

## 🚀 Configuración Rápida

### 1. Preparar credenciales de Gmail

**Para usar Gmail como servidor SMTP:**

1. **Habilitar verificación en 2 pasos**
   - Ve a [Google Account Security](https://myaccount.google.com/security)
   - Habilita "Verificación en 2 pasos"

2. **Generar App Password**
   - En la misma página, busca "Contraseñas de aplicaciones"
   - Selecciona "Correo" como aplicación
   - Copia la contraseña de 16 caracteres generada

### 2. Configurar el sistema

**Opción A: Configurador automático**
```bash
cd backend
python setup_email.py
```

**Opción B: Manual en archivo `.env`**
```bash
# Abrir backend/.env y completar:
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password-de-16-caracteres
EMAIL_FROM=tu-email@gmail.com
```

### 3. Probar la configuración

```bash
cd backend
python test_email.py
```

## 📋 Variables de Configuración

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EMAIL_ENABLED` | Habilitar/deshabilitar email | `true` |
| `SMTP_SERVER` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USERNAME` | Email para autenticación | `tu-email@gmail.com` |
| `SMTP_PASSWORD` | App Password de Gmail | `abcd efgh ijkl mnop` |
| `SMTP_USE_TLS` | Usar encriptación TLS | `true` |
| `EMAIL_FROM` | Email remitente | `noreply@tu-dominio.com` |
| `EMAIL_FROM_NAME` | Nombre del remitente | `SGPJ Legal` |

## 🔧 Otros Proveedores de Email

### Gmail
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

### Outlook/Hotmail
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

### Yahoo
```env
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

### SendGrid
```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=tu-sendgrid-api-key
SMTP_USE_TLS=true
```

## 🎯 Uso del Sistema

### En la aplicación web:

1. **Ir a Audiencias** → Seleccionar una audiencia
2. **Clic en "Notificar ahora"** → Se abre el diálogo de configuración
3. **Seleccionar canales:**
   - ✅ Sistema (siempre disponible)
   - 📧 Email (requiere configuración)
   - 📱 SMS (requiere Twilio)
4. **Completar datos** del destinatario
5. **Enviar notificación**

### Tipos de notificaciones:
- **Sistema**: Aparece en el apartado de notificaciones
- **Email**: HTML formateado con información de la audiencia
- **SMS**: Mensaje de texto simple (requiere configuración adicional)

## 🔍 Solución de Problemas

### Error: "Autenticación fallida"
- ✅ Verifica que el email sea correcto
- ✅ Usa App Password, no la contraseña normal de Gmail
- ✅ Confirma que la verificación en 2 pasos esté habilitada

### Error: "No se puede conectar al servidor"
- ✅ Verifica la configuración de SMTP_SERVER y SMTP_PORT
- ✅ Confirma que no hay firewall bloqueando la conexión
- ✅ Prueba con diferentes puertos (587, 465, 25)

### Email no llega
- ✅ Revisa la carpeta de spam/correo no deseado
- ✅ Verifica que el email destinatario sea válido
- ✅ Ejecuta `python test_email.py` para probar la configuración

### Error: "SMTP_USERNAME no configurado"
- ✅ Completa todas las variables en el archivo `.env`
- ✅ Reinicia el servidor después de cambiar la configuración

## 🧪 Scripts de Utilidad

### `setup_email.py`
Configurador interactivo para credenciales de email.

### `test_email.py`
Prueba la configuración SMTP y envía un email de prueba.

### Comandos útiles:
```bash
# Verificar configuración actual
python -c "from app.core.config import settings; print(f'Email: {settings.smtp_username}, Enabled: {settings.email_enabled}')"

# Probar conexión SMTP sin enviar email
python test_email.py --connection-only

# Reiniciar servidor con nueva configuración
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

## 🎉 ¡Listo!

Una vez configurado, el sistema podrá enviar:
- ✅ Notificaciones de audiencias programadas
- ✅ Recordatorios automáticos
- ✅ Actualizaciones de procesos
- ✅ Alertas de vencimientos

Las notificaciones aparecerán tanto en el sistema web como en el email del destinatario con formato profesional.