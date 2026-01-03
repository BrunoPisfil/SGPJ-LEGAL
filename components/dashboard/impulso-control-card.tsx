"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, FileText, Loader } from "lucide-react"
import { daysBetween, formatDate } from "@/lib/format"
import Link from "next/link"
import { useState, useEffect } from "react"
import { procesosAPI } from "@/lib/procesos"
import { audienciasAPI } from "@/lib/audiencias"

export function ImpulsoControlCard() {
  const [processesNeedingReview, setProcessesNeedingReview] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProcessesNeedingImpulso()
  }, [])

  const loadProcessesNeedingImpulso = async () => {
    try {
      setLoading(true)
      const procesos = await procesosAPI.getAll({ skip: 0, limit: 500 })
      const response = await audienciasAPI.getAll({ skip: 0, limit: 500 })
      const audiencias = Array.isArray(response) ? response : (response.audiencias || [])

      // Debug: log all processes to see their states
      console.log("🔍 All processes:", procesos.map((p: any) => ({
        id: p.id,
        expediente: p.expediente,
        estado_juridico: p.estado_juridico,
        estado: p.estado
      })))

      // Procesos que requieren impulso son aquellos con estado_juridico="pendiente_impulsar"
      // No necesitan cumplir condiciones adicionales de audiencias
      const needingReview = procesos
        .filter((p) => {
          const estadoJuridico = p.estado_juridico?.toLowerCase()
          return estadoJuridico === "pendiente_impulsar"
        })
        .slice(0, 5)

      console.log("✅ Processes needing review:", needingReview.map((p: any) => ({ id: p.id, expediente: p.expediente })))
      setProcessesNeedingReview(needingReview)
    } catch (error) {
      console.error("Error cargando procesos:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Control de Impulso</h3>
        </div>
        <Badge variant="secondary">{processesNeedingReview.length}</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : processesNeedingReview.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Todos los procesos están al día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processesNeedingReview.map((proceso) => (
            <div key={proceso.id} className="flex items-center gap-3 p-3 rounded border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 truncate">{proceso.expediente}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">{proceso.demandante} vs {proceso.demandado}</p>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0" asChild>
                <Link href={`/procesos/${proceso.id}`}>Ver</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
