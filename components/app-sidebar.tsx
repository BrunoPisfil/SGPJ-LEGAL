"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Calendar, Users, DollarSign, Bell, Settings, Scale, Gavel, X, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/ui/sidebar"
import { usePermission } from "@/hooks/use-permission"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

const navItemsConfig = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, resource: "dashboard" },
  { title: "Procesos", url: "/procesos", icon: FileText, resource: "procesos" },
  { title: "Audiencias", url: "/audiencias", icon: Calendar, resource: "audiencias" },
  { title: "Resoluciones", url: "/resoluciones", icon: Gavel, resource: "resoluciones" },
  { title: "Directorio", url: "/directorio", icon: Users, resource: "directorio" },
  { title: "Finanzas", url: "/finanzas", icon: DollarSign, resource: "finanzas" },
  { title: "Notificaciones", url: "/notificaciones", icon: Bell, resource: "notificaciones" },
]

const settingsItems = [{ title: "Configuración", url: "/configuracion", icon: Settings }]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { hasPermission } = usePermission()
  const { user } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Filtrar items según permisos
  const visibleNavItems = navItemsConfig.filter(item => 
    hasPermission(item.resource, 'read')
  )

  return (
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
            {visibleNavItems.map((item) => {
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
            })}
          </nav>

          {/* Settings */}
          <nav className="space-y-1 border-t border-border px-3 py-4 sm:p-4">
            {settingsItems.map((item) => {
              const isActive = pathname.startsWith(item.url)
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  onClick={() => setIsMobileOpen(false)}
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
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-border p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-semibold text-primary">{user?.nombre?.substring(0, 2).toUpperCase() || "AD"}</span>
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="text-xs sm:text-sm font-medium truncate">{user?.nombre || "Admin Usuario"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.rol ? `(${user.rol})` : "admin"}</p>
              </div>
            </div>
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
  )
}

