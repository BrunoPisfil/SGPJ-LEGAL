"use client"

import { useState, useEffect } from "react"
import { Building, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import type { Juzgado } from "@/lib/juzgados"

interface JuzgadoSelectorProps {
  selectedJuzgadoId?: string
  selectedJuzgadoNombre?: string
  onJuzgadoSelect: (juzgado: any) => void
  trigger?: React.ReactNode
}

export function JuzgadoSelector({ 
  selectedJuzgadoId, 
  selectedJuzgadoNombre,
  onJuzgadoSelect, 
  trigger 
}: JuzgadoSelectorProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [distritos, setDistritos] = useState<any[]>([])
  const [instancias, setInstancias] = useState<any[]>([])
  const [especialidades, setEspecialidades] = useState<any[]>([])
  const [juzgadosDisponibles, setJuzgadosDisponibles] = useState<any[]>([])

  const [selectedDistrito, setSelectedDistrito] = useState("")
  const [selectedInstancia, setSelectedInstancia] = useState("")
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [juzgadoSeleccionado, setJuzgadoSeleccionado] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 1. Cargar distritos e instancias al abrir modal
  useEffect(() => {
    if (open) {
      cargarDistritos()
      cargarInstancias()
    }
  }, [open])

  // 2. Cargar especialidades cuando cambia instancia
  useEffect(() => {
    if (selectedInstancia) {
      cargarEspecialidades(parseInt(selectedInstancia))
    } else {
      setEspecialidades([])
    }
  }, [selectedInstancia])

  // 3. Buscar juzgados cuando todos están seleccionados
  useEffect(() => {
    setCurrentPage(1) // Resetear a página 1
    
    // Si es Juzgado Penal, no necesita especialidad
    if (selectedInstancia === "999") {
      // Crear juzgado penal virtual
      setJuzgadosDisponibles([{
        id: 999,
        nombre: "Juzgado Penal",
        distrito_judicial: selectedDistrito ? distritos.find(d => d.id.toString() === selectedDistrito)?.nombre : "",
        direccion: "Juzgado Penal",
        telefono: "",
        email: ""
      }])
    } else if (selectedDistrito && selectedInstancia && selectedEspecialidad) {
      buscarJuzgados()
    } else {
      setJuzgadosDisponibles([])
    }
  }, [selectedDistrito, selectedInstancia, selectedEspecialidad])

  const cargarDistritos = async () => {
    try {
      const data = await apiClient.get<any[]>("/directorio/juzgados/distritos")
      setDistritos(data)
    } catch (error) {
      console.error("Error cargando distritos:", error)
      toast({ title: "Error", description: "No se pudieron cargar los distritos", variant: "destructive" })
    }
  }

  const cargarInstancias = async () => {
    try {
      const data = await apiClient.get<any[]>("/directorio/juzgados/instancias")
      // Agregar "Juzgado Penal" como opción especial
      const instanciasConPenal = [
        ...data,
        { id: 999, nombre: "Juzgado Penal" } // ID especial para juzgado penal
      ]
      setInstancias(instanciasConPenal)
    } catch (error) {
      console.error("Error cargando instancias:", error)
      toast({ title: "Error", description: "No se pudieron cargar las instancias", variant: "destructive" })
    }
  }

  const cargarEspecialidades = async (instanciaId: number) => {
    try {
      const data = await apiClient.get<any[]>(
        `/directorio/juzgados/especialidades-por-instancia/${instanciaId}`
      )
      setEspecialidades(data)
      setSelectedEspecialidad("") // Resetear especialidad seleccionada
    } catch (error) {
      console.error("Error cargando especialidades:", error)
      toast({ title: "Error", description: "No se pudieron cargar las especialidades", variant: "destructive" })
    }
  }

  const buscarJuzgados = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get<any[]>(
        `/directorio/juzgados/filtrados?distrito_id=${selectedDistrito}&instancia_id=${selectedInstancia}&especialidad_id=${selectedEspecialidad}`
      )
      setJuzgadosDisponibles(data)
    } catch (error) {
      console.error("Error buscando juzgados:", error)
      toast({ title: "Error", description: "No se pudieron cargar los juzgados", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeleccionarJuzgado = (juzgado: any) => {
    setJuzgadoSeleccionado(juzgado)
    onJuzgadoSelect({
      id: juzgado.id,
      nombre: juzgado.nombre,
      distrito_judicial: juzgado.distrito_judicial,
      direccion: juzgado.direccion,
      telefono: juzgado.telefono,
      email: juzgado.email
    })
    setOpen(false)
    // Resetear selectores
    setSelectedDistrito("")
    setSelectedInstancia("")
    setSelectedEspecialidad("")
  }

  // Paginación
  const totalPages = Math.ceil(juzgadosDisponibles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const juzgadosPaginados = juzgadosDisponibles.slice(startIndex, endIndex)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Building className="mr-2 h-4 w-4" />
            {juzgadoSeleccionado?.nombre || selectedJuzgadoNombre 
              ? juzgadoSeleccionado?.nombre || selectedJuzgadoNombre
              : "Seleccionar juzgado"
            }
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Juzgado</DialogTitle>
          <DialogDescription>
            Elige el distrito, la instancia y la especialidad para filtrar los juzgados disponibles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de Distrito */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Distrito Judicial</label>
            <Select value={selectedDistrito} onValueChange={setSelectedDistrito}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un distrito..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {distritos.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Instancia */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Instancia</label>
            <Select value={selectedInstancia} onValueChange={setSelectedInstancia}>
              <SelectTrigger disabled={!selectedDistrito}>
                <SelectValue placeholder="Selecciona una instancia..." />
              </SelectTrigger>
              <SelectContent>
                {instancias.map((i) => (
                  <SelectItem key={i.id} value={i.id.toString()}>
                    {i.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Especialidad - NO MOSTRAR si es Juzgado Penal */}
          {selectedInstancia !== "999" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidad</label>
              <Select value={selectedEspecialidad} onValueChange={setSelectedEspecialidad}>
                <SelectTrigger disabled={!selectedInstancia}>
                  <SelectValue placeholder="Selecciona una especialidad..." />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lista de Juzgados Disponibles */}
          {selectedDistrito && selectedInstancia && (selectedEspecialidad || selectedInstancia === "999") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Juzgado</label>
              {isLoading ? (
                <p className="text-sm text-gray-500 p-4 text-center">Cargando juzgados...</p>
              ) : juzgadosDisponibles.length > 0 ? (
                <div className="border rounded-md p-2 space-y-1">
                  {juzgadosPaginados.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => handleSeleccionarJuzgado(j)}
                      className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm border hover:border-blue-300 transition"
                    >
                      <p className="font-medium">{j.nombre}</p>
                      {j.direccion && j.direccion !== "Juzgado Penal" && <p className="text-xs text-gray-500">{j.direccion}</p>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 p-4 text-center">No hay juzgados disponibles</p>
              )}
              
              {/* Controles de paginación */}
              {juzgadosDisponibles.length > itemsPerPage && (
                <div className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    {startIndex + 1} - {Math.min(endIndex, juzgadosDisponibles.length)} de {juzgadosDisponibles.length}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-6 px-2"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-6 px-2"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}