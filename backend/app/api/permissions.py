"""
Sistema de control de permisos basado en roles.
Define qué acciones puede realizar cada rol.
"""

from fastapi import Depends, HTTPException, status
from backend.app.models.usuario import Usuario
from backend.app.api.deps import get_current_user

# Definición de permisos por rol
ROLE_PERMISSIONS = {
    "admin": {
        "procesos": ["read", "create", "update", "delete"],
        "audiencias": ["read", "create", "update", "delete"],
        "resoluciones": ["read", "create", "update", "delete"],
        "directorio": ["read", "create", "update", "delete"],
        "notificaciones": ["read"],
        "finanzas": ["read", "create", "update", "delete"],
        "bitacora": ["read"],
        "dashboard": ["read"],
    },
    "practicante": {
        "procesos": ["read"],
        "audiencias": ["read", "create", "update"],  # NO delete
        "resoluciones": ["read"],  # SOLO lectura
        "directorio": ["read", "create"],  # NO delete
        "notificaciones": ["read"],
        "finanzas": [],  # SIN acceso
        "bitacora": [],  # SIN acceso
        "dashboard": [],  # SIN acceso
    }
}


def require_permission(resource: str, action: str):
    """
    Decorador para verificar que el usuario tenga permiso para realizar una acción.
    
    Args:
        resource: El recurso (ej: 'procesos', 'audiencias')
        action: La acción (ej: 'read', 'create', 'update', 'delete')
    
    Ejemplo:
        @router.delete("/{id}")
        async def delete_proceso(
            id: int,
            current_user: Usuario = Depends(require_permission("procesos", "delete"))
        ):
            ...
    """
    async def permission_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        user_role = current_user.rol.lower() if current_user.rol else "practicante"
        
        # Obtener permisos del rol
        permissions = ROLE_PERMISSIONS.get(user_role, {})
        resource_permissions = permissions.get(resource, [])
        
        # Verificar si tiene el permiso
        if action not in resource_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tienes permiso para {action} {resource}"
            )
        
        return current_user
    
    return permission_checker


def has_permission(current_user: Usuario, resource: str, action: str) -> bool:
    """
    Función utilitaria para verificar permisos en lógica condicional.
    Útil para casos donde quieres verificar pero no quieres lanzar excepción.
    """
    user_role = current_user.rol.lower() if current_user.rol else "practicante"
    permissions = ROLE_PERMISSIONS.get(user_role, {})
    resource_permissions = permissions.get(resource, [])
    return action in resource_permissions


def check_permission(current_user: Usuario, resource: str, action: str):
    """
    Función para lanzar excepción si no tiene permiso.
    Útil dentro de handlers cuando necesitas validar condicionalmente.
    """
    if not has_permission(current_user, resource, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes permiso para {action} {resource}"
        )
