"use client"

import { useState, useEffect } from "react"
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Money } from "@/components/money"
import { ProcessStatusBadge } from "@/components/process-status-badge"
import { contratosAPI, Contrato } from "@/lib/contratos"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function FinanzasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"todos" | "pendientes" | "pagados">("todos")
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    completados: 0,
    monto_total: 0,
    monto_pagado: 0,
    monto_pendiente: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Cargar contratos y estadísticas
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log("🔄 Cargando contratos y estadísticas...")
      
      const [contratosData, statsData] = await Promise.all([
        contratosAPI.getAll(),
        contratosAPI.getStats()
      ])
      
      console.log("✅ Contratos cargados:", contratosData)
      console.log("✅ Estadísticas cargadas:", statsData)
      
      setContratos(contratosData)
      setStats(statsData)
    } catch (error) {
      console.error("❌ Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los contratos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar contratos según la pestaña activa y búsqueda
  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = !searchQuery || 
      contrato.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contrato.cliente_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contrato.proceso_expediente?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTab = activeTab === "todos" || 
      (activeTab === "pendientes" && contrato.estado === "activo") ||
      (activeTab === "pagados" && contrato.estado === "completado")
    
    return matchesSearch && matchesTab
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
            <p className="text-muted-foreground mt-1">Cargando contratos...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground mt-1">Gestiona contratos y pagos</p>
        </div>
        <Button asChild>
          <Link href="/finanzas/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contrato
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activos} activos, {stats.completados} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Money amount={stats.monto_total} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monto total de contratos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <Money amount={stats.monto_pagado} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.monto_total > 0 ? Math.round((stats.monto_pagado / stats.monto_total) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <Money amount={stats.monto_pendiente} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por cobrar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, expediente o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="todos">Todos ({contratos.length})</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes ({stats.activos})</TabsTrigger>
          <TabsTrigger value="pagados">Pagados ({stats.completados})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContratos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {contratos.length === 0 ? "No hay contratos registrados" : "No se encontraron contratos que coincidan con la búsqueda"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContratos.map((contrato) => {
                      const saldo = Number(contrato.monto_total) - Number(contrato.monto_pagado)
                      const progreso = Number(contrato.monto_total) > 0 ? (Number(contrato.monto_pagado) / Number(contrato.monto_total)) * 100 : 0

                      return (
                        <TableRow key={contrato.id}>
                          <TableCell className="font-medium">{contrato.codigo}</TableCell>
                          <TableCell>
                            {contrato.cliente_nombre || `Cliente #${contrato.cliente_id}`}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {contrato.proceso_expediente || `Proceso #${contrato.proceso_id}`}
                          </TableCell>
                          <TableCell>
                            <ProcessStatusBadge estado={contrato.estado} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money amount={Number(contrato.monto_total)} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money amount={Number(contrato.monto_pagado)} className="text-green-600" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Money amount={saldo} className={saldo > 0 ? "text-orange-600 font-semibold" : ""} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={progreso} className="w-20" />
                              <span className="text-xs text-muted-foreground">{progreso.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/finanzas/${contrato.id}`}>Ver</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
