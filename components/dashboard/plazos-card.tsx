"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, Loader } from "lucide-react"
import { formatDate } from "@/lib/format"
import Link from "next/link"
import { useState, useEffect } from "react"
import { resolucionesAPI } from "@/lib/resoluciones"

export function PlazosCard() {
  const [resolucionesConPlazos, setResolucionesConPlazos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlazos()
  }, [])

  const loadPlazos = async () => {
    try {
      setLoading(true)
      const resoluciones = (await resolucionesAPI.getAll(0, 500)) || []

      // Filtrar resoluciones con plazos por vencer (próximos 14 días)
      const now = new Date()
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      const conPlazos = resoluciones
        .filter((r) => {
          const fechaLimite = new Date(r.fecha_limite)
          return fechaLimite > now && fechaLimite < twoWeeks && r.estado_accion !== "completada"
        })
        .sort((a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime())
        .slice(0, 5)

      setResolucionesConPlazos(conPlazos)
    } catch (error) {
      console.error("Error cargando plazos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = (fechaLimite: string) => {
    const now = new Date()
    const fecha = new Date(fechaLimite)
    const daysRemaining = Math.ceil((fecha.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Plazos por Vencer</h3>
        </div>
        <Badge variant="secondary">{resolucionesConPlazos.length}</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : resolucionesConPlazos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No hay plazos pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resolucionesConPlazos.map((resolucion) => {
            const daysRemaining = getDaysRemaining(resolucion.fecha_limite)
            const isUrgent = daysRemaining <= 3

            return (
              <div
                key={resolucion.id}
                className={`flex items-center gap-3 p-3 rounded border ${
                  isUrgent
                    ? "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800"
                    : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800"
                }`}
              >
                <AlertCircle
                  className={`h-4 w-4 flex-shrink-0 ${
                    isUrgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isUrgent ? "text-red-900 dark:text-red-100" : "text-amber-900 dark:text-amber-100"}`}>
                    {resolucion.accion_requerida} - Resolución #{resolucion.id}
                  </p>
                  <p className={`text-xs ${isUrgent ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}>
                    Vence: {formatDate(resolucion.fecha_limite)}
                  </p>
                </div>
                <Badge variant={isUrgent ? "destructive" : "secondary"} className="flex-shrink-0">
                  {daysRemaining}d
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
