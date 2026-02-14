"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink, Loader, Briefcase } from "lucide-react"
import { formatDate, formatTime } from "@/lib/format"
import { useState, useEffect } from "react"
import { diligenciasAPI } from "@/lib/diligencias"

export function UpcomingDiligenciasTable() {
  const [upcomingDiligencias, setUpcomingDiligencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcomingDiligencias()
  }, [])

  const loadUpcomingDiligencias = async () => {
    try {
      setLoading(true)
      const allDiligencias = await diligenciasAPI.obtenerTodas(0, 500)
      
      // Filtrar diligencias de los próximos 30 días
      const now = new Date()
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const upcoming = allDiligencias
        .filter((d) => {
          const fecha = new Date(d.fecha)
          return fecha > now && fecha < nextMonth
        })
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .slice(0, 10) // Mostrar solo las 10 próximas

      setUpcomingDiligencias(upcoming)
    } catch (error) {
      console.error("Error cargando diligencias:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estado_lower = estado?.toLowerCase() || ""
    if (estado_lower === "pendiente") {
      return <Badge variant="destructive">Pendiente</Badge>
    } else if (estado_lower === "en_progreso") {
      return <Badge variant="secondary">En progreso</Badge>
    } else if (estado_lower === "completada") {
      return <Badge variant="default" className="bg-green-600">Completada</Badge>
    } else if (estado_lower === "cancelada") {
      return <Badge variant="outline">Cancelada</Badge>
    }
    return <Badge variant="outline">{estado}</Badge>
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Próximas Diligencias</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/diligencias">
            Ver todas
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingDiligencias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay diligencias programadas
                  </TableCell>
                </TableRow>
              ) : (
                upcomingDiligencias.map((diligencia) => (
                  <TableRow key={diligencia.id}>
                    <TableCell className="font-medium flex items-center gap-2 max-w-xs">
                      <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{diligencia.titulo || "Sin título"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(diligencia.fecha)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{diligencia.hora || "N/A"}</TableCell>
                    <TableCell>
                      {getEstadoBadge(diligencia.estado)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
