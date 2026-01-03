import { useAuth } from './use-auth'

export function usePermission() {
  const { user } = useAuth()
  
  const userRole = user?.rol?.toLowerCase() || 'practicante'
  
  // Definición de permisos por rol (sincronizada con backend)
  const permissions = {
    admin: {
      procesos: ['read', 'create', 'update', 'delete'],
      audiencias: ['read', 'create', 'update', 'delete'],
      resoluciones: ['read', 'create', 'update', 'delete'],
      directorio: ['read', 'create', 'update', 'delete'],
      notificaciones: ['read'],
      finanzas: ['read', 'create', 'update', 'delete'],
      bitacora: ['read'],
      dashboard: ['read'],
    },
    practicante: {
      procesos: ['read'],
      audiencias: ['read', 'create', 'update'],
      resoluciones: ['read'],
      directorio: ['read', 'create'],
      notificaciones: ['read'],
      finanzas: [],
      bitacora: [],
      dashboard: [],
    },
  } as const

  
  const hasPermission = (resource: string, action: string): boolean => {
    const userPermissions = permissions[userRole as keyof typeof permissions] || {}
    const resourcePermissions = userPermissions[resource as keyof typeof userPermissions] || []
    return resourcePermissions.includes(action)
  }
  
  return { hasPermission, userRole }
}
