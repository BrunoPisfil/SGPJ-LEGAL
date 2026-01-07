"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, Calendar, Users, DollarSign, Bell, Settings, Scale, Gavel, X, Menu, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/ui/sidebar"
import { usePermission } from "@/hooks/use-permission"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

const navItemsConfig = [
  { title: "Panel", url: "/dashboard", icon: LayoutDashboard, resource: "dashboard" },
  { title: "Procesos", url: "/procesos", icon: FileText, resource: "procesos" },
  { title: "Audiencias", url: "/audiencias", icon: Calendar, resource: "audiencias" },
  { title: "Resoluciones", url: "/resoluciones", icon: Gavel, resource: "resoluciones" },
  { title: "Directorio", url: "/directorio", icon: Users, resource: "directorio" },
  { title: "Finanzas", url: "/finanzas", icon: DollarSign, resource: "finanzas" },
  { title: "Notificaciones", url: "/notificaciones", icon: Bell, resource: "notificaciones" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasPermission, isLoading } = usePermission()
  const { user, isLoading: authLoading, logout } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Solo mostrar el spinner después de 100ms de loading (para evitar parpadeos)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isLoading || authLoading) {
      const timer = setTimeout(() => {
        setShowLoadingSpinner(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setShowLoadingSpinner(false)
    }
  }, [isLoading, authLoading])

  // Filtrar items según permisos (solo si está cargado)
  const visibleNavItems = !isLoading && !authLoading ? navItemsConfig.filter(item => 
    hasPermission(item.resource, 'read')
  ) : []

  // No mostrar datos del usuario hasta que estén cargados
  const userLoaded = !authLoading && user !== null

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Obtener nombre del rol en formato bonito
  const getRolDisplay = (rol: string | undefined) => {
    if (!rol) return ""
    const rolMap: Record<string, string> = {
      'admin': 'Administrador',
      'abogado': 'Abogado',
      'asistente': 'Asistente',
      'cliente': 'Cliente',
      'practicante': 'Practicante'
    }
    return rolMap[rol.toLowerCase()] || rol
  }

  return (
    <>
      {/* No renderizar en servidor para evitar mismatch de hidratación */}
      {!isMounted ? null : (
        <>
      {/* Mobile Menu Button - Solo en móvil */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="h-10 w-10"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar - Fixed en desktop, Modal en mobile */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-80 border-r border-border bg-card transition-transform duration-300 ease-in-out",
          // En móvil: se desliza desde la izquierda
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
            <div className="flex items-center justify-center">
              <img 
                src="/torre.png" 
                alt="SGPJ Logo" 
                className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Scale className="h-8 w-8 sm:h-10 sm:w-10 text-primary hidden" />
            </div>
            <div className="text-center">
              <h1 className="text-base sm:text-xl font-bold leading-tight text-foreground">Pisfil Leon Abogados & Asociados</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Sistema Legal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:p-4">
            {showLoadingSpinner ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                  <p className="text-xs text-muted-foreground">Cargando...</p>
                </div>
              </div>
            ) : (
              visibleNavItems.map((item) => {
                const isActive = pathname.startsWith(item.url)
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    onClick={() => setIsMobileOpen(false)} // Cerrar sidebar al seleccionar
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 sm:py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="hidden sm:inline">{item.title}</span>
                  </Link>
                )
              })
            )}
          </nav>

          {/* User info - Profile menu */}
          <div className="border-t border-border p-2 sm:p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 hover:bg-accent transition-colors cursor-pointer">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {userLoaded ? (
                      <span className="text-xs sm:text-sm font-semibold text-primary">{user?.nombre?.substring(0, 2).toUpperCase()}</span>
                    ) : (
                      <div className="h-4 w-4 bg-primary/30 rounded animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 hidden sm:block text-left">
                    {userLoaded ? (
                      <>
                        <p className="text-xs sm:text-sm font-medium truncate">{user?.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{getRolDisplay(user?.rol)}</p>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-2 w-16 bg-muted rounded animate-pulse mt-1" />
                      </>
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  {userLoaded ? (
                    <>
                      <p className="font-semibold">{user?.nombre}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-2 w-32 bg-muted rounded animate-pulse mt-1" />
                    </>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/configuracion" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Backdrop - Solo en móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
        </>
      )}
    </>
  )
}

