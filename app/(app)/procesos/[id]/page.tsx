"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Calendar, History, Plus, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProcessStatusBadge } from "@/components/process-status-badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { usePermission } from "@/hooks/use-permission"
import { procesosAPI, Proceso } from "@/lib/procesos"
import { bitacoraAPI, BitacoraEntry } from "@/lib/bitacora"
import { audienciasAPI, Audiencia } from "@/lib/audiencias"
import { formatDate, formatDateTime } from "@/lib/format"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ProcesoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { hasPermission } = usePermission()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [proceso, setProceso] = useState<Proceso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([])
  const [audiencias, setAudiencias] = useState<Audiencia[]>([])
  const [loadingBitacora, setLoadingBitacora] = useState(false)
  const [loadingAudiencias, setLoadingAudiencias] = useState(false)

  useEffect(() => {
    async function fetchProceso() {
      try {
        setLoading(true)
        const data = await procesosAPI.getById(Number(params.id))
        setProceso(data)
        
        // Cargar bitácora
        await loadBitacora(Number(params.id))
        
        // Cargar audiencias
        await loadAudiencias(Number(params.id))
        
      } catch (err) {
        console.error('Error fetching process:', err)
        setError('Error al cargar el proceso')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProceso()
    }
  }, [params.id])

  const loadBitacora = async (procesoId: number) => {
    try {
      console.log('🔄 Cargando bitácora para proceso:', procesoId)
      setLoadingBitacora(true)
      const data = await bitacoraAPI.getByProceso(procesoId)
      console.log('✅ Bitácora cargada:', data)
      console.log('📊 Número de entradas:', data?.length || 0)
      setBitacora(data)
    } catch (err) {
      console.error('❌ Error loading bitácora:', err)
      console.error('❌ Error details:', err)
    } finally {
      setLoadingBitacora(false)
    }
  }

  const loadAudiencias = async (procesoId: number) => {
    try {
      setLoadingAudiencias(true)
      const data = await audienciasAPI.getByProceso(procesoId)
      setAudiencias(data)
    } catch (err) {
      console.error('Error loading audiencias:', err)
    } finally {
      setLoadingAudiencias(false)
    }
  }

  const handleNuevaAudiencia = () => {
    router.push(`/audiencias/nueva?proceso=${params.id}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Cargando proceso...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Error: {error}</h2>
          <Button className="mt-4" asChild>
            <Link href="/procesos">Volver a Procesos</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!proceso) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Proceso no encontrado</h2>
          <Button className="mt-4" asChild>
            <Link href="/procesos">Volver a Procesos</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      await procesosAPI.delete(Number(params.id))
      toast({
        title: "Proceso eliminado",
        description: "El proceso ha sido eliminado exitosamente",
      })
      router.push("/procesos")
    } catch (err) {
      console.error('Error deleting process:', err)
      toast({
        title: "Error",
        description: "No se pudo eliminar el proceso",
        variant: "destructive",
      })
    }
  }

  const handleMarkReviewed = async (procesoId: number, expediente: string) => {
    try {
      await procesosAPI.markAsReviewed(procesoId)
      
      // Actualizar el proceso en el estado local
      setProceso(prev => prev ? { ...prev, fecha_ultima_revision: new Date().toISOString().split('T')[0] } : null)
      
      toast({
        title: "Proceso marcado como revisado",
        description: `El expediente ${expediente} ha sido actualizado con la fecha de hoy.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar el proceso como revisado",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/procesos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{proceso.expediente}</h1>
            <p className="text-muted-foreground mt-1">{proceso.materia}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission("procesos", "update") && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/procesos/${proceso.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleMarkReviewed(proceso.id, proceso.expediente)}
                title="Marcar como revisado"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Revisar
              </Button>
            </>
          )}
          {hasPermission("procesos", "delete") && (
            <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Process Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Proceso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Expediente</p>
              <p className="font-medium mt-1">{proceso.expediente}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Materia</p>
              <p className="font-medium mt-1">{proceso.materia}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estados</p>
              <div className="mt-2 space-y-2">
                {proceso.estado_juridico && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Estado Jurídico</p>
                    <ProcessStatusBadge juridicalStatus={proceso.estado_juridico} />
                  </div>
                )}
                {proceso.estado && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Estado General</p>
                    <ProcessStatusBadge status={proceso.estado} />
                  </div>
                )}
                {!proceso.estado && !proceso.estado_juridico && (
                  <p className="text-sm text-muted-foreground">Sin estado asignado</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Demandante</p>
              <p className="font-medium mt-1">{proceso.demandante}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Demandado</p>
              <p className="font-medium mt-1">{proceso.demandado}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Juzgado</p>
              <p className="font-medium mt-1">{proceso.juzgado}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Juez</p>
              <p className="font-medium mt-1">{proceso.juez || 'No asignado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Revisión</p>
              <p className="font-medium mt-1">{proceso.fecha_ultima_revision ? formatDate(proceso.fecha_ultima_revision) : 'No disponible'}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm text-muted-foreground">Observaciones</p>
              <p className="font-medium mt-1">{proceso.observaciones || 'Sin observaciones'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="audiencias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audiencias">
            <Calendar className="mr-2 h-4 w-4" />
            Audiencias
          </TabsTrigger>
          <TabsTrigger value="historial">
            <History className="mr-2 h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audiencias" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Audiencias del Proceso</h3>
            <Button size="sm" onClick={handleNuevaAudiencia}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Audiencia
            </Button>
          </div>
          
          {loadingAudiencias ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Cargando audiencias...
              </CardContent>
            </Card>
          ) : audiencias.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay audiencias programadas para este proceso.
                <br />
                <Button variant="outline" size="sm" className="mt-4" onClick={handleNuevaAudiencia}>
                  <Plus className="mr-2 h-4 w-4" />
                  Programar Primera Audiencia
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Sede/Modalidad</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audiencias.map((audiencia) => (
                    <TableRow key={audiencia.id}>
                      <TableCell className="font-medium">{audiencia.tipo}</TableCell>
                      <TableCell>{formatDate(audiencia.fecha)}</TableCell>
                      <TableCell>{audiencia.hora}</TableCell>
                      <TableCell className="text-sm">
                        {audiencia.link ? (
                          <Badge variant="outline">Virtual</Badge>
                        ) : (
                          <span>{audiencia.sede || 'Por definir'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <h3 className="text-lg font-semibold">Bitácora de Cambios</h3>
          
          {loadingBitacora ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Cargando historial...
              </CardContent>
            </Card>
          ) : bitacora.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay cambios registrados para este proceso.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bitacora.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{formatDateTime(entry.fecha_cambio)}</TableCell>
                      <TableCell>{entry.usuario_nombre || 'Sistema'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.accion}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.descripcion || 
                          (entry.campo_modificado && entry.valor_anterior && entry.valor_nuevo 
                            ? `${entry.campo_modificado}: ${entry.valor_anterior} → ${entry.valor_nuevo}`
                            : 'Sin descripción'
                          )
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar proceso?"
        description="Esta acción no se puede deshacer. El proceso y toda su información asociada serán eliminados permanentemente."
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  )
}
