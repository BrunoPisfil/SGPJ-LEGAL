# Este archivo re-exporta desde deps.py (fuente canónica de autenticación).
# NO duplicar lógica aquí — cualquier cambio va en deps.py.
from app.api.deps import (
    get_current_user,
    get_current_active_admin,
    get_current_abogado,
    security,
)
from app.core.database import get_db

__all__ = [
    "get_current_user",
    "get_current_active_admin",
    "get_current_abogado",
    "security",
    "get_db",
]
