"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClienteSelector } from "@/components/cliente-selector"
import { JuzgadoSelector } from "@/components/juzgado-selector"
import { EspecialistaSelector } from "@/components/especialista-selector"
import { AbogadoSelector } from "@/components/abogado-selector"
import { useToast } from "@/hooks/use-toast"
import type { ProcessStatus } from "@/components/process-status-badge"
import type { Cliente } from "@/lib/clientes"
import { procesosAPI, type ProcesoCreate, type TipoProceso } from "@/lib/procesos"
import Link from "next/link"

export default function NuevoProcesoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    expediente: "",
    materia: "",
    tipo: "Civil" as TipoProceso,
    demandante: "",
    demandado: "",
    clienteRol: "demandante" as "demandante" | "demandado", // Nuestro cliente es demandante o demandado
    clienteSeleccionado: "", // El cliente seleccionado
    parteContraria: "", // La parte contraria (texto libre)
    juzgado: "",
    especialista: "",
    abogado: "",
    estado: "Activo" as ProcessStatus,
    estadoDescripcion: "",
    // IDs para los selectores
    clienteId: "",
    juzgadoId: "",
    especialistaId: "",
    abogadoId: "",
  })

  // Handlers para los selectores
  const handleClienteSelect = (cliente: Cliente) => {
    const nombreCompleto = cliente.tipo_persona === 'natural' 
      ? `${cliente.nombres} ${cliente.apellidos}`
      : cliente.razon_social || ""
    
    setFormData({ 
      ...formData, 
      clienteId: cliente.id.toString(),
      clienteSeleccionado: nombreCompleto,
      // Asignar automáticamente según el rol
      demandante: formData.clienteRol === "demandante" ? nombreCompleto : formData.parteContraria,
      demandado: formData.clienteRol === "demandado" ? nombreCompleto : formData.parteContraria
    })
  }

  const handleJuzgadoSelect = (juzgado: any) => {
    setFormData({ 
      ...formData, 
      juzgadoId: juzgado.id.toString(),
      juzgado: juzgado.nombre 
    })
  }

  const handleEspecialistaSelect = (especialista: any) => {
    setFormData({ 
      ...formData, 
      especialistaId: especialista.id.toString(),
      especialista: `${especialista.nombres} ${especialista.apellidos}` 
    })
  }

  const handleAbogadoSelect = (abogado: any) => {
    setFormData({ 
      ...formData, 
      abogadoId: abogado.id.toString(),
      abogado: `${abogado.nombres} ${abogado.apellidos}` 
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validations
      if (!formData.expediente || !formData.materia || !formData.clienteSeleccionado || !formData.parteContraria) {
        toast({
          title: "Error de validación",
          description: "Por favor complete todos los campos obligatorios",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Validación adicional para estados que requieren más información
      if (formData.estado === "En trámite" && !formData.estadoDescripcion.trim()) {
        toast({
          title: "Información adicional requerida",
          description: "Para procesos en trámite, por favor proporcione detalles en las observaciones",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Preparar datos para enviar a la API
      const procesoData: ProcesoCreate = {
        expediente: formData.expediente,
        tipo: determinarTipoProceso(formData.materia), 
        materia: formData.materia,
        demandante: formData.demandante,
        demandado: formData.demandado,
        cliente_id: formData.clienteId ? parseInt(formData.clienteId) : undefined,
        juzgado: formData.juzgado || "Sin asignar",
        juez: formData.especialista || undefined,
        estado: formData.estado,
        fecha_inicio: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        observaciones: formData.estadoDescripcion || undefined,
      }

      // Llamar a la API para crear el proceso
      const nuevoProceso = await procesosAPI.create(procesoData)

      toast({
        title: "Proceso creado exitosamente",
        description: `El proceso ${formData.expediente} ha sido registrado con el ID ${nuevoProceso.id}`,
      })
      
      router.push("/procesos")
    } catch (error) {
      console.error('Error creating proceso:', error)
      toast({
        title: "Error al crear el proceso",
        description: "Ocurrió un error al guardar el proceso. Por favor intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function para determinar el tipo de proceso basado en la materia
  const determinarTipoProceso = (materia: string): TipoProceso => {
    const materiaLower = materia.toLowerCase()
    
    if (materiaLower.includes('laboral') || materiaLower.includes('trabajo') || materiaLower.includes('despido')) {
      return 'Laboral'
    }
    if (materiaLower.includes('penal') || materiaLower.includes('delito') || materiaLower.includes('criminal')) {
      return 'Penal'
    }
    if (materiaLower.includes('familia') || materiaLower.includes('divorcio') || materiaLower.includes('alimento')) {
      return 'Familia'
    }
    if (materiaLower.includes('comercial') || materiaLower.includes('mercantil') || materiaLower.includes('empresa')) {
      return 'Comercial'
    }
    if (materiaLower.includes('administrativo') || materiaLower.includes('tribut') || materiaLower.includes('municipal')) {
      return 'Administrativo'
    }
    
    // Por defecto, procesos civiles
    return 'Civil'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/procesos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Proceso</h1>
          <p className="text-muted-foreground mt-1">Registra un nuevo proceso judicial</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Proceso</CardTitle>
            <CardDescription>Complete los datos del proceso judicial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expediente">
                  Código de Expediente <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="expediente"
                  placeholder="123-2024-0-1801-JP-CI-01"
                  value={formData.expediente}
                  onChange={(e) => setFormData({ ...formData, expediente: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materia">
                  Materia <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="materia"
                  placeholder="Cobranza, Laboral, Desalojo..."
                  value={formData.materia}
                  onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nuestro cliente es el:</Label>
                <Select
                  value={formData.clienteRol}
                  onValueChange={(value: "demandante" | "demandado") => setFormData({ 
                    ...formData, 
                    clienteRol: value,
                    // Limpiar los campos cuando cambia el rol
                    clienteSeleccionado: "",
                    parteContraria: "",
                    demandante: "",
                    demandado: "",
                    clienteId: ""
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demandante">Demandante</SelectItem>
                    <SelectItem value="demandado">Demandado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente">
                  {formData.clienteRol === "demandante" ? "Cliente (Demandante)" : "Cliente (Demandado)"} <span className="text-destructive">*</span>
                </Label>
                <ClienteSelector
                  selectedClienteId={formData.clienteId}
                  onClienteSelect={handleClienteSelect}
                />
                {formData.clienteSeleccionado && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Cliente Seleccionado:</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Nombre:</span> {formData.clienteSeleccionado}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Rol en el proceso:</span> {formData.clienteRol === "demandante" ? "Demandante" : "Demandado"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parteContraria">
                {formData.clienteRol === "demandante" ? "Demandado" : "Demandante"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="parteContraria"
                placeholder={`Nombre completo del ${formData.clienteRol === "demandante" ? "demandado" : "demandante"}`}
                value={formData.parteContraria}
                onChange={(e) => {
                  const valor = e.target.value;
                  setFormData({ 
                    ...formData, 
                    parteContraria: valor,
                    // Asignar automáticamente según el rol
                    demandante: formData.clienteRol === "demandante" ? formData.clienteSeleccionado : valor,
                    demandado: formData.clienteRol === "demandado" ? formData.clienteSeleccionado : valor
                  })
                }}
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="juzgado">Juzgado</Label>
                <JuzgadoSelector
                  selectedJuzgadoId={formData.juzgadoId}
                  onJuzgadoSelect={handleJuzgadoSelect}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialista">Juez/Especialista</Label>
                <EspecialistaSelector
                  selectedEspecialistaId={formData.especialistaId}
                  onEspecialistaSelect={handleEspecialistaSelect}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="abogado">Abogado Responsable</Label>
                <AbogadoSelector
                  selectedAbogadoId={formData.abogadoId}
                  onAbogadoSelect={handleAbogadoSelect}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estadoDescripcion">Observaciones</Label>
              <Textarea
                id="estadoDescripcion"
                placeholder="Comentarios o detalles adicionales..."
                value={formData.estadoDescripcion}
                onChange={(e) => setFormData({ ...formData, estadoDescripcion: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/procesos")} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Crear Proceso"}
          </Button>
        </div>
      </form>
    </div>
  )
}
