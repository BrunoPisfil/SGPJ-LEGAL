"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { ProcessStatus, JuridicalStatus } from "@/components/process-status-badge"
import { procesosAPI, type Proceso, type ProcesoUpdate, type EstadoProceso, type EstadoJuridico } from "@/lib/procesos"
import { apiClient } from "@/lib/api"
import { usuariosAPI, type Usuario } from "@/lib/usuarios"
import Link from "next/link"

interface Parte {
  id: number;
  cliente_id: number;
  tipo_parte: 'demandante' | 'demandado' | 'tercero';
  nombre_mostrar: string;
  es_nuestro_cliente: boolean;
}

export default function EditarProcesoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [proceso, setProceso] = useState<Proceso | null>(null)
  const [partes, setPartes] = useState<Parte[]>([])
  const [editingParteId, setEditingParteId] = useState<number | null>(null)
  const [editingTipoParte, setEditingTipoParte] = useState<string>("")
  const [editingNombre, setEditingNombre] = useState<string>("")
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const [formData, setFormData] = useState({
    expediente: "",
    materia: "",
    demandante: "",
    demandado: "",
    juzgado: "",
    especialista: "",
    estado: "" as ProcessStatus | "",
    estadoJuridico: "",
    estadoDescripcion: "",
    abogadoResponsableId: 0,
  })

  useEffect(() => {
    const fetchProceso = async () => {
      if (!params.id) return
      
      try {
        const [data, abogados] = await Promise.all([
          procesosAPI.getById(Number(params.id)),
          usuariosAPI.getAll()
        ])
        
        setProceso(data)
        setUsuarios(abogados)
        setFormData({
          expediente: data.expediente || "",
          materia: data.materia || "",
          demandante: data.demandante || "",
          demandado: data.demandado || "",
          juzgado: data.juzgado || "",
          especialista: data.especialista || "",
          estado: data.estado || "",
          estadoJuridico: data.estado_juridico || "",
          estadoDescripcion: data.estadoDescripcion || "",
          abogadoResponsableId: data.abogado_responsable_id || 0,
        })
        
        // Cargar partes del proceso
        await loadPartes(Number(params.id))
      } catch (error) {
        console.error('Error al cargar proceso:', error)
        toast({
          title: "Error",
          description: "No se pudo cargar el proceso",
          variant: "destructive",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchProceso()
    // Solo ejecutar cuando params.id cambia, toast no es una dependencia de este efecto
  }, [params.id])

  const loadPartes = async (procesoId: number) => {
    try {
      const data = await apiClient.get<Parte[]>(`/procesos/${procesoId}/partes`)
      setPartes(data || [])
      console.log('✅ Partes cargadas:', data)
    } catch (err) {
      console.error('Error loading partes:', err)
      // No mostrar error ya que las partes son opcionales
    }
  }

  const handleUpdateTipoParte = async (parteId: number, tipoParte: string, nombre: string) => {
    if (!proceso) return
    try {
      await apiClient.put(`/partes/${parteId}`, {
        tipo_parte: tipoParte,
        nombre_completo: nombre
      })
      setPartes(partes.map(p =>
        p.id === parteId ? { ...p, tipo_parte: tipoParte as 'demandante' | 'demandado' | 'tercero', nombre_mostrar: nombre } : p
      ))
      toast({
        title: "Parte actualizada",
        description: "El rol y nombre de la parte han sido actualizados",
      })
      setEditingParteId(null)
    } catch (err) {
      console.error('Error updating parte:', err)
      toast({
        title: "Error",
        description: "Error al actualizar la parte",
        variant: "destructive",
      })
    }
  }

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p>Cargando proceso...</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Enviar solo campos que existen en la estructura normalizada
      const updateData = {
        materia: formData.materia,
        estado: formData.estado || null,
        estado_juridico: formData.estadoJuridico || null,
        expediente: formData.expediente,
        observaciones: formData.estadoDescripcion,
        abogado_responsable_id: formData.abogadoResponsableId || null,
        // No enviamos demandante, demandado, juzgado ya que requieren manejo especial
      }
      
      await procesosAPI.update(Number(params.id), updateData)
      toast({
        title: "Proceso actualizado",
        description: `El proceso ${formData.expediente} ha sido actualizado exitosamente`,
      })
      router.push(`/procesos/${params.id}`)
    } catch (error) {
      console.error('Error al actualizar proceso:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el proceso",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/procesos/${params.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Proceso</h1>
          <p className="text-muted-foreground mt-1">{proceso.expediente}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Proceso</CardTitle>
            <CardDescription>Actualiza los datos del proceso judicial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Expediente y Materia */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expediente">Código de Expediente</Label>
                <Input
                  id="expediente"
                  value={formData.expediente}
                  onChange={(e) => setFormData({ ...formData, expediente: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materia">Materia</Label>
                <Input
                  id="materia"
                  value={formData.materia}
                  onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Abogado Responsable */}
            <div className="space-y-2">
              <Label htmlFor="abogadoResponsable">Abogado Responsable</Label>
              <Select 
                value={formData.abogadoResponsableId.toString()} 
                onValueChange={(value) => setFormData({ ...formData, abogadoResponsableId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar abogado responsable" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.filter(u => u.rol === "admin").map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre} ({usuario.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estados */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="estado">Estado General</Label>
                  {formData.estado && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, estado: "" })}
                      className="text-xs text-muted-foreground h-6"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
                <Select
                  value={formData.estado}
                  onValueChange={(value: ProcessStatus) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado general" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="En trámite">En trámite</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                    <SelectItem value="Archivado">Archivado</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="estado_juridico">Estado Jurídico</Label>
                  {formData.estadoJuridico && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, estadoJuridico: "" })}
                      className="text-xs text-muted-foreground h-6"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
                <Select
                  value={formData.estadoJuridico}
                  onValueChange={(value) => setFormData({ ...formData, estadoJuridico: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado jurídico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente_impulsar">Pendiente Impulsar</SelectItem>
                    <SelectItem value="pendiente_sentencia">Pendiente Sentencia</SelectItem>
                    <SelectItem value="resolucion">Resolución</SelectItem>
                    <SelectItem value="audiencia_programada">Audiencia Programada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción del Estado */}
            <div className="space-y-2">
              <Label htmlFor="estadoDescripcion">Descripción del Estado</Label>
              <Textarea
                id="estadoDescripcion"
                value={formData.estadoDescripcion}
                onChange={(e) => setFormData({ ...formData, estadoDescripcion: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Partes del Proceso */}
        {partes.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Partes del Proceso</CardTitle>
              <CardDescription>Edita los roles de las partes involucradas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {partes.map((parte) => (
                <div key={parte.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {/* Nombre del cliente (no editable) */}
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Cliente</Label>
                    {editingParteId === parte.id ? (
                      <Input
                        value={editingNombre}
                        onChange={e => setEditingNombre(e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <Input
                        value={parte.nombre_mostrar}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    )}
                  </div>

                  {/* Rol (editable) */}
                  <div className="w-40">
                    <Label className="text-sm text-muted-foreground">Rol</Label>
                    {editingParteId === parte.id ? (
                      <div className="flex gap-2 mt-1">
                        <Select value={editingTipoParte} onValueChange={setEditingTipoParte}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demandante">Demandante</SelectItem>
                            <SelectItem value="demandado">Demandado</SelectItem>
                            <SelectItem value="tercero">Tercero</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          parte.tipo_parte === 'demandante' ? 'bg-blue-100 text-blue-800' :
                          parte.tipo_parte === 'demandado' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {parte.tipo_parte.charAt(0).toUpperCase() + parte.tipo_parte.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones de edición */}
                  <div className="flex gap-2 items-end">
                    {editingParteId === parte.id ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleUpdateTipoParte(parte.id, editingTipoParte, editingNombre)}
                          className="h-10"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingParteId(null)}
                          className="h-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingParteId(parte.id)
                          setEditingTipoParte(parte.tipo_parte)
                          setEditingNombre(parte.nombre_mostrar)
                        }}
                        className="h-10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/procesos/${params.id}`)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
