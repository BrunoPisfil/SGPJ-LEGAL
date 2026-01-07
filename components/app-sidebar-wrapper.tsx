'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { useAuth } from '@/hooks/use-auth'

export function AppSidebarWrapper() {
  const { isLoading } = useAuth()

  // Renderizar siempre para mantener el layout estable
  // El sidebar manejará internamente qué mostrar mientras carga
  return <AppSidebar />
}
