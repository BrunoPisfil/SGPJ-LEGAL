"""
Utilidades para manejo de timezones en la aplicación
Toda la aplicación usa America/Lima (UTC-5) como timezone
"""

from datetime import datetime, date, time as datetime_time
import pytz
from app.core.config import settings

# Obtener el timezone configurado
TIMEZONE = pytz.timezone(settings.app_timezone)


def get_current_time_peru() -> datetime:
    """Obtener hora actual en timezone de Perú"""
    return datetime.now(TIMEZONE)


def get_current_date_peru() -> date:
    """Obtener fecha actual en timezone de Perú"""
    return get_current_time_peru().date()


def naive_to_peru_tz(dt: datetime) -> datetime:
    """Convertir datetime naive a timezone de Perú"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Asumir que es UTC si no tiene timezone
        dt_utc = pytz.utc.localize(dt)
        return dt_utc.astimezone(TIMEZONE)
    return dt.astimezone(TIMEZONE)


def combine_date_time_peru(fecha: date, hora: datetime_time) -> datetime:
    """Combinar fecha y hora, asumiendo timezone de Perú"""
    naive_dt = datetime.combine(fecha, hora)
    # Localizar como si fuera hora de Perú
    dt_localized = TIMEZONE.localize(naive_dt)
    return dt_localized


def format_fecha_hora(fecha: date, hora: datetime_time = None) -> str:
    """Formatear fecha y hora de forma legible"""
    fecha_str = fecha.strftime('%d/%m/%Y') if isinstance(fecha, date) else str(fecha)
    if hora:
        hora_str = hora.strftime('%H:%M') if isinstance(hora, datetime_time) else str(hora)
        return f"{hora_str} del {fecha_str}"
    return fecha_str
