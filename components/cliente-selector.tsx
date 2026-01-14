"use client"

import { useState, useEffect } from "react"
import { Search, User, FileText, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { clientesAPI, type Cliente } from "@/lib/clientes"

interface ClienteSelectorProps {
  selectedClienteId?: string
  onClienteSelect: (cliente: Cliente) => void
  trigger?: React.ReactNode
}

export function ClienteSelector({ selectedClienteId, onClienteSelect, trigger }: ClienteSelectorProps) {
  const [open, setOpen] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Cargar clientes cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadClientes()
    }
  }, [open])

  // Filtrar clientes cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClientes(clientes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = clientes.filter((cliente) => {
        const nombreCompleto = cliente.tipo_persona === 'natural' 
          ? `${cliente.nombres} ${cliente.apellidos}`.toLowerCase()
          : cliente.razon_social?.toLowerCase() || ""
        
        return nombreCompleto.includes(query) ||
               cliente.doc_numero.toLowerCase().includes(query) ||
               (cliente.email && cliente.email.toLowerCase().includes(query)) ||
               (cliente.telefono && cliente.telefono.toLowerCase().includes(query))
      })
      setFilteredClientes(filtered)
    }
  }, [searchQuery, clientes])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const data = await clientesAPI.getAll({ activo: true })
      setClientes(data)
      setFilteredClientes(data)
    } catch (error) {
      console.error('Error loading clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCliente = (cliente: Cliente) => {
    onClienteSelect(cliente)
    setOpen(false)
    setSearchQuery("") // Limpiar búsqueda para la próxima vez
  }

  const getClienteDisplayName = (cliente: Cliente) => {
    return cliente.tipo_persona === 'natural' 
      ? `${cliente.nombres} ${cliente.apellidos}`
      : cliente.razon_social || "Sin nombre"
  }

  const selectedCliente = clientes.find(c => c.id.toString() === selectedClienteId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <User className="mr-2 h-4 w-4" />
            {selectedCliente 
              ? getClienteDisplayName(selectedCliente)
              : "Seleccionar cliente"
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
            <User className="h-5 w-5" />
            Seleccionar Cliente
          </DialogTitle>
          <DialogDescription className="text-sm">Busca por nombre, documento, email o teléfono.</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-1 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, documento, email o teléfono..."
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
              onClick={() => setSearchQuery("natural")}
              className="h-7 px-2 text-xs"
            >
              Personas Naturales
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("juridica")}
              className="h-7 px-2 text-xs"
            >
              Personas Jurídicas
            </Button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-2 min-h-0">
          <ScrollArea className="h-[50vh] max-h-[400px] w-full">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Cargando clientes...</div>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No se encontraron clientes" : "No hay clientes disponibles"}
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
                        <TableHead className="w-[25%] py-2 text-xs font-medium">Nombre/Razón Social</TableHead>
                        <TableHead className="w-[15%] py-2 text-xs font-medium">Tipo</TableHead>
                        <TableHead className="w-[15%] py-2 text-xs font-medium">Documento</TableHead>
                        <TableHead className="w-[20%] py-2 text-xs font-medium">Contacto</TableHead>
                        <TableHead className="w-[20%] py-2 text-xs font-medium">Email</TableHead>
                        <TableHead className="w-[5%] py-2 text-xs font-medium">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientes.map((cliente) => (
                        <TableRow 
                          key={cliente.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSelectCliente(cliente)}
                        >
                          <TableCell className="font-medium py-2">
                            <div>
                              <p className="font-medium text-sm">{getClienteDisplayName(cliente)}</p>
                              <p className="text-xs text-muted-foreground capitalize">{cliente.tipo_persona}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{cliente.tipo_persona === 'natural' ? 'Natural' : 'Jurídica'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-xs">
                              <p className="font-medium">{cliente.doc_tipo}</p>
                              <p className="text-muted-foreground">{cliente.doc_numero}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {cliente.telefono && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{cliente.telefono}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {cliente.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{cliente.email}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectCliente(cliente)
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
                {filteredClientes.length === 0 ? (
                  searchQuery ? "No se encontraron clientes" : "No hay clientes disponibles"
                ) : searchQuery ? (
                  `${filteredClientes.length} de ${clientes.length} clientes encontrados`
                ) : (
                  `${clientes.length} clientes disponibles`
                )}
              </p>
              {filteredClientes.length > 10 && (
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