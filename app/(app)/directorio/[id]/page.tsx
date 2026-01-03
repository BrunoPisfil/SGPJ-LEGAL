"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, User, Building2, Mail, Phone, MapPin, FileText, Loader, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import directorioAPI, { type DirectorioEntry } from "@/lib/directorio"
import { procesosAPI, type Proceso } from "@/lib/procesos"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProcessStatusBadge } from "@/components/process-status-badge"
import { Money } from "@/components/money"
import { formatDate } from "@/lib/format"

export default function DirectorioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [entrada, setEntrada] = useState<DirectorioEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedProcesses, setRelatedProcesses] = useState<Proceso[]>([])

  useEffect(() => {
    loadDirectorioData()
  }, [params.id])

  const loadDirectorioData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const entradaId = parseInt(params.id as string)
      const data = await directorioAPI.getById(entradaId)
      setEntrada(data)
      
      // Cargar procesos relacionados si es cliente
      if (data.tipo === "cliente") {
        try {
          const procesos = await procesosAPI.getAll()
          const clienteName = data.tipo_persona === "natural" 
            ? `${data.nombres || ''} ${data.apellidos || ''}`.trim()
            : data.razon_social || ''
          
          const filtered = procesos.filter((p: Proceso) => 
            (p.demandante && p.demandante.toLowerCase().includes(clienteName.toLowerCase())) || 
            (p.demandado && p.demandado.toLowerCase().includes(clienteName.toLowerCase()))
          )
          setRelatedProcesses(filtered)
        } catch (err) {
          console.warn('Error loading related processes:', err)
        }
      }
    } catch (err) {
      console.error('Error loading directorio entry:', err)
      setError('Registro no encontrado')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (!entrada || error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Registro no encontrado</h2>
          <p className="text-muted-foreground mt-2">{error || "El registro solicitado no existe"}</p>
          <Button className="mt-4" asChild>
            <Link href="/directorio">Volver al Directorio</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getTitle = () => {
    if (entrada.tipo === "cliente") {
      return entrada.tipo_persona === "natural" 
        ? `${entrada.nombres || ''} ${entrada.apellidos || ''}`.trim() 
        : entrada.razon_social
    }
    return entrada.nombre
  }

  const getTypeLabel = () => {
    if (entrada.tipo === "cliente") {
      return entrada.tipo_persona === "natural" ? "Persona Natural" : "Persona Jurídica"
    } else if (entrada.tipo === "juzgado") {
      return "Juzgado"
    } else {
      return "Especialista"
    }
  }

  const handleDelete = async () => {
    try {
      await directorioAPI.delete(entrada.id)
      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado exitosamente",
      })
      router.push("/directorio")
    } catch (err) {
      console.error('Error deleting entry:', err)
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async () => {
    try {
      await directorioAPI.update(entrada.id, {
        activo: !entrada.activo
      })
      setEntrada({ ...entrada, activo: !entrada.activo })
      toast({
        title: entrada.activo ? "Registro desactivado" : "Registro activado",
        description: `El registro ha sido ${entrada.activo ? "desactivado" : "activado"} exitosamente`,
      })
    } catch (err) {
      console.error('Error updating entry:', err)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del registro",
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
            <Link href="/directorio">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{getTitle()}</h1>
              <Badge variant={entrada.activo ? "default" : "secondary"}>{entrada.activo ? "Activo" : "Inactivo"}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{getTypeLabel()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleToggleStatus}>
            {entrada.activo ? "Desactivar" : "Activar"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/directorio/${entrada.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Información */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nombre/Razón Social */}
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  {entrada.tipo === "cliente" && entrada.tipo_persona === "natural" ? (
                    <User className="h-5 w-5 text-primary" />
                  ) : entrada.tipo === "cliente" ? (
                    <Building2 className="h-5 w-5 text-primary" />
                  ) : entrada.tipo === "juzgado" ? (
                    <Building2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Briefcase className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {entrada.tipo === "cliente" && entrada.tipo_persona === "natural" ? "Nombre Completo" : "Nombre"}
                  </p>
                  <p className="font-medium mt-1">{getTitle()}</p>
                </div>
              </div>

              {/* Documento (si es cliente) */}
              {entrada.tipo === "cliente" && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{entrada.doc_tipo}</p>
                    <p className="font-medium mt-1">{entrada.doc_numero}</p>
                  </div>
                </div>
              )}

              {/* Distrito Judicial (si es juzgado) */}
              {entrada.tipo === "juzgado" && entrada.distrito_judicial && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distrito Judicial</p>
                    <p className="font-medium mt-1">{entrada.distrito_judicial}</p>
                  </div>
                </div>
              )}

              {/* Especialidad (si es especialista) */}
              {entrada.tipo === "especialista" && entrada.especialidad && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Especialidad</p>
                    <p className="font-medium mt-1">{entrada.especialidad}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              {entrada.email && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${entrada.email}`} className="font-medium mt-1 hover:underline">
                      {entrada.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Teléfono */}
              {entrada.telefono && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium mt-1">{entrada.telefono}</p>
                  </div>
                </div>
              )}

              {/* Dirección */}
              {entrada.direccion && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium mt-1">{entrada.direccion}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {entrada.tipo === "cliente" && (
                <div>
                  <p className="text-sm text-muted-foreground">Procesos Relacionados</p>
                  <p className="text-2xl font-bold mt-1">{relatedProcesses.length}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={entrada.activo ? "default" : "secondary"} className="mt-1">
                  {entrada.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {entrada.created_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Registrado desde</p>
                  <p className="font-medium mt-1">{formatDate(entrada.created_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Processes - solo para clientes */}
      {entrada.tipo === "cliente" && relatedProcesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Procesos Relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedProcesses.map((proceso) => {
                  const clienteName = entrada.tipo_persona === "natural" 
                    ? `${entrada.nombres || ''} ${entrada.apellidos || ''}`.trim()
                    : entrada.razon_social
                  
                  return (
                    <TableRow key={proceso.id}>
                      <TableCell className="font-medium">{proceso.expediente}</TableCell>
                      <TableCell>{proceso.materia}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{proceso.demandante === clienteName ? "Demandante" : "Demandado"}</Badge>
                      </TableCell>
                      <TableCell>
                        <ProcessStatusBadge 
                          status={proceso.estado} 
                          juridicalStatus={proceso.estado_juridico}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/procesos/${proceso.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar registro?"
        description="Esta acción no se puede deshacer. El registro y toda su información asociada serán eliminados permanentemente."
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  )
}
