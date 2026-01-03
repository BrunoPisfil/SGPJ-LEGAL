"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProcessSelector } from "@/components/process-selector"
import { useToast } from "@/hooks/use-toast"
import { resolucionesAPI, type Resolucion } from "@/lib/resoluciones"
import { procesosAPI, type Proceso } from "@/lib/procesos"
import Link from "next/link"

export default function EditarResolucionPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)
  const [resolucion, setResolucion] = useState<Resolucion | null>(null)
  const [formData, setFormData] = useState({
    tipo: "",
    fechaNotificacion: "",
    accionRequerida: "",
    fechaLimite: "",
    responsable: "",
    estado: "",
    notas: "",
  })

  useEffect(() => {
    loadResolucion()
  }, [params.id])

  const loadResolucion = async () => {
    try {
      setIsLoadingData(true)
      console.log('📡 Cargando resolución para editar:', params.id)
      const data = await resolucionesAPI.getById(parseInt(params.id as string))
      console.log('✅ Resolución cargada:', data)
      setResolucion(data)
      
      // Cargar el proceso asociado
      if (data.proceso_id) {
        try {
          const procesoData = await procesosAPI.getById(data.proceso_id)
          console.log('✅ Proceso cargado:', procesoData)
          setSelectedProceso(procesoData)
        } catch (err) {
          console.warn('Advertencia: No se pudo cargar el proceso relacionado')
        }
      }
      
      // Llenar el formulario
      setFormData({
        tipo: data.tipo || "",
        fechaNotificacion: data.fecha_notificacion ? new Date(data.fecha_notificacion).toISOString().split('T')[0] : "",
        accionRequerida: data.accion_requerida || "",
        fechaLimite: data.fecha_limite ? new Date(data.fecha_limite).toISOString().split('T')[0] : "",
        responsable: data.responsable || "",
        estado: data.estado || "pendiente",
        notas: data.notas || "",
      })
    } catch (error) {
      console.error('❌ Error cargando resolución:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la resolución",
        variant: "destructive",
      })
      setTimeout(() => router.push("/resoluciones"), 2000)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleProcessSelect = (proceso: Proceso) => {
    setSelectedProceso(proceso)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!resolucion) {
      toast({
        title: "Error",
        description: "No se pudo cargar la resolución",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await resolucionesAPI.update(resolucion.id, {
        tipo: formData.tipo,
        fecha_notificacion: formData.fechaNotificacion,
        accion_requerida: formData.accionRequerida,
        fecha_limite: formData.fechaLimite,
        responsable: formData.responsable,
        estado: formData.estado,
        notas: formData.notas,
      } as any)

      toast({
        title: "Resolución actualizada",
        description: "Los cambios han sido guardados exitosamente",
      })

      router.push("/resoluciones")
    } catch (error: any) {
      console.error('Error updating resolución:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la resolución",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Cargando resolución...</h2>
        </div>
      </div>
    )
  }

  if (!resolucion) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Resolución no encontrada</h2>
          <Button className="mt-4" asChild>
            <Link href="/resoluciones">Volver a Resoluciones</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/resoluciones">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Resolución</h1>
          <p className="text-muted-foreground mt-1">ID: {resolucion.id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="procesoId">Proceso Judicial *</Label>
                <ProcessSelector
                  selectedProcessId={selectedProceso?.id?.toString()}
                  onProcessSelect={handleProcessSelect}
                />
                {selectedProceso && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <p><strong>Expediente:</strong> {selectedProceso.expediente}</p>
                    <p><strong>Materia:</strong> {selectedProceso.materia}</p>
                    <p><strong>Partes:</strong> {selectedProceso.demandante} vs {selectedProceso.demandado}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Resolución *</Label>
                <Select 
                  name="tipo" 
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improcedente">Improcedente</SelectItem>
                    <SelectItem value="infundada">Infundada</SelectItem>
                    <SelectItem value="fundada_en_parte">Fundada en Parte</SelectItem>
                    <SelectItem value="rechazo_medios_probatorios">Rechazo de Medios Probatorios</SelectItem>
                    <SelectItem value="no_ha_lugar">No Ha Lugar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaNotificacion">Fecha de Notificación *</Label>
                <Input
                  type="date"
                  name="fechaNotificacion"
                  value={formData.fechaNotificacion}
                  onChange={(e) => setFormData({ ...formData, fechaNotificacion: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accionRequerida">Acción Requerida *</Label>
                <Select 
                  name="accionRequerida" 
                  value={formData.accionRequerida}
                  onValueChange={(value) => setFormData({ ...formData, accionRequerida: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apelar">Apelar</SelectItem>
                    <SelectItem value="subsanar">Subsanar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaLimite">Fecha Límite de Acción *</Label>
                <Input
                  type="date"
                  name="fechaLimite"
                  value={formData.fechaLimite}
                  onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsable">Responsable *</Label>
                <Input 
                  type="text" 
                  name="responsable" 
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select 
                  name="estado" 
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_tramite">En Trámite</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea 
                name="notas" 
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={4} 
                className="resize-none" 
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
