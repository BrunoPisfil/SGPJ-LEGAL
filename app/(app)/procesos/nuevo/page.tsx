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
import { procesosAPI, type ProcesoCreate, type TipoProceso, type EtapaProcesalType, type TipoComposicionType } from "@/lib/procesos"
import { OPCIONES_ETAPAS_PROCESALES, OPCIONES_TIPOS_COMPOSICION, getOpcionesTipoComposicion } from "@/lib/etapas-procesales"
import Link from "next/link"

export default function NuevoProcesoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const distritosJudiciales = [
    { value: "01", label: "AMAZONAS" },
    { value: "02", label: "ANCASH" },
    { value: "03", label: "APURIMAC" },
    { value: "04", label: "AREQUIPA" },
    { value: "05", label: "AYACUCHO" },
    { value: "06", label: "CAJAMARCA" },
    { value: "07", label: "CALLAO" },
    { value: "08", label: "CAÑETE" },
    { value: "09", label: "CORTE SUPERIOR NACIONAL DE JUSTICIA PENAL ESPECIALIZADA" },
    { value: "10", label: "CUSCO" },
    { value: "11", label: "HUANCAVELICA" },
    { value: "12", label: "HUANUCO" },
    { value: "13", label: "DEL SANTA" },
    { value: "14", label: "ICA" },
    { value: "15", label: "JUNIN" },
    { value: "16", label: "LA LIBERTAD" },
    { value: "17", label: "LAMBAYEQUE" },
    { value: "18", label: "LIMA" },
    { value: "19", label: "LIMA ESTE" },
    { value: "20", label: "LIMA NORTE" },
    { value: "21", label: "LIMA SUR" },
    { value: "22", label: "LORETO" },
    { value: "23", label: "MADRE DE DIOS" },
    { value: "24", label: "MOQUEGUA" },
    { value: "25", label: "PASCO" },
    { value: "26", label: "PIURA" },
    { value: "27", label: "PUENTE PIEDRA - VENTANILLA" },
    { value: "28", label: "PUNO" },
    { value: "29", label: "SAN MARTIN" },
    { value: "30", label: "SELVA CENTRAL" },
    { value: "31", label: "SULLANA" },
    { value: "32", label: "TACNA" },
    { value: "33", label: "TUMBES" },
    { value: "34", label: "UCAYALI" }
  ];

  const [tipoProceso, setTipoProceso] = useState<"civil" | "penal" | "">("")

  const [formData, setFormData] = useState({
    expediente: "",
    materia: "",
    tipo: "Civil" as TipoProceso,
    demandante: "",
    demandado: "",
    clienteRol: "demandante" as "demandante" | "demandado" | "denunciante" | "denunciado", // Para civil y penal
    clienteSeleccionado: "", // El cliente seleccionado
    parteContraria: "", // La parte contraria (texto libre)
    juzgado: "",
    especialista: "",
    abogado: "",
    estado: "Activo" as ProcessStatus,
    estadoDescripcion: "",
    carpetaFiscal: "", // Para procesos penales
    etapaProcesalActual: undefined as EtapaProcesalType | undefined,
    tipoComposicionActual: undefined as TipoComposicionType | undefined,
    // IDs para los selectores
    clienteId: "",
    juzgadoId: "",
    especialistaId: "",
    abogadoId: "",
    distritoJudicial: ""
  })

  // Handlers para los selectores
  const handleClienteSelect = (cliente: Cliente) => {
    const nombreCompleto = cliente.tipo_persona === 'natural' 
      ? `${cliente.nombres} ${cliente.apellidos}`
      : cliente.razon_social || ""
    
    // Para procesos penales: denunciante/denunciado, para civiles: demandante/demandado
    const isCivil = tipoProceso === "civil"
    const demandanteRole = isCivil ? "demandante" : "denunciante"
    const demandadoRole = isCivil ? "demandado" : "denunciado"
    
    setFormData({ 
      ...formData, 
      clienteId: cliente.id.toString(),
      clienteSeleccionado: nombreCompleto,
      // Asignar automáticamente según el rol
      demandante: (formData.clienteRol === demandanteRole) ? nombreCompleto : formData.parteContraria,
      demandado: (formData.clienteRol === demandadoRole) ? nombreCompleto : formData.parteContraria
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
      // Para procesos penales, demandante/demandado se llenan desde denunciante/denunciado
      let demandante = formData.demandante
      let demandado = formData.demandado
      
      if (tipoProceso === "penal") {
        // Mapear denunciante/denunciado a demandante/demandado para la API
        demandante = formData.clienteRol === "denunciante" ? formData.clienteSeleccionado : formData.parteContraria
        demandado = formData.clienteRol === "denunciado" ? formData.clienteSeleccionado : formData.parteContraria
      }
      
      const procesoData: ProcesoCreate = {
        expediente: formData.expediente,
        tipo: tipoProceso === "penal" ? "Penal" : determinarTipoProceso(formData.materia), 
        materia: formData.materia,
        demandante: demandante,
        demandado: demandado,
        cliente_id: formData.clienteId ? parseInt(formData.clienteId) : undefined,
        juzgado: formData.juzgado || "Sin asignar",
        juez: formData.especialista || undefined,
        estado: formData.estado,
        etapa_procesal: formData.etapaProcesalActual,
        tipo_composicion: formData.tipoComposicionActual,
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

      {/* Selector de Tipo de Proceso */}
      {!tipoProceso && (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona el tipo de proceso</CardTitle>
            <CardDescription>Elige si es un proceso civil o penal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto p-6"
                onClick={() => {
                  setTipoProceso("civil")
                  setFormData({ ...formData, clienteRol: "demandante" })
                }}
              >
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-semibold">Proceso Civil</span>
                  <span className="text-sm text-muted-foreground">Casos civiles, familia, comercial, etc.</span>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto p-6"
                onClick={() => {
                  setTipoProceso("penal")
                  setFormData({ 
                    ...formData, 
                    clienteRol: "denunciante"
                  })
                }}
              >
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-semibold">Proceso Penal</span>
                  <span className="text-sm text-muted-foreground">Casos penales con carpeta fiscal</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {tipoProceso && (
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
                  onValueChange={(value: any) => setFormData({ 
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
                    {tipoProceso === "penal" ? (
                      <>
                        <SelectItem value="denunciante">Denunciante</SelectItem>
                        <SelectItem value="denunciado">Denunciado</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="demandante">Demandante</SelectItem>
                        <SelectItem value="demandado">Demandado</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente">
                  {tipoProceso === "penal" ? (
                    formData.clienteRol === "denunciante" ? "Cliente (Denunciante)" : "Cliente (Denunciado)"
                  ) : (
                    formData.clienteRol === "demandante" ? "Cliente (Demandante)" : "Cliente (Demandado)"
                  )} <span className="text-destructive">*</span>
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
                      <span className="font-medium">Rol en el proceso:</span>
                      {tipoProceso === "penal" ? (
                        formData.clienteRol === "denunciante" ? " Denunciante" : " Denunciado"
                      ) : (
                        formData.clienteRol === "demandante" ? " Demandante" : " Demandado"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parteContraria">
                {tipoProceso === "penal" ? (
                  formData.clienteRol === "denunciante" ? "Denunciado" : "Denunciante"
                ) : (
                  formData.clienteRol === "demandante" ? "Demandado" : "Demandante"
                )} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="parteContraria"
                placeholder={tipoProceso === "penal" ? (
                  `Nombre completo del ${formData.clienteRol === "denunciante" ? "denunciado" : "denunciante"}`
                ) : (
                  `Nombre completo del ${formData.clienteRol === "demandante" ? "demandado" : "demandante"}`
                )}
                value={formData.parteContraria}
                onChange={(e) => {
                  const valor = e.target.value;
                  
                  // Determinar las variables según tipo de proceso
                  let demandanteVal = formData.demandante
                  let demandadoVal = formData.demandado
                  
                  if (tipoProceso === "penal") {
                    // Para procesos penales
                    demandanteVal = formData.clienteRol === "denunciante" ? formData.clienteSeleccionado : valor
                    demandadoVal = formData.clienteRol === "denunciado" ? formData.clienteSeleccionado : valor
                  } else {
                    // Para procesos civiles
                    demandanteVal = formData.clienteRol === "demandante" ? formData.clienteSeleccionado : valor
                    demandadoVal = formData.clienteRol === "demandado" ? formData.clienteSeleccionado : valor
                  }
                  
                  setFormData({ 
                    ...formData, 
                    parteContraria: valor,
                    demandante: demandanteVal,
                    demandado: demandadoVal
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

            {/* Campos de Etapa Procesal (solo para procesos penales) */}
            {tipoProceso === "penal" && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="etapaProcesalActual">
                      Etapa Procesal
                    </Label>
                    <Select
                      value={formData.etapaProcesalActual || ""}
                      onValueChange={(value: string) => {
                        const etapa = value as EtapaProcesalType;
                        setFormData({ 
                          ...formData, 
                          etapaProcesalActual: etapa,
                          // Limpiar tipo de composición si no aplica
                          tipoComposicionActual: undefined
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona etapa procesal" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCIONES_ETAPAS_PROCESALES.map((opcion) => (
                          <SelectItem key={opcion.value} value={opcion.value}>
                            <div className="flex flex-col">
                              <span>{opcion.label}</span>
                              <span className="text-xs text-muted-foreground">{opcion.descripcion}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de Composición (solo para etapa intermedia) */}
                  {getOpcionesTipoComposicion(formData.etapaProcesalActual).length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="tipoComposicionActual">
                        Tipo de Composición
                      </Label>
                      <Select
                        value={formData.tipoComposicionActual || ""}
                        onValueChange={(value: string) => {
                          setFormData({ 
                            ...formData, 
                            tipoComposicionActual: value as TipoComposicionType
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de composición" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOpcionesTipoComposicion(formData.etapaProcesalActual).map((opcion) => (
                            <SelectItem key={opcion.value} value={opcion.value}>
                              <div className="flex flex-col">
                                <span>{opcion.label}</span>
                                <span className="text-xs text-muted-foreground">{opcion.descripcion}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Campo de Carpeta Fiscal para procesos penales */}
            {tipoProceso === "penal" && (
              <div className="space-y-2">
                <Label htmlFor="carpetaFiscal">
                  Carpeta Fiscal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="carpetaFiscal"
                  placeholder="Ej: CF-2024-1234567"
                  value={formData.carpetaFiscal}
                  onChange={(e) => setFormData({ ...formData, carpetaFiscal: e.target.value })}
                  required={tipoProceso === "penal"}
                />
              </div>
            )}

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
          <Button type="button" variant="outline" onClick={() => setTipoProceso("")} disabled={isLoading}>
            Volver
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/procesos")} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Crear Proceso"}
          </Button>
        </div>
        </form>
      )}
    </div>
  )
}
