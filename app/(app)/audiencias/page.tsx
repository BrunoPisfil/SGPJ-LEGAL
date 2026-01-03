"use client"

import { useState, useEffect } from "react"
import { Plus, Search, CalendarIcon, MapPin, Video, Bell, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { formatDate } from "@/lib/format"
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { usePermission } from "@/hooks/use-permission"
import { audienciasAPI, type Audiencia } from "@/lib/audiencias"
import { procesosAPI, type Proceso } from "@/lib/procesos"
import { notificacionesAPI, type EnviarNotificacionRequest } from "@/lib/notificaciones"
import { NotificationDialog } from "@/components/notification-dialog"

// Tipo extendido para la vista con datos del proceso
interface AudienciaConProceso extends Audiencia {
  proceso?: Proceso
  expediente?: string
  notificacionEnviada?: boolean
}

export default function AudienciasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [audiencias, setAudiencias] = useState<AudienciaConProceso[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { hasPermission } = usePermission()

  // Cargar audiencias del API
  useEffect(() => {
    loadAudiencias()
  }, [])

  const loadAudiencias = async () => {
    try {
      setLoading(true)
      const response = await audienciasAPI.getAll()
      
      // Enriquecer audiencias con datos del proceso
      const audienciasConProceso: AudienciaConProceso[] = await Promise.all(
        response.audiencias.map(async (audiencia) => {
          try {
            const proceso = await procesosAPI.getById(audiencia.proceso_id)
            return {
              ...audiencia,
              proceso,
              expediente: proceso.expediente,
              notificacionEnviada: false // Por defecto false, esto podría venir del backend
            }
          } catch (error) {
            console.error(`Error loading proceso ${audiencia.proceso_id}:`, error)
            return {
              ...audiencia,
              expediente: `Proceso ${audiencia.proceso_id}`,
              notificacionEnviada: false
            }
          }
        })
      )
      
      setAudiencias(audienciasConProceso)
    } catch (error) {
      console.error('Error loading audiencias:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las audiencias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (request: EnviarNotificacionRequest) => {
    try {
      await notificacionesAPI.enviarNotificacionAudiencia(request)
      
      toast({
        title: "Notificación enviada",
        description: "Se ha enviado la notificación de audiencia exitosamente",
      })

      // Recargar las audiencias para actualizar el estado
      await loadAudiencias()
      
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la notificación",
        variant: "destructive",
      })
    }
  }

  const shouldNotify = (fecha: Date) => {
    const now = new Date()
    const daysUntil = Math.ceil((fecha.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 3 && daysUntil >= 0
  }

  // Filtrar audiencias por búsqueda y fecha
  const filteredAudiencias = audiencias.filter(audiencia => {
    const matchesSearch = !searchQuery || 
      audiencia.tipo.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDate = !selectedDate || 
      audiencia.fecha === selectedDate.toISOString().split('T')[0]
    
    return matchesSearch && matchesDate
  })

  // Separar audiencias por tiempo
  const now = new Date()
  const upcomingAudiencias = filteredAudiencias.filter(audiencia => {
    const audienciaDate = new Date(`${audiencia.fecha}T${audiencia.hora}`)
    return audienciaDate >= now
  })

  const pastAudiencias = filteredAudiencias.filter(audiencia => {
    const audienciaDate = new Date(`${audiencia.fecha}T${audiencia.hora}`)
    return audienciaDate < now
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Audiencias</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestiona todas las audiencias programadas</p>
        </div>
        {hasPermission("audiencias", "create") && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/audiencias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Audiencia
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por expediente o tipo de audiencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm sm:text-base"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-auto justify-start text-left font-normal text-sm sm:text-base",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? formatDate(selectedDate) : "Filtrar por fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              {selectedDate && (
                <div className="p-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)} className="w-full">
                    Limpiar filtro
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      {/* Upcoming Hearings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Próximas Audiencias</h2>
          <Badge variant="secondary">{upcomingAudiencias.length}</Badge>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Cargando audiencias...</div>
            </div>
          </Card>
        ) : upcomingAudiencias.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={CalendarIcon}
              title="No hay audiencias próximas"
              description="No se encontraron audiencias que coincidan con los filtros"
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingAudiencias.map((audiencia) => {
              const audienciaDate = new Date(`${audiencia.fecha}T${audiencia.hora}`)
              const needsNotification = shouldNotify(audienciaDate)
              return (
                <Card key={audiencia.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-xs">
                        {audiencia.tipo}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {audiencia.link ? (
                          <Video className="h-4 w-4 text-blue-500" />
                        ) : (
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-sm">{audiencia.expediente}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(audiencia.fecha)}</span>
                        <span>•</span>
                        <span>{audiencia.hora}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {audiencia.notificacionEnviada ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          3d notificado
                        </Badge>
                      ) : needsNotification ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Sin notificar
                        </Badge>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      {audiencia.sede ? (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">{audiencia.sede}</p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <Video className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-600 dark:text-blue-400">Virtual</p>
                        </div>
                      )}
                    </div>

                    {audiencia.notas && (
                      <p className="text-xs text-muted-foreground border-t pt-2">{audiencia.notas}</p>
                    )}

                    <div className="flex gap-2">
                      {!audiencia.notificacionEnviada && (
                        <NotificationDialog
                          audienciaId={audiencia.id}
                          expediente={audiencia.expediente || `Audiencia ${audiencia.id}`}
                          onSend={handleSendNotification}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Notificar ahora
                          </Button>
                        </NotificationDialog>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("bg-transparent", audiencia.notificacionEnviada ? "flex-1" : "")}
                        asChild
                      >
                        <Link href={`/audiencias/${audiencia.id}`}>Ver Detalles</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Past Hearings */}
      {!loading && pastAudiencias.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Audiencias Pasadas</h2>
            <Badge variant="secondary">{pastAudiencias.length}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastAudiencias.map((audiencia) => (
              <Card key={audiencia.id} className="p-4 opacity-75">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="text-xs">
                      {audiencia.tipo}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Realizada
                    </Badge>
                  </div>

                  <div>
                    <p className="font-semibold text-sm">{audiencia.expediente}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(audiencia.fecha)}</span>
                      <span>•</span>
                      <span>{audiencia.hora}</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href={`/audiencias/${audiencia.id}`}>Ver Detalles</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
