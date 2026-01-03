"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Plus, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { Money } from "@/components/money"
import { ProcessStatusBadge } from "@/components/process-status-badge"
import { contratosAPI, Contrato } from "@/lib/contratos"
import { pagosAPI, Pago as PagoAPI } from "@/lib/pagos"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Usar el tipo del API
type Pago = PagoAPI;

export default function ContratoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPagoDialog, setShowPagoDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])

  const [pagoData, setPagoData] = useState({
    monto: "",
    notas: "",
    medio: "transferencia",
    referencia: "",
  })

  // Cargar datos del contrato
  useEffect(() => {
    loadContrato()
    loadPagos()
  }, [params.id])

  const loadContrato = async () => {
    try {
      setLoading(true)
      const contratoId = Number(params.id)
      
      if (isNaN(contratoId)) {
        throw new Error("ID de contrato inválido")
      }
      
      console.log("🔄 Cargando contrato ID:", contratoId)
      const contratoData = await contratosAPI.getById(contratoId)
      
      console.log("✅ Contrato cargado:", contratoData)
      setContrato(contratoData)
    } catch (error) {
      console.error("❌ Error cargando contrato:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el contrato",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPagos = async () => {
    try {
      const contratoId = Number(params.id)
      
      if (isNaN(contratoId)) {
        return
      }
      
      console.log("🔄 Cargando pagos para contrato ID:", contratoId)
      const pagosData = await pagosAPI.getByContrato(contratoId)
      
      console.log("✅ Pagos cargados:", pagosData)
      setPagos(pagosData)
    } catch (error) {
      console.error("❌ Error cargando pagos:", error)
      // No mostrar error toast para pagos, ya que puede ser normal que no haya pagos
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Cargando contrato...</h2>
        </div>
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Contrato no encontrado</h2>
          <Button className="mt-4" asChild>
            <Link href="/finanzas">Volver a Finanzas</Link>
          </Button>
        </div>
      </div>
    )
  }

  const saldo = Number(contrato.monto_total) - Number(contrato.monto_pagado)
  const progreso = Number(contrato.monto_total) > 0 ? (Number(contrato.monto_pagado) / Number(contrato.monto_total)) * 100 : 0

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      console.log("🗑️ Eliminando contrato ID:", contrato.id)
      
      await contratosAPI.delete(contrato.id)
      
      toast({
        title: "Contrato eliminado",
        description: "El contrato ha sido eliminado exitosamente",
      })
      router.push("/finanzas")
    } catch (error) {
      console.error("❌ Error eliminando contrato:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el contrato",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const handleRegistrarPago = async () => {
    if (!pagoData.monto || Number.parseFloat(pagoData.monto) <= 0) {
      toast({
        title: "Error de validación",
        description: "Ingrese un monto válido",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(pagoData.monto) > saldo) {
      toast({
        title: "Error de validación",
        description: "El monto no puede ser mayor al saldo pendiente",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      console.log("💳 Registrando pago:", pagoData)
      
      const pagoCreate = {
        monto: Number.parseFloat(pagoData.monto),
        medio: pagoData.medio,
        referencia: pagoData.referencia || undefined,
        notas: pagoData.notas || undefined
      }
      
      const nuevoPago = await pagosAPI.create(contrato!.id, pagoCreate)
      
      console.log("✅ Pago registrado:", nuevoPago)
      
      toast({
        title: "Pago registrado",
        description: `Se registró el pago de $${pagoData.monto} exitosamente`,
      })
      
      // Limpiar formulario
      setPagoData({ monto: "", notas: "", medio: "transferencia", referencia: "" })
      setShowPagoDialog(false)
      
      // Recargar datos
      await loadContrato()  // Para actualizar el saldo
      await loadPagos()     // Para mostrar el nuevo pago
      
    } catch (error) {
      console.error("❌ Error registrando pago:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/finanzas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{contrato.codigo}</h1>
              <ProcessStatusBadge estado={contrato.estado} />
            </div>
            <p className="text-muted-foreground mt-1">
              {contrato.cliente_nombre || `Cliente #${contrato.cliente_id}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {saldo > 0 && (
            <Button onClick={() => setShowPagoDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Money amount={Number(contrato.monto_total)} className="text-2xl font-bold" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <Money amount={Number(contrato.monto_pagado)} className="text-2xl font-bold text-green-600" />
            <p className="text-xs text-muted-foreground mt-1">{progreso.toFixed(1)}% del total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <Money amount={saldo} className="text-2xl font-bold text-orange-600" />
            <p className="text-xs text-muted-foreground mt-1">{(100 - progreso).toFixed(1)}% pendiente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progreso.toFixed(1)}%</div>
            <Progress value={progreso} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Contract Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-medium mt-1">{contrato.codigo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="mt-1">
                <ProcessStatusBadge estado={contrato.estado} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <div className="mt-1">
                <p className="font-medium">{contrato.cliente_nombre || `Cliente #${contrato.cliente_id}`}</p>
                {contrato.cliente_documento && (
                  <p className="text-sm text-muted-foreground">{contrato.cliente_documento}</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expediente</p>
              <div className="mt-1">
                <p className="font-mono text-sm font-medium">
                  {contrato.proceso_expediente || `Proceso #${contrato.proceso_id}`}
                </p>
                {contrato.proceso_demandante && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <p><strong>Demandante:</strong> {contrato.proceso_demandante}</p>
                    {contrato.proceso_demandado && (
                      <p><strong>Demandado:</strong> {contrato.proceso_demandado}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium mt-1">
                {new Date(contrato.fecha_creacion).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {contrato.notas && (
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="font-medium mt-1 text-sm">{contrato.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monto Total:</span>
              <Money amount={Number(contrato.monto_total)} className="font-semibold" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Pagado:</span>
              <Money amount={Number(contrato.monto_pagado)} className="font-semibold text-green-600" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-muted-foreground">Saldo Pendiente:</span>
              <Money amount={saldo} className="font-bold text-orange-600" />
            </div>
            <div className="pt-2">
              <Progress value={progreso} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-center">{progreso.toFixed(1)}% completado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {pagos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay pagos registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>{new Date(pago.fecha_pago).toLocaleDateString("es-PE")}</TableCell>
                    <TableCell>{pago.notas || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{pago.medio}</Badge>
                    </TableCell>
                    <TableCell>{pago.referencia || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Money amount={pago.monto} className="font-semibold text-green-600" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar contrato?"
        description="Esta acción no se puede deshacer. El contrato y todo su historial de pagos serán eliminados permanentemente."
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
      />

      {/* Register Payment Dialog */}
      <Dialog open={showPagoDialog} onOpenChange={setShowPagoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>Ingrese los detalles del pago recibido</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="monto">
                Monto (S/) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                max={saldo}
                placeholder="0.00"
                value={pagoData.monto}
                onChange={(e) => setPagoData({ ...pagoData, monto: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Saldo pendiente: S/ {saldo.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medio">
                Método de Pago <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={pagoData.medio} 
                onValueChange={(value) => setPagoData({ ...pagoData, medio: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Pago en Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="yape/plin">Yape/Plin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                placeholder="Ej: Nº de operación, voucher, etc."
                value={pagoData.referencia}
                onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Input
                id="notas"
                placeholder="Ej: Pago parcial, Cuota 1, etc."
                value={pagoData.notas}
                onChange={(e) => setPagoData({ ...pagoData, notas: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPagoDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPago} disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
