"use client"

import { useState, useEffect } from "react"
import { Search, UserCheck, Building, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import directorioAPI, { type DirectorioEntry } from "@/lib/directorio"

interface Especialista {
  id: number
  nombres: string
  apellidos: string
  cargo: string
  juzgado: string
  telefono?: string
  email?: string
}

interface EspecialistaSelectorProps {
  selectedEspecialistaId?: string
  onEspecialistaSelect: (especialista: Especialista) => void
  trigger?: React.ReactNode
}

export function EspecialistaSelector({ selectedEspecialistaId, onEspecialistaSelect, trigger }: EspecialistaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [especialistas, setEspecialistas] = useState<Especialista[]>([])
  const [filteredEspecialistas, setFilteredEspecialistas] = useState<Especialista[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Cargar especialistas cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadEspecialistas()
    }
  }, [open])

  // Filtrar especialistas cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEspecialistas(especialistas)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = especialistas.filter((especialista) => {
        const nombreCompleto = `${especialista.nombres} ${especialista.apellidos}`.toLowerCase()
        return nombreCompleto.includes(query) ||
               especialista.cargo.toLowerCase().includes(query) ||
               especialista.juzgado.toLowerCase().includes(query) ||
               (especialista.email && especialista.email.toLowerCase().includes(query))
      })
      setFilteredEspecialistas(filtered)
    }
    setCurrentPage(1)
  }, [searchQuery, especialistas])

  const loadEspecialistas = async () => {
    try {
      setLoading(true)
      // Intentar obtener desde el endpoint específico
      let data = await directorioAPI.getEspecialistas()
      
      // Si el endpoint específico retorna vacío, intentar filtrar desde getAll
      if (!data || data.length === 0) {
        data = await directorioAPI.getAll(0, 100, 'especialista')
      }
      
      // Transformar DirectorioEntry a Especialista
      const especialistasFormateados: Especialista[] = data.map((entry: DirectorioEntry) => ({
        id: entry.id,
        nombres: entry.nombres || entry.nombre || "",
        apellidos: entry.apellidos || "",
        cargo: entry.especialidad || "Especialista",
        juzgado: entry.nombre || "",
        telefono: entry.telefono,
        email: entry.email,
      }))
      
      setEspecialistas(especialistasFormateados)
      setFilteredEspecialistas(especialistasFormateados)
    } catch (error) {
      console.error('Error loading especialistas:', error)
      setEspecialistas([])
      setFilteredEspecialistas([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEspecialista = (especialista: Especialista) => {
    onEspecialistaSelect(especialista)
    setOpen(false)
    setSearchQuery("") // Limpiar búsqueda para la próxima vez
  }

  const getEspecialistaDisplayName = (especialista: Especialista) => {
    return `${especialista.nombres} ${especialista.apellidos}`
  }

  // Paginación
  const totalPages = Math.ceil(filteredEspecialistas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const especialistasPaginados = filteredEspecialistas.slice(startIndex, endIndex)

  const selectedEspecialista = especialistas.find(e => e.id.toString() === selectedEspecialistaId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <UserCheck className="mr-2 h-4 w-4" />
            {selectedEspecialista 
              ? getEspecialistaDisplayName(selectedEspecialista)
              : "Seleccionar juez/especialista"
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
            <UserCheck className="h-5 w-5" />
            Seleccionar Juez/Especialista
          </DialogTitle>
          <DialogDescription className="text-sm">Busca por nombre, cargo, juzgado o email.</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-1 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, cargo, juzgado o email..."
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
              onClick={() => setSearchQuery("Juez")}
              className="h-7 px-2 text-xs"
            >
              Jueces
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("Especialista")}
              className="h-7 px-2 text-xs"
            >
              Especialistas
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
          <ScrollArea className="h-[50vh] max-h-[400px] w-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Cargando especialistas...</div>
              </div>
            ) : filteredEspecialistas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron especialistas" : "No hay especialistas disponibles"}
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
                        <TableHead className="w-[25%] py-2 text-xs font-medium">Nombre</TableHead>
                        <TableHead className="w-[15%] py-2 text-xs font-medium">Cargo</TableHead>
                        <TableHead className="w-[30%] py-2 text-xs font-medium">Juzgado</TableHead>
                        <TableHead className="w-[15%] py-2 text-xs font-medium">Teléfono</TableHead>
                        <TableHead className="w-[10%] py-2 text-xs font-medium">Email</TableHead>
                        <TableHead className="w-[5%] py-2 text-xs font-medium">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {especialistasPaginados.map((especialista) => (
                        <TableRow 
                          key={especialista.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSelectEspecialista(especialista)}
                        >
                          <TableCell className="font-medium py-2">
                            <div>
                              <p className="font-medium text-sm">{getEspecialistaDisplayName(especialista)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{especialista.cargo}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{especialista.juzgado}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {especialista.telefono && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{especialista.telefono}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {especialista.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{especialista.email}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectEspecialista(especialista)
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
        
        {/* Footer con paginación */}
        {!loading && filteredEspecialistas.length > 0 && (
          <div className="px-6 py-3 border-t bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredEspecialistas.length)} de {filteredEspecialistas.length} especialistas
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-6 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-6 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}