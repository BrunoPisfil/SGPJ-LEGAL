import { useAuth } from './use-auth'

export function usePermission() {
  const { user, isLoading } = useAuth()
  
  const userRole = user?.rol?.toLowerCase() || null
  
  // Definición de permisos por rol (sincronizada con backend)
  const permissions = {
    admin: {
      procesos: ['read', 'create', 'update', 'delete'],
      audiencias: ['read', 'create', 'update', 'delete'],
      diligencias: ['read', 'create', 'update', 'delete'],
      resoluciones: ['read', 'create', 'update', 'delete'],
      directorio: ['read', 'create', 'update', 'delete'],
      notificaciones: ['read'],
      finanzas: ['read', 'create', 'update', 'delete'],
      bitacora: ['read'],
      dashboard: ['read'],
    },
    practicante: {
      procesos: ['read', 'create', 'update'],
      audiencias: ['read', 'create', 'update'],
      diligencias: ['read', 'create', 'update'],
      resoluciones: ['read', 'create', 'update'],
      directorio: ['read', 'create', 'update'],
      notificaciones: ['read'],
      finanzas: [],
      bitacora: ['read'],
      dashboard: ['read'],
    },
  } as const

  
  const hasPermission = (resource: string, action: string): boolean => {
    if (!userRole) return false
    const userPermissions = permissions[userRole as keyof typeof permissions] || {}
    const resourcePermissions = userPermissions[resource as keyof typeof userPermissions] || []
    return resourcePermissions.includes(action)
  }
  
  return { hasPermission, userRole, isLoading }
}
