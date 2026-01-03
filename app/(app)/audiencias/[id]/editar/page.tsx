"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CalendarIcon, Loader } from "lucide-react"
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
import { SedeAudienciaSelector } from "@/components/sede-audiencia-selector"
import { audienciasAPI, type Audiencia } from "@/lib/audiencias"
import { type Juzgado } from "@/lib/juzgados"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function EditarAudienciaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [selectedSede, setSelectedSede] = useState<Juzgado | null>(null)
  const [audiencia, setAudiencia] = useState<Audiencia | null>(null)

  const [formData, setFormData] = useState({
    tipo: "",
    fecha: undefined as Date | undefined,
    hora: "",
    modalidad: "presencial" as "presencial" | "virtual",
    sede: "",
    sedeId: "",
    link: "",
    notas: "",
  })

  // Cargar audiencia cuando monta el componente
  useEffect(() => {
    loadAudiencia()
  }, [params.id])

  const loadAudiencia = async () => {
    try {
      setIsLoadingData(true)
      console.log('📡 Cargando audiencia con ID:', params.id)
      const data = await audienciasAPI.getById(parseInt(params.id as string))
      console.log('✅ Audiencia cargada:', data)
      setAudiencia(data)
      
      // Llenar el formulario con los datos de la audiencia
      const fechaParseada = new Date(data.fecha)
      setFormData({
        tipo: data.tipo || "",
        fecha: fechaParseada,
        hora: data.hora || "",
        modalidad: (data.sede ? "presencial" : "virtual") as "presencial" | "virtual",
        sede: data.sede || "",
        sedeId: "",
        link: data.link || "",
        notas: data.notas || "",
      })
    } catch (error) {
      console.error('❌ Error cargando audiencia:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la audiencia",
        variant: "destructive",
      })
      // Redirigir después de 2 segundos
      setTimeout(() => router.push("/audiencias"), 2000)
    } finally {
      setIsLoadingData(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Cargando audiencia...</h2>
        </div>
      </div>
    )
  }

  if (!audiencia) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Audiencia no encontrada</h2>
          <Button className="mt-4" asChild>
            <Link href="/audiencias">Volver a Audiencias</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validaciones
      if (!formData.tipo || !formData.fecha || !formData.hora) {
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

      await audienciasAPI.update(parseInt(params.id as string), {
        tipo: formData.tipo,
        fecha: formData.fecha.toISOString().split('T')[0],
        hora: formData.hora,
        sede: formData.modalidad === "presencial" ? formData.sede : undefined,
        link: formData.modalidad === "virtual" ? formData.link : undefined,
        notas: formData.notas,
      } as any)

      toast({
        title: "Audiencia actualizada",
        description: "La audiencia ha sido actualizada exitosamente",
      })
      router.push(`/audiencias`)
    } catch (error: any) {
      console.error('Error updating audiencia:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la audiencia",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Audiencia</h1>
          <p className="text-muted-foreground mt-1">ID: {audiencia.id} - {audiencia.tipo}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Audiencia</CardTitle>
            <CardDescription>Actualiza los datos de la audiencia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Audiencia */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Audiencia</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
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
                <Label>Fecha</Label>
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora</Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>
            </div>

            {/* Modalidad */}
            <div className="space-y-3">
              <Label>Modalidad</Label>
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
                  <Label htmlFor="sede">Sede</Label>
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
                <Label htmlFor="link">Enlace de Videollamada</Label>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/audiencias/${params.id}`)}
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
