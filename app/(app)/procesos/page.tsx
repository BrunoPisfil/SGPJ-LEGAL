"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, FileText, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProcessStatusBadge } from "@/components/process-status-badge"
import { EmptyState } from "@/components/empty-state"
import { procesosAPI, Proceso, EstadoProceso } from "@/lib/procesos"
import { formatDate, daysBetween } from "@/lib/format"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { usePermission } from "@/hooks/use-permission"

export default function ProcesosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<EstadoProceso[]>([])
  const [procesos, setProcesos] = useState<Proceso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { hasPermission } = usePermission()

  // Cargar procesos al montar el componente
  useEffect(() => {
    loadProcesos()
  }, [])

  const loadProcesos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await procesosAPI.getAll({ limit: 100 })
      setProcesos(data)
    } catch (err) {
      console.error('Error loading procesos:', err)
      setError('Error al cargar los procesos')
      toast({
        title: "Error",
        description: "No se pudieron cargar los procesos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReviewed = async (procesoId: number, expediente: string) => {
    try {
      await procesosAPI.markAsReviewed(procesoId)
      
      // Actualizar el proceso en el estado local
      setProcesos(prev => prev.map(p => 
        p.id === procesoId 
          ? { ...p, fecha_ultima_revision: new Date().toISOString().split('T')[0] }
          : p
      ))
      
      toast({
        title: "Proceso marcado como revisado",
        description: `El expediente ${expediente} ha sido actualizado con la fecha de hoy.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar el proceso como revisado",
        variant: "destructive",
      })
    }
  }

  const getReviewAlert = (fecha_ultima_revision?: string) => {
    if (!fecha_ultima_revision) {
      return { type: "critical", days: null, message: "Sin revisión" }
    }
    const days = daysBetween(new Date(fecha_ultima_revision))
    if (days >= 30) {
      return { type: "critical", days, message: `${days} días sin revisión` }
    } else if (days >= 25) {
      return { type: "warning", days, message: `${days} días sin revisión` }
    }
    return { type: "ok", days, message: null }
  }

  const filteredProcesses = procesos.filter((proceso) => {
    const matchesSearch =
      searchQuery === "" ||
      proceso.expediente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proceso.demandante && proceso.demandante.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (proceso.demandado && proceso.demandado.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(proceso.estado)

    return matchesSearch && matchesStatus
  })

  const toggleStatus = (status: EstadoProceso) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Procesos Judiciales</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestiona todos los procesos legales</p>
        </div>
        {hasPermission("procesos", "create") && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/procesos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proceso
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por expediente, demandante o demandado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm sm:text-base"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Estado
                {selectedStatuses.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedStatuses.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("Activo")}
                onCheckedChange={() => toggleStatus("Activo")}
              >
                Activo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("En trámite")}
                onCheckedChange={() => toggleStatus("En trámite")}
              >
                En trámite
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("Suspendido")}
                onCheckedChange={() => toggleStatus("Suspendido")}
              >
                Suspendido
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("Archivado")}
                onCheckedChange={() => toggleStatus("Archivado")}
              >
                Archivado
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes("Finalizado")}
                onCheckedChange={() => toggleStatus("Finalizado")}
              >
                Finalizado
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filters */}
        {selectedStatuses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs sm:text-sm text-muted-foreground">Filtros activos:</span>
            {selectedStatuses.map((status) => (
              <Badge key={status} variant="secondary" className="cursor-pointer text-xs sm:text-sm" onClick={() => toggleStatus(status)}>
                {status.replace("_", " ")}
                <span className="ml-1">×</span>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setSelectedStatuses([])} className="h-6 text-xs">
              Limpiar
            </Button>
          </div>
        )}
      </Card>

      {/* Loading state */}
      {loading ? (
        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-muted-foreground">Cargando procesos...</p>
            </div>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6 sm:p-8">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Error al cargar procesos</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadProcesos} variant="outline">
              Reintentar
            </Button>
          </div>
        </Card>
      ) : filteredProcesses.length === 0 ? (
        <Card className="p-6 sm:p-8">
          <EmptyState
            icon={FileText}
            title="No se encontraron procesos"
            description={procesos.length === 0 ? "No hay procesos registrados aún" : "No hay procesos que coincidan con los filtros seleccionados"}
            action={{
              label: "Crear nuevo proceso",
              onClick: () => (window.location.href = "/procesos/nuevo"),
            }}
          />
        </Card>
      ) : (
        <Card className="w-full p-0 overflow-x-auto">
          <div className="w-full inline-block min-w-full">
            <Table className="text-xs sm:text-sm w-full" style={{ tableLayout: 'fixed' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-1 sm:p-2 overflow-hidden text-ellipsis w-[80px] sm:w-[120px]">Expediente</TableHead>
                  <TableHead className="hidden sm:table-cell p-1 sm:p-2 overflow-hidden text-ellipsis w-[100px]">Materia</TableHead>
                  <TableHead className="hidden md:table-cell p-1 sm:p-2 overflow-hidden text-ellipsis w-[120px]">Demandante</TableHead>
                  <TableHead className="hidden md:table-cell p-1 sm:p-2 overflow-hidden text-ellipsis w-[120px]">Demandado</TableHead>
                  <TableHead className="p-1 sm:p-2 overflow-hidden text-ellipsis w-[100px]">Estados</TableHead>
                  <TableHead className="hidden sm:table-cell p-1 sm:p-2 overflow-hidden text-ellipsis w-[100px]">Revisión</TableHead>
                  <TableHead className="p-1 sm:p-2 text-right overflow-hidden text-ellipsis w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcesses.map((proceso) => {
                  const reviewAlert = getReviewAlert(proceso.fecha_ultima_revision)
                  return (
                    <TableRow key={proceso.id}>
                      <TableCell className="p-1 sm:p-2 font-medium overflow-hidden text-ellipsis">{proceso.expediente}</TableCell>
                      <TableCell className="hidden sm:table-cell p-1 sm:p-2 overflow-hidden text-ellipsis">{proceso.materia}</TableCell>
                      <TableCell className="hidden md:table-cell p-1 sm:p-2 overflow-hidden text-ellipsis">{proceso.demandante}</TableCell>
                      <TableCell className="hidden md:table-cell p-1 sm:p-2 overflow-hidden text-ellipsis">{proceso.demandado}</TableCell>
                      <TableCell className="p-1 sm:p-2">
                        <ProcessStatusBadge 
                          status={proceso.estado} 
                          juridicalStatus={proceso.estado_juridico}
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-1 sm:p-2">
                        {proceso.fecha_ultima_revision ? (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Revisado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Sin revisar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm h-8 sm:h-9">
                            <Link href={`/procesos/${proceso.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
