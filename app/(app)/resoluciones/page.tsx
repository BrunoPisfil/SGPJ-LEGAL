"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Gavel, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { formatDate } from "@/lib/format"
import { resolucionesAPI, type Resolucion } from "@/lib/resoluciones"
import { usePermission } from "@/hooks/use-permission"
import Link from "next/link"

export default function ResolucionesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { hasPermission } = usePermission()

  useEffect(() => {
    loadResoluciones()
  }, [])

  const loadResoluciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await resolucionesAPI.getAll()
      setResoluciones(data)
    } catch (error) {
      console.error('Error loading resoluciones:', error)
      setError('No se pudieron cargar las resoluciones')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar resoluciones basado en la búsqueda
  const filteredResoluciones = resoluciones.filter((resolucion) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      resolucion.expediente?.toLowerCase().includes(query) ||
      resolucion.tipo.toLowerCase().includes(query) ||
      resolucion.responsable.toLowerCase().includes(query)
    )
  })

  const getAlertLevel = (fechaLimite: string) => {
    const now = new Date()
    const fecha = new Date(fechaLimite)
    const daysUntil = Math.ceil((fecha.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 0) return { level: "red", text: "Vencido", days: daysUntil }
    if (daysUntil <= 3) return { level: "red", text: `${daysUntil} días`, days: daysUntil }
    if (daysUntil <= 7) return { level: "orange", text: `${daysUntil} días`, days: daysUntil }
    return { level: "green", text: `${daysUntil} días`, days: daysUntil }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      improcedente: "Improcedente",
      infundada: "Infundada",
      fundada_en_parte: "Fundada en Parte",
      rechazo_medios_probatorios: "Rechazo Medios Probatorios",
      no_ha_lugar: "No Ha Lugar",
    }
    return labels[tipo] || tipo
  }

  const getEstadoAccionBadge = (estado: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className?: string }> = {
      pendiente: {
        variant: "secondary",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      },
      en_tramite: {
        variant: "default",
        className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      },
      completada: {
        variant: "default",
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      },
    }
    const config = variants[estado] || variants.pendiente
    return (
      <Badge variant={config.variant} className={config.className}>
        {estado.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resoluciones y Plazos</h1>
          <p className="text-muted-foreground mt-1">Gestiona resoluciones y acciones requeridas</p>
        </div>
        {hasPermission("resoluciones", "create") && (
          <Button asChild>
            <Link href="/resoluciones/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Resolución
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por expediente o tipo de resolución..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Card className="p-8">
          <div className="text-center">Cargando resoluciones...</div>
        </Card>
      ) : error ? (
        <Card className="p-8">
          <div className="text-center text-red-500">{error}</div>
        </Card>
      ) : filteredResoluciones.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={Gavel}
            title="No se encontraron resoluciones"
            description={resoluciones.length === 0 
              ? "No hay resoluciones registradas en el sistema"
              : "No se encontraron resoluciones que coincidan con la búsqueda"
            }
            action={{
              label: "Crear nueva resolución",
              onClick: () => (window.location.href = "/resoluciones/nueva"),
            }}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Tipo de Resolución</TableHead>
                  <TableHead>Acción Requerida</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResoluciones.map((resolucion) => {
                  const alert = getAlertLevel(resolucion.fecha_limite)
                  return (
                    <TableRow key={resolucion.id}>
                      <TableCell className="font-medium">{resolucion.expediente || `Proceso #${resolucion.proceso_id}`}</TableCell>
                      <TableCell>{getTipoLabel(resolucion.tipo)}</TableCell>
                      <TableCell className="capitalize">{resolucion.accion_requerida.replace('_', ' ')}</TableCell>
                      <TableCell>{formatDate(new Date(resolucion.fecha_limite))}</TableCell>
                      <TableCell>
                        <Badge
                          variant={alert.level === "red" ? "destructive" : "secondary"}
                          className={
                            alert.level === "orange"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : alert.level === "green"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : ""
                          }
                        >
                          {alert.level === "red" && alert.days <= 0 ? (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {alert.text}
                        </Badge>
                      </TableCell>
                      <TableCell>{resolucion.responsable}</TableCell>
                      <TableCell>{getEstadoAccionBadge(resolucion.estado_accion)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/resoluciones/${resolucion.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
