"use client"

import { useState, useEffect } from "react"
import { Search, Briefcase, Phone, Mail, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import directorioAPI, { type DirectorioEntry } from "@/lib/directorio"

interface Abogado {
  id: number
  nombres: string
  apellidos: string
  colegiatura?: string
  especialidad: string
  telefono?: string
  email?: string
}

interface AbogadoSelectorProps {
  selectedAbogadoId?: string
  onAbogadoSelect: (abogado: Abogado) => void
  trigger?: React.ReactNode
}

export function AbogadoSelector({ selectedAbogadoId, onAbogadoSelect, trigger }: AbogadoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [abogados, setAbogados] = useState<Abogado[]>([])
  const [filteredAbogados, setFilteredAbogados] = useState<Abogado[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Cargar abogados cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadAbogados()
    }
  }, [open])

  // Filtrar abogados cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAbogados(abogados)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = abogados.filter((abogado) => {
        const nombreCompleto = `${abogado.nombres} ${abogado.apellidos}`.toLowerCase()
        return nombreCompleto.includes(query) ||
               abogado.especialidad.toLowerCase().includes(query) ||
               (abogado.colegiatura && abogado.colegiatura.toLowerCase().includes(query)) ||
               (abogado.email && abogado.email.toLowerCase().includes(query))
      })
      setFilteredAbogados(filtered)
    }
  }, [searchQuery, abogados])

  const loadAbogados = async () => {
    try {
      setLoading(true)
      // Llamar a la API real para obtener abogados (usando directorioAPI con filtro tipo cliente)
      // Alternativa: podrías tener un endpoint específico /directorio/abogados si existe
      const data = await directorioAPI.getAll(0, 500, 'cliente')
      
      // Transformar DirectorioEntry a Abogado (filtrando por tipo_persona = juridica o específicos)
      const abogadosFormateados: Abogado[] = data
        .filter(entry => entry.nombres && entry.apellidos) // Filtrar abogados reales (con nombres/apellidos)
        .map((entry: DirectorioEntry) => ({
          id: entry.id,
          nombres: entry.nombres || "",
          apellidos: entry.apellidos || "",
          colegiatura: entry.numero_colegiado,
          especialidad: entry.especialidad || "General",
          telefono: entry.telefono,
          email: entry.email,
        }))
      
      setAbogados(abogadosFormateados)
      setFilteredAbogados(abogadosFormateados)
    } catch (error) {
      console.error('Error loading abogados:', error)
      setAbogados([])
      setFilteredAbogados([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAbogado = (abogado: Abogado) => {
    onAbogadoSelect(abogado)
    setOpen(false)
    setSearchQuery("") // Limpiar búsqueda para la próxima vez
  }

  const getAbogadoDisplayName = (abogado: Abogado) => {
    return `${abogado.nombres} ${abogado.apellidos}`
  }

  const selectedAbogado = abogados.find(a => a.id.toString() === selectedAbogadoId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Briefcase className="mr-2 h-4 w-4" />
            {selectedAbogado 
              ? getAbogadoDisplayName(selectedAbogado)
              : "Seleccionar abogado responsable"
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
            <Briefcase className="h-5 w-5" />
            Seleccionar Abogado Responsable
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-1 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, especialidad, colegiatura o email..."
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
              onClick={() => setSearchQuery("Penal")}
              className="h-7 px-2 text-xs"
            >
              Penal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("Familia")}
              className="h-7 px-2 text-xs"
            >
              Familia
            </Button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-2 min-h-0">
          <ScrollArea className="h-[50vh] max-h-[400px] w-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Cargando abogados...</div>
              </div>
            ) : filteredAbogados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron abogados" : "No hay abogados disponibles"}
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
                        <TableHead className="w-[15%] py-2 text-xs font-medium">Colegiatura</TableHead>
                        <TableHead className="w-[20%] py-2 text-xs font-medium">Especialidad</TableHead>
                        <TableHead className="w-[15%] py-2 text-xs font-medium">Teléfono</TableHead>
                        <TableHead className="w-[20%] py-2 text-xs font-medium">Email</TableHead>
                        <TableHead className="w-[5%] py-2 text-xs font-medium">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAbogados.map((abogado) => (
                        <TableRow 
                          key={abogado.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSelectAbogado(abogado)}
                        >
                          <TableCell className="font-medium py-2">
                            <div>
                              <p className="font-medium text-sm">{getAbogadoDisplayName(abogado)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {abogado.colegiatura && (
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs">{abogado.colegiatura}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{abogado.especialidad}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {abogado.telefono && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{abogado.telefono}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {abogado.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{abogado.email}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectAbogado(abogado)
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
                {filteredAbogados.length === 0 ? (
                  searchQuery ? "No se encontraron abogados" : "No hay abogados disponibles"
                ) : searchQuery ? (
                  `${filteredAbogados.length} de ${abogados.length} abogados encontrados`
                ) : (
                  `${abogados.length} abogados disponibles`
                )}
              </p>
              {filteredAbogados.length > 10 && (
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