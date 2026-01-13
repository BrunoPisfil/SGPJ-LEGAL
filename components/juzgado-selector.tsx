"use client"

import { useState, useEffect } from "react"
import { Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
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
    if (selectedDistrito && selectedInstancia && selectedEspecialidad) {
      buscarJuzgados()
    } else {
      setJuzgadosDisponibles([])
    }
  }, [selectedDistrito, selectedInstancia, selectedEspecialidad])

  const cargarDistritos = async () => {
    try {
      const response = await fetch(
        "https://sgpj-legal-backend.vercel.app/api/v1/directorio/juzgados/distritos"
      )
      const data = await response.json()
      setDistritos(data)
    } catch (error) {
      console.error("Error cargando distritos:", error)
      toast({ title: "Error", description: "No se pudieron cargar los distritos", variant: "destructive" })
    }
  }

  const cargarInstancias = async () => {
    try {
      const response = await fetch(
        "https://sgpj-legal-backend.vercel.app/api/v1/directorio/juzgados/instancias"
      )
      const data = await response.json()
      setInstancias(data)
    } catch (error) {
      console.error("Error cargando instancias:", error)
      toast({ title: "Error", description: "No se pudieron cargar las instancias", variant: "destructive" })
    }
  }

  const cargarEspecialidades = async (instanciaId: number) => {
    try {
      const response = await fetch(
        `https://sgpj-legal-backend.vercel.app/api/v1/directorio/juzgados/especialidades-por-instancia/${instanciaId}`
      )
      const data = await response.json()
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
      const response = await fetch(
        `https://sgpj-legal-backend.vercel.app/api/v1/directorio/juzgados/filtrados?distrito_id=${selectedDistrito}&instancia_id=${selectedInstancia}&especialidad_id=${selectedEspecialidad}`
      )
      const data = await response.json()
      setJuzgadosDisponibles(data)
    } catch (error) {
      console.error("Error buscando juzgados:", error)
      toast({ title: "Error", description: "No se pudieron cargar los juzgados", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeleccionarJuzgado = (juzgado: any) => {
    onJuzgadoSelect({
      id: juzgado.id,
      nombre: juzgado.nombre,
      distrito_judicial: juzgado.distrito,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Building className="mr-2 h-4 w-4" />
            {selectedJuzgadoNombre 
              ? selectedJuzgadoNombre
              : "Seleccionar juzgado"
            }
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar Juzgado</DialogTitle>
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

          {/* Selector de Especialidad */}
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

          {/* Lista de Juzgados Disponibles */}
          {selectedDistrito && selectedInstancia && selectedEspecialidad && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Juzgado</label>
              {isLoading ? (
                <p className="text-sm text-gray-500 p-4 text-center">Cargando juzgados...</p>
              ) : juzgadosDisponibles.length > 0 ? (
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                  {juzgadosDisponibles.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => handleSeleccionarJuzgado(j)}
                      className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm border hover:border-blue-300 transition"
                    >
                      <p className="font-medium">{j.nombre}</p>
                      {j.direccion && <p className="text-xs text-gray-500">{j.direccion}</p>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 p-4 text-center">No hay juzgados disponibles</p>
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("Civil")}
              className="h-7 px-2 text-xs"
            >
              Civil
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("Laboral")}
              className="h-7 px-2 text-xs"
            >
              Laboral
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("Comercial")}
              className="h-7 px-2 text-xs"
            >
              Comercial
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("Penal")}
              className="h-7 px-2 text-xs"
            >
              Penal
            </Button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-2 min-h-0">
          <ScrollArea className="h-[50vh] max-h-[400px] w-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Cargando juzgados...</div>
              </div>
            ) : filteredJuzgados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron juzgados" : "No hay juzgados disponibles"}
                </p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Intenta con otros términos de búsqueda
                  </p>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden w-full">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="w-[35%] py-2 text-xs font-medium">Juzgado</TableHead>
                        <TableHead className="w-[20%] py-2 text-xs font-medium">Distrito Judicial</TableHead>
                        <TableHead className="w-[30%] py-2 text-xs font-medium">Dirección</TableHead>
                        <TableHead className="w-[10%] py-2 text-xs font-medium">Teléfono</TableHead>
                        <TableHead className="w-[5%] py-2 text-xs font-medium">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJuzgados.map((juzgado) => (
                        <TableRow 
                          key={juzgado.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSelectJuzgado(juzgado)}
                        >
                          <TableCell className="font-medium py-2">
                            <div>
                              <p className="font-medium text-sm">{juzgado.nombre}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{juzgado.distrito_judicial}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-xs text-muted-foreground">
                              {juzgado.direccion || "No disponible"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {juzgado.telefono && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{juzgado.telefono}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectJuzgado(juzgado)
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              Elegir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Footer con estadísticas */}
        {!loading && (
          <div className="px-6 py-2 border-t bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredJuzgados.length === 0 ? (
                  searchQuery ? "No se encontraron juzgados" : "No hay juzgados disponibles"
                ) : searchQuery ? (
                  `${filteredJuzgados.length} de ${juzgados.length} juzgados encontrados`
                ) : (
                  `${juzgados.length} juzgados disponibles`
                )}
              </p>
              {filteredJuzgados.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  📝 Desplázate para ver todos los resultados
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}