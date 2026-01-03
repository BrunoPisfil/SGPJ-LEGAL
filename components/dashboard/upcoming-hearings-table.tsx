"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink, MapPin, Video, Loader } from "lucide-react"
import { formatDate, formatTime } from "@/lib/format"
import { useState, useEffect } from "react"
import { audienciasAPI, type Audiencia } from "@/lib/audiencias"

export function UpcomingHearingsTable() {
  const [upcomingHearings, setUpcomingHearings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcomingHearings()
  }, [])

  const loadUpcomingHearings = async () => {
    try {
      setLoading(true)
      const response = await audienciasAPI.getAll({ skip: 0, limit: 500 })
      const allAudiencias = Array.isArray(response) ? response : (response.audiencias || [])
      
      // Filtrar audiencias de los próximos 30 días
      const now = new Date()
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const upcoming = allAudiencias
        .filter((a) => {
          const fecha = new Date(a.fecha)
          return fecha > now && fecha < nextMonth
        })
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .slice(0, 10) // Mostrar solo las 10 próximas

      setUpcomingHearings(upcoming)
    } catch (error) {
      console.error("Error cargando audiencias:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Próximas Audiencias</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/audiencias">
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
                <TableHead>Expediente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Ubicación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingHearings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay audiencias programadas
                  </TableCell>
                </TableRow>
              ) : (
                upcomingHearings.map((audiencia) => (
                  <TableRow key={audiencia.id}>
                    <TableCell className="font-medium">{audiencia.expediente || `Proceso #${audiencia.proceso_id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {audiencia.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(audiencia.fecha)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{audiencia.hora || "N/A"}</TableCell>
                    <TableCell>
                      {audiencia.sede ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{audiencia.sede}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600 dark:text-blue-400">Virtual</span>
                        </div>
                      )}
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
