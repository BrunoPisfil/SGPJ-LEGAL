"use client"

import { useState, useEffect } from "react"
import { Search, FileText, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProcessStatusBadge } from "@/components/process-status-badge"
import { procesosAPI, type Proceso } from "@/lib/procesos"
import { formatDate } from "@/lib/format"

interface ProcessSelectorProps {
  selectedProcessId?: string
  onProcessSelect: (proceso: Proceso) => void
  trigger?: React.ReactNode
}

export function ProcessSelector({ selectedProcessId, onProcessSelect, trigger }: ProcessSelectorProps) {
  const [open, setOpen] = useState(false)
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [filteredProcesos, setFilteredProcesos] = useState<Proceso[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Cargar procesos cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadProcesos()
    }
  }, [open])

  // Filtrar procesos cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProcesos(procesos)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = procesos.filter((proceso) =>
        proceso.expediente.toLowerCase().includes(query) ||
        proceso.materia.toLowerCase().includes(query) ||
        (proceso.demandante && proceso.demandante.toLowerCase().includes(query)) ||
        (proceso.demandado && proceso.demandado.toLowerCase().includes(query)) ||
        (proceso.juzgado && proceso.juzgado.toLowerCase().includes(query))
      )
      setFilteredProcesos(filtered)
    }
  }, [searchQuery, procesos])

  const loadProcesos = async () => {
    try {
      setLoading(true)
      const data = await procesosAPI.getAll()
      setProcesos(data)
      setFilteredProcesos(data)
    } catch (error) {
      console.error('Error loading procesos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProceso = (proceso: Proceso) => {
    onProcessSelect(proceso)
    setOpen(false)
    setSearchQuery("") // Limpiar búsqueda para la próxima vez
  }

  const selectedProceso = procesos.find(p => p.id.toString() === selectedProcessId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <FileText className="mr-2 h-4 w-4" />
            {selectedProceso 
              ? `${selectedProceso.expediente} - ${selectedProceso.materia}`
              : "Seleccionar proceso judicial"
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
            <FileText className="h-5 w-5" />
            Seleccionar Proceso Judicial
          </DialogTitle>
          <DialogDescription className="text-sm">Busca y selecciona el proceso judicial.</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-1 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por expediente, materia, demandante, demandado o juzgado..."
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
              onClick={() => setSearchQuery("Activo")}
              className="h-7 px-2 text-xs"
            >
              Activos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("En trámite")}
              className="h-7 px-2 text-xs"
            >
              En trámite
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
          </div>
        </div>

        <div className="flex-1 px-6 pb-2 min-h-0">
          <ScrollArea className="h-[50vh] max-h-[400px] w-full">{/* Altura normal, ancho máximo */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Cargando procesos...</div>
              </div>
            ) : filteredProcesos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron procesos" : "No hay procesos disponibles"}
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
                        <TableHead className="w-[18%] py-2 text-xs font-medium">Expediente</TableHead>
                        <TableHead className="w-[25%] py-2 text-xs font-medium">Materia</TableHead>
                        <TableHead className="w-[22%] py-2 text-xs font-medium">Partes</TableHead>
                        <TableHead className="w-[20%] py-2 text-xs font-medium">Juzgado</TableHead>
                        <TableHead className="w-[8%] py-2 text-xs font-medium">Estado</TableHead>
                        <TableHead className="w-[12%] py-2 text-xs font-medium">Últ. Revisión</TableHead>
                        <TableHead className="w-[5%] py-2 text-xs font-medium">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcesos.map((proceso) => (
                        <TableRow 
                          key={proceso.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSelectProceso(proceso)}
                        >
                          <TableCell className="font-medium py-2">
                            {proceso.expediente}
                          </TableCell>
                          <TableCell className="py-2">
                            <div>
                              <p className="font-medium text-sm">{proceso.materia}</p>
                              <p className="text-xs text-muted-foreground">{proceso.tipo}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-xs space-y-0.5">
                              <p><span className="font-medium">Dem:</span> {proceso.demandante}</p>
                              <p><span className="font-medium">Ddo:</span> {proceso.demandado}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{proceso.juzgado}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <ProcessStatusBadge 
                              status={proceso.estado} 
                              juridicalStatus={proceso.estado_juridico}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {proceso.fecha_ultima_revision 
                                  ? formatDate(proceso.fecha_ultima_revision)
                                  : "N/A"
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectProceso(proceso)
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
                {filteredProcesos.length === 0 ? (
                  searchQuery ? "No se encontraron procesos" : "No hay procesos disponibles"
                ) : searchQuery ? (
                  `${filteredProcesos.length} de ${procesos.length} procesos encontrados`
                ) : (
                  `${procesos.length} procesos disponibles`
                )}
              </p>
              {filteredProcesos.length > 10 && (
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