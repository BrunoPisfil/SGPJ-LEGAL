"use client"

import { useState, useEffect } from "react"
import { Search, User, Building, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { clientesAPI, type Cliente } from "@/lib/clientes"

interface ClientSelectorProps {
  selectedClientId?: string
  onClientSelect: (cliente: Cliente) => void
  trigger?: React.ReactNode
}

// Datos de muestra mientras arreglamos el backend
const sampleClientes: Cliente[] = [
  {
    id: 1,
    tipo_persona: 'natural',
    nombres: 'Juan',
    apellidos: 'Pérez García',
    doc_tipo: 'DNI',
    doc_numero: '12345678',
    telefono: '987654321',
    email: 'juan@email.com',
    direccion: 'Av. Lima 123, Lima',
    activo: true,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    tipo_persona: 'natural',
    nombres: 'María',
    apellidos: 'López Rodríguez',
    doc_tipo: 'DNI',
    doc_numero: '87654321',
    telefono: '987654322',
    email: 'maria@email.com',
    direccion: 'Jr. Cusco 456, Lima',
    activo: true,
    created_at: '2024-01-02'
  },
  {
    id: 3,
    tipo_persona: 'juridica',
    razon_social: 'Comercial ABC S.A.C.',
    doc_tipo: 'RUC',
    doc_numero: '20123456789',
    telefono: '987654323',
    email: 'contacto@abc.com',
    direccion: 'Av. Industrial 789, Lima',
    activo: true,
    created_at: '2024-01-03'
  },
  {
    id: 4,
    tipo_persona: 'natural',
    nombres: 'Carlos',
    apellidos: 'Mendoza Silva',
    doc_tipo: 'DNI',
    doc_numero: '11223344',
    telefono: '987654324',
    email: 'carlos@email.com',
    direccion: 'Ca. Los Olivos 321, Lima',
    activo: true,
    created_at: '2024-01-04'
  },
  {
    id: 5,
    tipo_persona: 'juridica',
    razon_social: 'Inversiones XYZ E.I.R.L.',
    doc_tipo: 'RUC',
    doc_numero: '20987654321',
    telefono: '987654325',
    email: 'info@xyz.com',
    direccion: 'Av. Corporativa 654, Lima',
    activo: true,
    created_at: '2024-01-05'
  }
]

export function ClientSelector({ selectedClientId, onClientSelect, trigger }: ClientSelectorProps) {
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
          ? `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
          : cliente.razon_social || ''
        
        return nombreCompleto.toLowerCase().includes(query) ||
               cliente.doc_numero.toLowerCase().includes(query) ||
               (cliente.email && cliente.email.toLowerCase().includes(query)) ||
               (cliente.telefono && cliente.telefono.includes(query))
      })
      setFilteredClientes(filtered)
    }
  }, [searchQuery, clientes])

  const loadClientes = async () => {
    try {
      setLoading(true)
      
      // Cargar clientes desde la API
      const data = await clientesAPI.getAll()
      setClientes(data)
      setFilteredClientes(data)
    } catch (error) {
      console.error('Error loading clientes:', error)
      // Fallback a datos de muestra si falla
      setClientes(sampleClientes)
      setFilteredClientes(sampleClientes)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCliente = (cliente: Cliente) => {
    onClientSelect(cliente)
    setOpen(false)
    setSearchQuery("") // Limpiar búsqueda para la próxima vez
  }

  const selectedCliente = clientes.find(c => c.id.toString() === selectedClientId)

  const getNombreCompleto = (cliente: Cliente) => {
    return cliente.tipo_persona === 'natural' 
      ? `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
      : cliente.razon_social || ''
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <User className="mr-2 h-4 w-4" />
            {selectedCliente 
              ? `${getNombreCompleto(selectedCliente)} - ${selectedCliente.doc_numero}`
              : "Seleccionar cliente"
            }
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent 
        className="!max-w-[80vw] !w-[80vw] max-h-[80vh] flex flex-col p-0"
        style={{ 
          width: '80vw !important', 
          maxWidth: '80vw !important',
          minWidth: '80vw !important'
        }}
      >
        <DialogHeader className="px-6 pt-4 pb-1 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Seleccionar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, documento, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Cargando clientes...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No se encontraron clientes que coincidan con la búsqueda" : "No hay clientes disponibles"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClientes.map((cliente) => (
                      <TableRow 
                        key={cliente.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelectCliente(cliente)}
                      >
                        <TableCell>
                          {cliente.tipo_persona === 'natural' ? (
                            <User className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Building className="h-4 w-4 text-green-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getNombreCompleto(cliente)}</p>
                            {cliente.direccion && (
                              <p className="text-xs text-muted-foreground">{cliente.direccion}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {cliente.doc_tipo}: {cliente.doc_numero}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {cliente.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {cliente.email}
                              </div>
                            )}
                            {cliente.telefono && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {cliente.telefono}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cliente.tipo_persona === 'natural' ? 'default' : 'secondary'}>
                            {cliente.tipo_persona === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}