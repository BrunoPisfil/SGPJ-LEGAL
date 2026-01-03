"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProcessSelector } from "@/components/process-selector"
import { useToast } from "@/hooks/use-toast"
import type { Proceso } from "@/lib/procesos"
import { resolucionesAPI, type ResolucionCreate } from "@/lib/resoluciones"
import Link from "next/link"

export default function NuevaResolucionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)

  const handleProcessSelect = (proceso: Proceso) => {
    setSelectedProceso(proceso)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!selectedProceso) {
      toast({
        title: "Error",
        description: "Debe seleccionar un proceso judicial",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData(e.currentTarget)
      
      const resolucionData: ResolucionCreate = {
        proceso_id: selectedProceso.id,
        tipo: formData.get('tipo') as any,
        fecha_notificacion: formData.get('fechaNotificacion') as string,
        accion_requerida: formData.get('accionRequerida') as any,
        fecha_limite: formData.get('fechaLimite') as string,
        responsable: formData.get('responsable') as string,
        estado_accion: formData.get('estadoAccion') as any,
        notas: formData.get('notas') as string || undefined,
      }

      await resolucionesAPI.create(resolucionData)

      toast({
        title: "Resolución creada",
        description: "La resolución ha sido registrada exitosamente",
      })

      router.push("/resoluciones")
    } catch (error) {
      console.error('Error creating resolucion:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la resolución. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/resoluciones">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Resolución</h1>
          <p className="text-muted-foreground mt-1">Registra una nueva resolución judicial</p>
        </div>
      </div>

      {/* Form */}
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
                <Select name="tipo" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
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
                <Input type="date" name="fechaNotificacion" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accionRequerida">Acción Requerida *</Label>
                <Select name="accionRequerida" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apelar">Apelar</SelectItem>
                    <SelectItem value="subsanar">Subsanar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaLimite">Fecha Límite de Acción *</Label>
                <Input type="date" name="fechaLimite" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsable">Responsable *</Label>
                <Input type="text" name="responsable" placeholder="Nombre del responsable" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estadoAccion">Estado de Acción *</Label>
                <Select name="estadoAccion" defaultValue="pendiente" required>
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
                placeholder="Observaciones o detalles adicionales..."
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
                {isSubmitting ? "Guardando..." : "Guardar Resolución"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
