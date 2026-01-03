"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { ProcessSelector } from "@/components/process-selector"
import { SedeAudienciaSelector } from "@/components/sede-audiencia-selector"
import { type Proceso } from "@/lib/procesos"
import { type Juzgado } from "@/lib/juzgados"
import { audienciasAPI, type AudienciaFormData } from "@/lib/audiencias"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function NuevaAudienciaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)
  const [selectedSede, setSelectedSede] = useState<Juzgado | null>(null)

  const [formData, setFormData] = useState({
    procesoId: "",
    tipo: "",
    fecha: undefined as Date | undefined,
    hora: "",
    modalidad: "presencial" as "presencial" | "virtual",
    sede: "",
    sedeId: "",
    link: "",
    notas: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validations
      if (!formData.procesoId || !formData.tipo || !formData.fecha || !formData.hora) {
        toast({
          title: "Error de validación",
          description: "Por favor complete todos los campos obligatorios",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (formData.modalidad === "presencial" && !formData.sede) {
        toast({
          title: "Error de validación",
          description: "Debe especificar la sede para audiencias presenciales",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (formData.modalidad === "virtual" && !formData.link) {
        toast({
          title: "Error de validación",
          description: "Debe especificar el enlace para audiencias virtuales",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Convert form data to API format and create audiencia
      const audienciaData = audienciasAPI.convertFormDataToAPI(formData as AudienciaFormData)
      await audienciasAPI.create(audienciaData)

      toast({
        title: "Audiencia creada",
        description: "La audiencia ha sido programada exitosamente",
      })
      
      router.push("/audiencias")
    } catch (error: any) {
      console.error('Error creating audiencia:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la audiencia",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcesoSelect = (proceso: Proceso) => {
    setSelectedProceso(proceso)
    setFormData({ ...formData, procesoId: proceso.id.toString() })
  }

  const handleSedeSelect = (sede: Juzgado) => {
    setSelectedSede(sede)
    setFormData({ 
      ...formData, 
      sedeId: sede.id.toString(),
      sede: `${sede.nombre} - ${sede.distrito_judicial}`
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/audiencias">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Audiencia</h1>
          <p className="text-muted-foreground mt-1">Programa una nueva audiencia judicial</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Audiencia</CardTitle>
            <CardDescription>
              Complete los datos de la audiencia a programar. 
              Use la búsqueda avanzada para encontrar procesos fácilmente por expediente, cliente o materia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proceso */}
            <div className="space-y-2">
              <Label htmlFor="proceso">
                Proceso Judicial <span className="text-destructive">*</span>
              </Label>
              <ProcessSelector
                selectedProcessId={formData.procesoId}
                onProcessSelect={handleProcesoSelect}
              />
              {selectedProceso && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Proceso Seleccionado:</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Expediente:</span> {selectedProceso.expediente}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Materia:</span> {selectedProceso.materia}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Demandante:</span> {selectedProceso.demandante} vs <span className="font-medium">Demandado:</span> {selectedProceso.demandado}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Juzgado:</span> {selectedProceso.juzgado}
                  </p>
                </div>
              )}
            </div>

            {/* Tipo de Audiencia */}
            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Audiencia <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Audiencia Única">Audiencia Única</SelectItem>
                  <SelectItem value="Audiencia de Conciliación">Audiencia de Conciliación</SelectItem>
                  <SelectItem value="Audiencia de Pruebas">Audiencia de Pruebas</SelectItem>
                  <SelectItem value="Audiencia de Juzgamiento">Audiencia de Juzgamiento</SelectItem>
                  <SelectItem value="Audiencia de Saneamiento">Audiencia de Saneamiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha y Hora */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Fecha <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.fecha && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha ? formatDate(formData.fecha) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fecha}
                      onSelect={(date) => setFormData({ ...formData, fecha: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">
                  Hora <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Modalidad */}
            <div className="space-y-3">
              <Label>
                Modalidad <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.modalidad}
                onValueChange={(value: "presencial" | "virtual") => setFormData({ ...formData, modalidad: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="presencial" id="presencial" />
                  <Label htmlFor="presencial" className="font-normal cursor-pointer">
                    Presencial
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="virtual" id="virtual" />
                  <Label htmlFor="virtual" className="font-normal cursor-pointer">
                    Virtual
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Sede o Link según modalidad */}
            {formData.modalidad === "presencial" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sede">
                    Sede <span className="text-destructive">*</span>
                  </Label>
                  <SedeAudienciaSelector
                    selectedSedeId={formData.sedeId}
                    onSedeSelect={handleSedeSelect}
                  />
                  {selectedSede && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Sede Seleccionada:</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Juzgado:</span> {selectedSede.nombre}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Distrito:</span> {selectedSede.distrito_judicial}
                      </p>
                      {selectedSede.direccion && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Dirección:</span> {selectedSede.direccion}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="link">
                  Enlace de Videollamada <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://meet.pj.gob.pe/audiencia-123"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas Adicionales</Label>
              <Textarea
                id="notas"
                placeholder="Información adicional sobre la audiencia..."
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/audiencias")} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Crear Audiencia"}
          </Button>
        </div>
      </form>
    </div>
  )
}
