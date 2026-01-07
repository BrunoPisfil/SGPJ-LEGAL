'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { useAuth } from '@/hooks/use-auth'

export function AppSidebarWrapper() {
  const { isLoading } = useAuth()

  // No renderizar nada hasta que cargue la autenticación
  // Esto evita el mismatch de hidratación
  if (isLoading) {
    return null
  }

  return <AppSidebar />
}
