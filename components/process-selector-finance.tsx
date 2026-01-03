"use client"

import { useState, useEffect } from "react"
import { Search, Scale, Calendar, User, Building, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProcessStatusBadge } from "@/components/process-status-badge"
import { procesosAPI, type Proceso } from "@/lib/procesos"

interface ProcessSelectorProps {
  selectedProcessId?: string
  onProcessSelect: (proceso: Proceso) => void
  trigger?: React.ReactNode
}

// Datos de muestra mientras arreglamos el backend
const sampleProcesos: Proceso[] = [
  {
    id: 1,
    expediente: "2024-001",
    tipo: "Civil",
    demandantes: ["Juan Pérez García"],
    demandados: ["María López Rodríguez"],
    demandante: "Juan Pérez García",
    demandado: "María López Rodríguez",
    materia: "Civil - Obligación de dar suma de dinero",
    juzgado_nombre: "1° Juzgado Civil de Lima",
    juzgado: "1° Juzgado Civil de Lima",
    estado: "Activo",
    fecha_inicio: "2024-01-15",
    monto_pretension: 25000.00,
    abogado_responsable_id: 1,
    created_at: "2024-01-15",
    updated_at: "2024-01-15"
  },
  {
    id: 2,
    expediente: "2024-002",
    tipo: "Comercial",
    demandantes: ["Comercial ABC S.A.C."],
    demandados: ["Inversiones XYZ E.I.R.L."],
    demandante: "Comercial ABC S.A.C.",
    demandado: "Inversiones XYZ E.I.R.L.",
    materia: "Comercial - Incumplimiento de contrato",
    juzgado_nombre: "2° Juzgado Comercial de Lima",
    juzgado: "2° Juzgado Comercial de Lima",
    estado: "En trámite",
    fecha_inicio: "2024-02-01",
    monto_pretension: 80000.00,
    abogado_responsable_id: 1,
    created_at: "2024-02-01",
    updated_at: "2024-02-01"
  },
  {
    id: 3,
    expediente: "2024-003",
    tipo: "Civil",
    demandantes: ["Carlos Mendoza Silva"],
    demandados: ["Constructora DEF S.A."],
    demandante: "Carlos Mendoza Silva",
    demandado: "Constructora DEF S.A.",
    materia: "Civil - Responsabilidad civil contractual",
    juzgado_nombre: "3° Juzgado Civil de Lima",
    juzgado: "3° Juzgado Civil de Lima",
    estado: "Activo",
    fecha_inicio: "2024-02-15",
    monto_pretension: 120000.00,
    abogado_responsable_id: 1,
    created_at: "2024-02-15",
    updated_at: "2024-02-15"
  },
  {
    id: 4,
    expediente: "2024-004",
    tipo: "Comercial",
    demandantes: ["Ana García Torres"],
    demandados: ["Banco Nacional"],
    demandante: "Ana García Torres",
    demandado: "Banco Nacional",
    materia: "Comercial - Nulidad de contrato",
    juzgado_nombre: "1° Juzgado Comercial de Lima",
    juzgado: "1° Juzgado Comercial de Lima",
    estado: "Suspendido",
    fecha_inicio: "2024-03-01",
    monto_pretension: 45000.00,
    abogado_responsable_id: 1,
    created_at: "2024-03-01",
    updated_at: "2024-03-01"
  },
  {
    id: 5,
    expediente: "2024-005",
    tipo: "Comercial",
    demandantes: ["Transportes GHI S.R.L."],
    demandados: ["Logística JKL S.A.C."],
    demandante: "Transportes GHI S.R.L.",
    demandado: "Logística JKL S.A.C.",
    materia: "Comercial - Resolución de contrato",
    juzgado_nombre: "2° Juzgado Comercial de Lima",
    juzgado: "2° Juzgado Comercial de Lima",
    estado: "Activo",
    fecha_inicio: "2024-03-15",
    monto_pretension: 65000.00,
    abogado_responsable_id: 1,
    created_at: "2024-03-15",
    updated_at: "2024-03-15"
  }
]

export function ProcessSelectorFinance({ selectedProcessId, onProcessSelect, trigger }: ProcessSelectorProps) {
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
      const filtered = procesos.filter((proceso) => {
        return proceso.expediente.toLowerCase().includes(query) ||
               (proceso.demandante && proceso.demandante.toLowerCase().includes(query)) ||
               (proceso.demandado && proceso.demandado.toLowerCase().includes(query)) ||
               proceso.materia.toLowerCase().includes(query) ||
               (proceso.juzgado && proceso.juzgado.toLowerCase().includes(query))
      })
      setFilteredProcesos(filtered)
    }
  }, [searchQuery, procesos])

  const loadProcesos = async () => {
    try {
      setLoading(true)
      
      // Usar datos de muestra temporalmente
      await new Promise(resolve => setTimeout(resolve, 300)) // Simular carga
      setProcesos(sampleProcesos)
      setFilteredProcesos(sampleProcesos)
      
      // TODO: Reactivar cuando el backend esté funcionando
      /*
      const data = await procesosAPI.getAll({ activo: true })
      setProcesos(data)
      setFilteredProcesos(data)
      */
    } catch (error) {
      console.error('Error loading procesos:', error)
      // Fallback a datos de muestra
      setProcesos(sampleProcesos)
      setFilteredProcesos(sampleProcesos)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Scale className="mr-2 h-4 w-4" />
            {selectedProceso 
              ? `${selectedProceso.expediente} - ${selectedProceso.demandante} vs ${selectedProceso.demandado}`
              : "Seleccionar proceso"
            }
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent 
        className="!max-w-[85vw] !w-[85vw] max-h-[80vh] flex flex-col p-0"
        style={{ 
          width: '85vw !important', 
          maxWidth: '85vw !important',
          minWidth: '85vw !important'
        }}
      >
        <DialogHeader className="px-6 pt-4 pb-1 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5" />
            Seleccionar Proceso Judicial
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, partes, materia o juzgado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Cargando procesos...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Proceso</TableHead>
                    <TableHead>Partes</TableHead>
                    <TableHead>Materia</TableHead>
                    <TableHead>Juzgado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcesos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No se encontraron procesos que coincidan con la búsqueda" : "No hay procesos disponibles"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProcesos.map((proceso) => (
                      <TableRow 
                        key={proceso.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelectProceso(proceso)}
                      >
                        <TableCell>
                          <Scale className="h-4 w-4 text-blue-600" />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{proceso.expediente}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(proceso.fecha_inicio)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-green-600" />
                              <span className="font-medium">{proceso.demandante}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">vs</div>
                            <div className="flex items-center gap-1 text-sm">
                              <Building className="h-3 w-3 text-red-600" />
                              <span>{proceso.demandado}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {proceso.materia}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {proceso.juzgado}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {formatCurrency(proceso.monto_pretension || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ProcessStatusBadge 
                            status={proceso.estado} 
                            juridicalStatus={proceso.estado_juridico}
                          />
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