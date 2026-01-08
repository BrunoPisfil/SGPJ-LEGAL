"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import directorioAPI, { type DirectorioEntry, type DirectorioUpdate } from "@/lib/directorio"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface ProcesoCliente {
  proceso_id: number;
  expediente: string;
  tipo_parte: 'demandante' | 'demandado' | 'tercero';
  es_nuestro_cliente: boolean;
}

export default function EditarDirectorioPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entrada, setEntrada] = useState<DirectorioEntry | null>(null)
  const [procesosCliente, setProcesosCliente] = useState<ProcesoCliente[]>([])
  const [editingProceso, setEditingProceso] = useState<number | null>(null)
  const [nuevaTipoParte, setNuevaTipoParte] = useState<string>("")

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    // Cliente
    tipo_persona: "natural" as "natural" | "juridica",
    nombres: "",
    apellidos: "",
    razon_social: "",
    doc_tipo: "DNI" as "DNI" | "RUC" | "CE" | "PAS",
    doc_numero: "",
    // Juzgado
    distrito_judicial: "",
    // Especialista
    especialidad: "",
    numero_colegiado: "",
  })

  useEffect(() => {
    loadDirectorioData()
  }, [params.id])

  const loadDirectorioData = async () => {
    try {
      setLoading(true)
      const entradaId = parseInt(params.id as string)
      const data = await directorioAPI.getById(entradaId)
      setEntrada(data)
      setFormData({
        nombre: data.nombre || "",
        email: data.email || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        tipo_persona: data.tipo_persona || "natural",
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        razon_social: data.razon_social || "",
        doc_tipo: data.doc_tipo || "DNI",
        doc_numero: data.doc_numero || "",
        distrito_judicial: data.distrito_judicial || "",
        especialidad: data.especialidad || "",
        numero_colegiado: data.numero_colegiado || "",
      })
      
      // Cargar procesos asociados si es cliente
      if (data.tipo === "cliente") {
        await loadProcessosCliente(entradaId)
      }
    } catch (err) {
      console.error('Error loading entrada:', err)
      setError('Registro no encontrado')
    } finally {
      setLoading(false)
    }
  }

  const loadProcessosCliente = async (clienteId: number) => {
    try {
      const response = await fetch(`/api/v1/directorio/${clienteId}/procesos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProcesosCliente(data || [])
      }
    } catch (err) {
      console.error('Error loading procesos:', err)
      // No mostrar error toast ya que los procesos son opcionales
    }
  }

  const handleUpdateTipoParte = async (procesoId: number, tipoParte: string) => {
    if (!entrada) return
    
    try {
      const response = await fetch(`/api/v1/procesos/${procesoId}/partes/${entrada.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ tipo_parte: tipoParte }),
      })
      
      if (response.ok) {
        toast({
          title: "Rol actualizado",
          description: `El cliente ahora es ${tipoParte}`,
        })
        await loadProcessosCliente(entrada.id)
        setEditingProceso(null)
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el rol",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error('Error updating tipo_parte:', err)
      toast({
        title: "Error",
        description: "Error al actualizar el rol",
        variant: "destructive",
      })
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
        ? `${formData.nombres} ${formData.apellidos}` 
        : formData.razon_social
    }
    return formData.nombre
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateData: DirectorioUpdate = {
        nombre: formData.nombre,
        telefono: formData.telefono,
        direccion: formData.direccion,
      }
      if (formData.email?.trim()) {
        updateData.email = formData.email.trim()
      }
      // Campos específicos según tipo
      if (entrada.tipo === "cliente") {
        updateData.tipo_persona = formData.tipo_persona
        updateData.nombres = formData.nombres
        updateData.apellidos = formData.apellidos
        updateData.razon_social = formData.razon_social
        updateData.doc_tipo = formData.doc_tipo
        updateData.doc_numero = formData.doc_numero
      } else if (entrada.tipo === "juzgado") {
        updateData.distrito_judicial = formData.distrito_judicial
      } else if (entrada.tipo === "especialista") {
        updateData.nombres = formData.nombres
        updateData.apellidos = formData.apellidos
        updateData.especialidad = formData.especialidad
        updateData.numero_colegiado = formData.numero_colegiado
      }

      await directorioAPI.update(entrada.id, updateData)

      toast({
        title: "Registro actualizado",
        description: "Los datos han sido actualizados exitosamente",
      })
      router.push(`/directorio/${params.id}`)
    } catch (err) {
      console.error('Error updating entry:', err)
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro",
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
          <Link href={`/directorio/${params.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Registro</h1>
          <p className="text-muted-foreground mt-1">{getTitle()}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="datos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="datos">Información General</TabsTrigger>
            {entrada.tipo === "cliente" && procesosCliente.length > 0 && (
              <TabsTrigger value="procesos">Roles en Procesos ({procesosCliente.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="datos">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Actualiza los datos del registro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
            {/* Nombre - Solo para JUZGADO */}
            {entrada.tipo === "juzgado" && (
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Juzgado</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Campos específicos para CLIENTE */}
            {entrada.tipo === "cliente" && (
              <>
                <div className="space-y-2">
                  <Label>Tipo de Persona</Label>
                  <Select value={formData.tipo_persona} onValueChange={(value) => setFormData({ ...formData, tipo_persona: value as "natural" | "juridica" })}>
                    <SelectTrigger disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">Persona Natural</SelectItem>
                      <SelectItem value="juridica">Persona Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">El tipo de persona no puede ser modificado</p>
                </div>

                {formData.tipo_persona === "natural" ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombres">Nombres</Label>
                      <Input
                        id="nombres"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidos">Apellidos</Label>
                      <Input
                        id="apellidos"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="razonSocial">Razón Social</Label>
                    <Input
                      id="razonSocial"
                      value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="doc_tipo">Tipo de Documento</Label>
                    <Select value={formData.doc_tipo} onValueChange={(value) => setFormData({ ...formData, doc_tipo: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="RUC">RUC</SelectItem>
                        <SelectItem value="CE">Carné de Extranjería</SelectItem>
                        <SelectItem value="PAS">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc_numero">Número de Documento</Label>
                    <Input
                      id="doc_numero"
                      value={formData.doc_numero}
                      onChange={(e) => setFormData({ ...formData, doc_numero: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Campos específicos para JUZGADO */}
            {entrada.tipo === "juzgado" && (
              <div className="space-y-2">
                <Label htmlFor="distrito_judicial">Distrito Judicial</Label>
                <Input
                  id="distrito_judicial"
                  value={formData.distrito_judicial}
                  onChange={(e) => setFormData({ ...formData, distrito_judicial: e.target.value })}
                />
              </div>
            )}

            {/* Campos específicos para ESPECIALISTA */}
            {entrada.tipo === "especialista" && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombres">Nombres</Label>
                    <Input
                      id="nombres"
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Input
                      id="especialidad"
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_colegiado">Número Colegiado</Label>
                    <Input
                      id="numero_colegiado"
                      value={formData.numero_colegiado}
                      onChange={(e) => setFormData({ ...formData, numero_colegiado: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Contacto */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

          {/* Tab de Procesos */}
          {entrada.tipo === "cliente" && (
            <TabsContent value="procesos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Roles en Procesos</CardTitle>
                  <CardDescription>Visualiza y edita los roles del cliente en cada proceso</CardDescription>
                </CardHeader>
                <CardContent>
                  {procesosCliente.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Este cliente no está asociado a ningún proceso</p>
                  ) : (
                    <div className="space-y-4">
                      {procesosCliente.map((proceso) => (
                        <div key={proceso.proceso_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{proceso.expediente}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm text-muted-foreground">Rol:</span>
                              {editingProceso === proceso.proceso_id ? (
                                <div className="flex items-center gap-2">
                                  <Select value={nuevaTipoParte} onValueChange={setNuevaTipoParte}>
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Selecciona rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="demandante">Demandante</SelectItem>
                                      <SelectItem value="demandado">Demandado</SelectItem>
                                      <SelectItem value="tercero">Tercero</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateTipoParte(proceso.proceso_id, nuevaTipoParte)}
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingProceso(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    proceso.tipo_parte === 'demandante' ? 'bg-blue-100 text-blue-800' :
                                    proceso.tipo_parte === 'demandado' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {proceso.tipo_parte.charAt(0).toUpperCase() + proceso.tipo_parte.slice(1)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingProceso(proceso.proceso_id)
                                      setNuevaTipoParte(proceso.tipo_parte)
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/directorio/${params.id}`)}
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