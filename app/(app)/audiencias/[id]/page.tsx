"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, MapPin, Video, CalendarIcon, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { audienciasAPI, Audiencia } from "@/lib/audiencias"
import { procesosAPI } from "@/lib/procesos"
import { formatDate, formatTime } from "@/lib/format"
import Link from "next/link"

export default function AudienciaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [audiencia, setAudiencia] = useState<Audiencia | null>(null)
  const [proceso, setProceso] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (params.id && typeof params.id === 'string') {
          const audienciaId = parseInt(params.id)
          if (isNaN(audienciaId)) {
            throw new Error('ID de audiencia inválido')
          }
          
          console.log('🔍 Cargando audiencia ID:', audienciaId)
          const audienciaData = await audienciasAPI.getById(audienciaId)
          console.log('✅ Audiencia cargada:', audienciaData)
          setAudiencia(audienciaData)

          // Cargar información del proceso
          try {
            const procesoData = await procesosAPI.getById(audienciaData.proceso_id)
            setProceso(procesoData)
          } catch (procesoErr) {
            console.warn('No se pudo cargar el proceso:', procesoErr)
          }
        }
      } catch (err) {
        console.error('❌ Error fetching audiencia:', err)
        setError('Error al cargar la audiencia')
        toast({
          title: "Error",
          description: "No se pudo cargar la audiencia",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando audiencia...</p>
        </div>
      </div>
    )
  }

  if (error || !audiencia) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Audiencia no encontrada</h1>
          </div>
        </div>
        
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>La audiencia solicitada no existe o no se pudo cargar.</p>
            <Button className="mt-4" onClick={() => router.push('/audiencias')}>
              Volver a Audiencias
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!audiencia) return

    try {
      await audienciasAPI.delete(audiencia.id)
      toast({
        title: "Éxito",
        description: "Audiencia eliminada correctamente",
      })
      router.push('/audiencias')
    } catch (error) {
      console.error('Error deleting audiencia:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la audiencia",
        variant: "destructive",
      })
    }
    setShowDeleteDialog(false)
  }

  const isPast = new Date(audiencia.fecha) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/audiencias">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{audiencia.tipo}</h1>
              {isPast && (
                <Badge variant="secondary" className="text-xs">
                  Realizada
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {proceso ? `Expediente: ${proceso.expediente}` : `Proceso ID: ${audiencia.proceso_id}`}
            </p>
          </div>
        </div>
        {!isPast && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/audiencias/${audiencia.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {/* Audiencia Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Audiencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium mt-1">{formatDate(audiencia.fecha)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium mt-1">{formatTime(audiencia.hora)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  {audiencia.sede ? (
                    <MapPin className="h-5 w-5 text-primary" />
                  ) : (
                    <Video className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modalidad</p>
                  <p className="font-medium mt-1">{audiencia.sede ? "Presencial" : "Virtual"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium mt-1">{audiencia.tipo}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Ubicación / Enlace</p>
                {audiencia.sede ? (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{audiencia.sede}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Video className="h-4 w-4 text-blue-500" />
                    <a
                      href={audiencia.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {audiencia.link}
                    </a>
                  </div>
                )}
              </div>

              {audiencia.notas && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="font-medium mt-1">{audiencia.notas}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proceso Info */}
        {proceso && (
          <Card>
            <CardHeader>
              <CardTitle>Proceso Asociado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Expediente</p>
                <p className="font-medium mt-1">{proceso.expediente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Materia</p>
                <p className="font-medium mt-1">{proceso.materia}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Demandante(s)</p>
                <p className="font-medium mt-1">{proceso.demandantes_nombres || 'Sin demandantes'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Demandado(s)</p>
                <p className="font-medium mt-1">{proceso.demandados_nombres || 'Sin demandados'}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                <Link href={`/procesos/${proceso.id}`}>Ver Proceso Completo</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar audiencia?"
        description="Esta acción no se puede deshacer. La audiencia será eliminada permanentemente."
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  )
}
