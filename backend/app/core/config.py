from typing import List
import os
import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración de la aplicación"""

    # Información de la app
    app_name: str = "SGPJ Legal Backend"
    version: str = "1.0.0"
    debug: bool = False

    # Base de datos
    database_url: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:@localhost:3306/sgpj_legal"
    )
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "sgpj_legal"

    # Seguridad — SECRET_KEY debe configurarse como variable de entorno en Vercel.
    # Si no está definida, se genera una clave aleatoria por sesión (solo para dev).
    # NUNCA usar el valor por defecto en producción.
    secret_key: str = os.getenv("SECRET_KEY", secrets.token_hex(32))
    algorithm: str = "HS256"
    # 8 horas — cubre una jornada laboral completa
    access_token_expire_minutes: int = 480

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "https://sgpj-legal.vercel.app",
    ]

    # Configuración de Email (SMTP o Resend)
    email_enabled: bool = True

    # Resend (para producción en Vercel)
    resend_api_key: str = ""

    # SMTP (para desarrollo local)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True

    email_from: str = "onboarding@resend.dev"
    email_from_name: str = "Pisfil Leon Abogados & Asociados"

    # Configuración de SMS (Twilio) - Opcional
    sms_enabled: bool = False
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # Emails por defecto para notificaciones
    default_notification_email: str = ""
    test_email_recipients: str = ""

    # Emails para notificaciones automáticas
    notification_emails: List[str] = [
        "ppisfil@hotmail.com",
        "deyabeca22@gmail.com"
    ]

    # Timezone
    app_timezone: str = "America/Lima"

    # Notificaciones automáticas
    auto_notifications_enabled: bool = True
    audiencia_notification_hours_list: List[int] = [24, 12]
    diligencia_notification_hours: int = 2
    proceso_review_notification_days: int = 7
    notification_check_interval_minutes: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
