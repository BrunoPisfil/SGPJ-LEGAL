"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Edit, Clock, AlertCircle, CheckCircle, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { resolucionesAPI, type Resolucion } from "@/lib/resoluciones"
import { procesosAPI, type Proceso } from "@/lib/procesos"
import { formatDate } from "@/lib/format"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function ResolucionDetailPage() {
  const params = useParams()
  const [resolucion, setResolucion] = useState<Resolucion | null>(null)
  const [proceso, setProceso] = useState<Proceso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResolucion()
  }, [params.id])

  const loadResolucion = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📡 Cargando resolución con ID:', params.id)
      const data = await resolucionesAPI.getById(parseInt(params.id as string))
      console.log('✅ Resolución cargada:', data)
      setResolucion(data)

      // Cargar el proceso relacionado si existe
      if (data.proceso_id) {
        try {
          const procesoData = await procesosAPI.getById(data.proceso_id)
          setProceso(procesoData)
        } catch (err) {
          console.warn('Advertencia: No se pudo cargar el proceso relacionado')
        }
      }
    } catch (err: any) {
      console.error('❌ Error cargando resolución:', err)
      setError(err.message || 'No se pudo cargar la resolución')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Cargando resolución...</h2>
        </div>
      </div>
    )
  }

  if (error || !resolucion) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Resolución no encontrada</h2>
          <p className="text-muted-foreground mt-2">{error || 'La resolución no existe o no se pudo cargar'}</p>
          <Button className="mt-4" asChild>
            <Link href="/resoluciones">Volver a Resoluciones</Link>
          </Button>
        </div>
      </div>
    )
  }

  const now = new Date()
  const fechaLimite = new Date(resolucion.fecha_limite)
  const daysUntil = Math.ceil((fechaLimite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  let alertLevel: "green" | "orange" | "red" = "green"
  if (daysUntil <= 0 || daysUntil <= 3) alertLevel = "red"
  else if (daysUntil <= 7) alertLevel = "orange"

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      improcedente: "Improcedente",
      infundada: "Infundada",
      fundada_en_parte: "Fundada en Parte",
      rechazo_medios_probatorios: "Rechazo de Medios Probatorios",
      no_ha_lugar: "No Ha Lugar",
    }
    return labels[tipo] || tipo
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/resoluciones">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalle de Resolución</h1>
            <p className="text-muted-foreground mt-1">ID: {resolucion.id}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/resoluciones/${resolucion.id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Alert Banner */}
      {alertLevel !== "green" && (
        <Card
          className={
            alertLevel === "red"
              ? "p-4 bg-destructive/10 border-destructive/20"
              : "p-4 bg-amber-500/10 border-amber-500/20"
          }
        >
          <div className="flex items-center gap-3">
            <AlertCircle className={alertLevel === "red" ? "h-5 w-5 text-destructive" : "h-5 w-5 text-amber-600"} />
            <div>
              <p className="font-semibold">
                {daysUntil <= 0 ? "Plazo vencido" : `Quedan ${daysUntil} día${daysUntil > 1 ? "s" : ""} para el plazo`}
              </p>
              <p className="text-sm text-muted-foreground">
                Fecha límite: {formatDate(new Date(resolucion.fecha_limite))}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Información de la Resolución</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Resolución</p>
              <p className="font-medium mt-1">{getTipoLabel(resolucion.tipo)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Notificación</p>
              <p className="font-medium mt-1">{formatDate(new Date(resolucion.fecha_notificacion))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acción Requerida</p>
              <p className="font-medium mt-1 capitalize">{resolucion.accion_requerida || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha Límite</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium">{formatDate(new Date(resolucion.fecha_limite))}</p>
                <Badge
                  variant={alertLevel === "red" ? "destructive" : "secondary"}
                  className={
                    alertLevel === "orange"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                      : alertLevel === "green"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : ""
                  }
                >
                  {daysUntil <= 0 ? "Vencido" : `${daysUntil} días`}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Responsable</p>
              <p className="font-medium mt-1">{resolucion.responsable}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="mt-1">
                <Badge variant="secondary">
                  {resolucion.estado || 'Pendiente'}
                </Badge>
              </div>
            </div>
          </div>

          {resolucion.notas && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Notas</p>
              <p className="text-sm">{resolucion.notas}</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Proceso Relacionado</h2>
          {proceso ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Expediente</p>
                <p className="font-medium mt-1 text-sm">{proceso.expediente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Materia</p>
                <p className="font-medium mt-1">{proceso.materia}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Demandante</p>
                <p className="font-medium mt-1">{proceso.demandante}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Demandado</p>
                <p className="font-medium mt-1">{proceso.demandado}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                <Link href={`/procesos/${proceso.id}`}>Ver Proceso Completo</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No se encontró el proceso relacionado</p>
          )}
        </Card>
      </div>
    </div>
  )
}
