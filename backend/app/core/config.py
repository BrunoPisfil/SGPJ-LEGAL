from typing import List
import os
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
    
    # Seguridad
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        # Frontend en Vercel (PRODUCCIÓN)
        "https://sgpj-legal.vercel.app",       # 👈 si ese es tu front
    ]
    
    # Configuración de Email (SMTP)
    email_enabled: bool = True
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    email_from: str = "noreply@sgpj-legal.com"
    email_from_name: str = "Pisfil Leon Abogados & Asociados"
    
    # Configuración de SMS (Twilio) - Opcional
    sms_enabled: bool = False
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    
    # Emails por defecto para notificaciones
    default_notification_email: str = ""
    test_email_recipients: str = ""
    
    # Configuración de notificaciones automáticas
    auto_notifications_enabled: bool = True
    audiencia_notification_hours: int = 24
    proceso_review_notification_days: int = 7
    notification_check_interval_minutes: int = 60
    
    class Config:
        env_file = ".env"


settings = Settings()