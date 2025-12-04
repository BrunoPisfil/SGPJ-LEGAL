"use client"

import { useState, useEffect } from "react"
import { Search, Building, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { juzgadosAPI, type Juzgado } from "@/lib/juzgados"

interface JuzgadoSelectorProps {
  selectedJuzgadoId?: string
  onJuzgadoSelect: (juzgado: Juzgado) => void
  trigger?: React.ReactNode
}

export function JuzgadoSelector({ selectedJuzgadoId, onJuzgadoSelect, trigger }: JuzgadoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [juzgados, setJuzgados] = useState<Juzgado[]>([])
  const [filteredJuzgados, setFilteredJuzgados] = useState<Juzgado[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Cargar juzgados cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadJuzgados()
    }
  }, [open])

  // Filtrar juzgados cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredJuzgados(juzgados)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = juzgados.filter((juzgado) =>
        juzgado.nombre.toLowerCase().includes(query) ||
        juzgado.distrito_judicial.toLowerCase().includes(query) ||
        (juzgado.direccion && juzgado.direccion.toLowerCase().includes(query))
      )
      setFilteredJuzgados(filtered)
    }
  }, [searchQuery, juzgados])

  const loadJuzgados = async () => {
    try {
      setLoading(true)
      // Llamar a la API real para obtener juzgados
      const data = await juzgadosAPI.getAll()
      setJuzgados(data)
      setFilteredJuzgados(data)
    } catch (error) {
      console.error('Error loading juzgados:', error)
      setJuzgados([])
      setFilteredJuzgados([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectJuzgado = (juzgado: Juzgado) => {
    onJuzgadoSelect(juzgado)
    setOpen(false)
    setSearchQuery("") // Limpiar búsqueda para la próxima vez
  }

  const selectedJuzgado = juzgados.find(j => j.id.toString() === selectedJuzgadoId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Building className="mr-2 h-4 w-4" />
            {selectedJuzgado 
              ? selectedJuzgado.nombre
              : "Seleccionar juzgado"
            }
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent 
        className="!max-w-[85vw] !w-[85vw] max-h-[85vh] flex flex-col p-0" 
        style={{ 
          width: '85vw !important', 
          maxWidth: '85vw !important',
          minWidth: '85vw !important'
        }}
      >
        <DialogHeader className="px-6 pt-4 pb-1 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            Seleccionar Juzgado
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-1 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre de juzgado, distrito judicial o dirección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-7 px-2 text-xs"
            >
              Todos
            </Button>
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