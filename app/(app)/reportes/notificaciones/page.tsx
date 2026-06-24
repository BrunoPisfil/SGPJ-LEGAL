"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Bell, Download, RefreshCw, TrendingUp, CheckCircle,
  Clock, AlertCircle, BarChart2, Filter, Calendar,
  ShieldAlert, ChevronLeft, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { notificacionesAPI, Notificacion } from "@/lib/notificaciones"
import { formatDate } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

// ── Constantes ────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10

const TIPO_LABELS: Record<string, string> = {
  audiencia_programada:    "Audiencia programada",
  audiencia_recordatorio:  "Recordatorio audiencia",
  diligencia_recordatorio: "Recordatorio diligencia",
  proceso_actualizado:     "Proceso actualizado",
  vencimiento_plazo:       "Vencimiento de plazo",
  sistema:                 "Sistema",
}

const ESTADO_CONFIG: Record<string, { label: string; variant: "default"|"secondary"|"destructive"|"outline"; icon: React.ReactNode }> = {
  ENVIADO:   { label: "Enviado",   variant: "default",     icon: <CheckCircle className="h-3 w-3" /> },
  PENDIENTE: { label: "Pendiente", variant: "secondary",   icon: <Clock className="h-3 w-3" /> },
  ERROR:     { label: "Error",     variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
  LEIDO:     { label: "Leído",     variant: "outline",     icon: <CheckCircle className="h-3 w-3" /> },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcularResumen(n: Notificacion[]) {
  const total      = n.length
  const enviadas   = n.filter(x => ["ENVIADO","LEIDO"].includes(x.estado?.toUpperCase())).length
  const pendientes = n.filter(x => x.estado?.toUpperCase() === "PENDIENTE").length
  const errores    = n.filter(x => x.estado?.toUpperCase() === "ERROR").length
  return { total, enviadas, pendientes, errores, tasaExito: total > 0 ? Math.round((enviadas/total)*100) : 0 }
}

function agruparPorTipo(notificaciones: Notificacion[]) {
  const conteo: Record<string, number> = {}
  notificaciones.forEach(n => { const t = TIPO_LABELS[n.tipo] ?? n.tipo; conteo[t] = (conteo[t]??0)+1 })
  const total = notificaciones.length || 1
  return Object.entries(conteo)
    .map(([tipo, cantidad]) => ({ tipo, cantidad, porcentaje: Math.round((cantidad/total)*100) }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

function exportarCSV(notificaciones: Notificacion[]) {
  const enc = ["ID","Título","Tipo","Canal","Estado","Destinatario","Fecha creación","Fecha envío"]
  const filas = notificaciones.map(n => [
    n.id, `"${(n.titulo??"").replace(/"/g,'""')}"`,
    TIPO_LABELS[n.tipo]??n.tipo, n.canal, n.estado,
    n.email_destinatario??n.destinatario??"",
    n.created_at ? formatDate(n.created_at) : "",
    n.fecha_enviada ? formatDate(n.fecha_enviada) : "",
  ])
  const csv = [enc.join(","), ...filas.map(f=>f.join(","))].join("\n")
  const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = `reporte-notificaciones-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function Barra({ valor, color="bg-primary" }: { valor:number; color?:string }) {
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width:`${valor}%` }} />
    </div>
  )
}

function TarjetaStat({ titulo, valor, sub, icon, color }: { titulo:string; valor:string|number; sub?:string; icon:React.ReactNode; color:string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{titulo}</p>
            <p className="text-3xl font-bold tracking-tight">{valor}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function AccesoDenegado() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="p-4 rounded-full bg-destructive/10">
        <ShieldAlert className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold">Acceso restringido</h2>
      <p className="text-muted-foreground max-w-sm">Este módulo de reportes es exclusivo para administradores.</p>
      <Button variant="outline" onClick={() => router.back()}>Volver</Button>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ReporteNotificacionesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [isLoading, setIsLoading]           = useState(true)
  const [filtroEstado, setFiltroEstado]     = useState("todos")
  const [filtroTipo, setFiltroTipo]         = useState("todos")
  const [busqueda, setBusqueda]             = useState("")
  const [ordenCampo, setOrdenCampo]         = useState<keyof Notificacion>("created_at")
  const [ordenDir, setOrdenDir]             = useState<"asc"|"desc">("desc")
  const [currentPage, setCurrentPage]       = useState(1)
  const { toast } = useToast()

  const esAdmin = user?.rol?.toLowerCase() === "admin"

  const cargar = useCallback(async () => {
    try {
      setIsLoading(true)
      const resp = await notificacionesAPI.getAll({ limit: 500 })
      setNotificaciones(resp.notificaciones ?? [])
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las notificaciones.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { if (esAdmin) cargar() }, [esAdmin, cargar])

  // Resetear página al cambiar filtros
  useEffect(() => { setCurrentPage(1) }, [filtroEstado, filtroTipo, busqueda])

  // Filtrado y ordenado con useMemo para evitar recálculos
  const filtradas = useMemo(() => notificaciones.filter(n => {
    const eOk = filtroEstado === "todos" || n.estado?.toUpperCase() === filtroEstado.toUpperCase()
    const tOk = filtroTipo   === "todos" || n.tipo === filtroTipo
    const bOk = !busqueda ||
      n.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.mensaje?.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.email_destinatario?.toLowerCase().includes(busqueda.toLowerCase())
    return eOk && tOk && bOk
  }), [notificaciones, filtroEstado, filtroTipo, busqueda])

  const ordenadas = useMemo(() => [...filtradas].sort((a, b) => {
    const va = String(a[ordenCampo]??""), vb = String(b[ordenCampo]??"")
    return ordenDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
  }), [filtradas, ordenCampo, ordenDir])

  // Paginación
  const totalPages  = Math.ceil(ordenadas.length / ITEMS_PER_PAGE)
  const startIndex  = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex    = startIndex + ITEMS_PER_PAGE
  const paginadas   = ordenadas.slice(startIndex, endIndex)

  const toggleOrden = (campo: keyof Notificacion) => {
    if (ordenCampo === campo) setOrdenDir(d => d==="asc"?"desc":"asc")
    else { setOrdenCampo(campo); setOrdenDir("asc") }
    setCurrentPage(1)
  }

  const resumen = useMemo(() => calcularResumen(notificaciones), [notificaciones])
  const porTipo = useMemo(() => agruparPorTipo(notificaciones), [notificaciones])

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (!esAdmin) return <AccesoDenegado />

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart2 className="h-7 w-7 text-primary" />
            Reporte de Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">Análisis y detalle de todas las notificaciones del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cargar} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualizar
          </Button>
          <Button size="sm" onClick={() => exportarCSV(ordenadas)} disabled={ordenadas.length === 0}>
            <Download className="h-4 w-4 mr-2" />Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaStat titulo="Total" valor={resumen.total} sub="Registro completo"
          icon={<Bell className="h-5 w-5 text-primary" />} color="bg-primary/10" />
        <TarjetaStat titulo="Enviadas / Leídas" valor={resumen.enviadas} sub={`${resumen.tasaExito}% tasa de éxito`}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />} color="bg-green-100 dark:bg-green-900/30" />
        <TarjetaStat titulo="Pendientes" valor={resumen.pendientes} sub="En cola"
          icon={<Clock className="h-5 w-5 text-yellow-600" />} color="bg-yellow-100 dark:bg-yellow-900/30" />
        <TarjetaStat titulo="Con error" valor={resumen.errores} sub="Requieren revisión"
          icon={<AlertCircle className="h-5 w-5 text-red-600" />} color="bg-red-100 dark:bg-red-900/30" />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por tipo</CardTitle>
            <CardDescription>Volumen por categoría</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {porTipo.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
            {porTipo.map(g => (
              <div key={g.tipo} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[70%]">{g.tipo}</span>
                  <span className="text-muted-foreground tabular-nums">{g.cantidad} ({g.porcentaje}%)</span>
                </div>
                <Barra valor={g.porcentaje} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado general</CardTitle>
            <CardDescription>Proporción de estados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label:"Enviadas / Leídas", valor:resumen.enviadas,   color:"bg-green-500"  },
              { label:"Pendientes",        valor:resumen.pendientes, color:"bg-yellow-400" },
              { label:"Con error",         valor:resumen.errores,    color:"bg-red-500"    },
            ].map(item => {
              const pct = resumen.total > 0 ? Math.round((item.valor/resumen.total)*100) : 0
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground tabular-nums">{item.valor} ({pct}%)</span>
                  </div>
                  <Barra valor={pct} color={item.color} />
                </div>
              )
            })}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">Tasa de éxito: {resumen.tasaExito}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <Input placeholder="Buscar por título, mensaje o destinatario..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} className="flex-1" />
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="LEIDO">Leído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {Object.entries(TIPO_LABELS).map(([val,label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de notificaciones</CardTitle>
          <CardDescription>Clic en los encabezados para ordenar</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:text-foreground select-none w-16"
                    onClick={() => toggleOrden("id")}>
                    ID {ordenCampo==="id" ? (ordenDir==="asc"?"↑":"↓") : ""}
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleOrden("titulo")}>
                    Título {ordenCampo==="titulo" ? (ordenDir==="asc"?"↑":"↓") : ""}
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead className="cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleOrden("created_at")}>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Creado {ordenCampo==="created_at" ? (ordenDir==="asc"?"↑":"↓") : ""}
                    </div>
                  </TableHead>
                  <TableHead>Enviado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No hay notificaciones que coincidan con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : paginadas.map(n => {
                  const cfg = ESTADO_CONFIG[n.estado?.toUpperCase()??""] ?? { label:n.estado, variant:"outline" as const, icon:null }
                  return (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">#{n.id}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="font-medium text-sm truncate">{n.titulo}</p>
                        {n.expediente && <p className="text-xs text-muted-foreground font-mono">{n.expediente}</p>}
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{TIPO_LABELS[n.tipo]??n.tipo}</span></TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1 text-xs">
                          {cfg.icon}{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {n.email_destinatario??n.destinatario??"—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {n.created_at ? formatDate(n.created_at) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {n.fecha_enviada ? formatDate(n.fecha_enviada) : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {ordenadas.length === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, ordenadas.length)} de {ordenadas.length} notificaciones
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                return (
                  <Button key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}>
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button variant="outline" size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
