"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ClientSelector } from "@/components/client-selector"
import { ProcessSelectorFinance } from "@/components/process-selector-finance"
import { contratosAPI, generateContratoCode } from "@/lib/contratos"
import type { Cliente } from "@/lib/clientes"
import type { Proceso } from "@/lib/procesos"

export default function NuevoContratoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)
  const [formData, setFormData] = useState({
    montoTotal: "",
    montoPagado: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!selectedCliente || !selectedProceso || !formData.montoTotal) {
      toast({
        title: "Error de validación",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    const montoTotal = Number.parseFloat(formData.montoTotal)
    const montoPagado = Number.parseFloat(formData.montoPagado || "0")

    if (montoTotal <= 0) {
      toast({
        title: "Error de validación",
        description: "El monto total debe ser mayor a 0",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (montoPagado > montoTotal) {
      toast({
        title: "Error de validación",
        description: "El monto pagado no puede ser mayor al monto total",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Crear el contrato en la base de datos
      const contratoData = {
        cliente_id: selectedCliente.id,
        proceso_id: selectedProceso.id,
        monto_total: montoTotal,
        monto_pagado: montoPagado,
        estado: 'activo' as const
      }
      
      console.log('📝 Datos a enviar:', contratoData)
      console.log('🌐 URL de API:', 'http://localhost:8001/api/v1/finanzas/contratos')
      
      const nuevoContrato = await contratosAPI.create(contratoData)
      
      console.log('✅ Respuesta del servidor:', nuevoContrato)

      // Verificar que la respuesta sea válida
      if (nuevoContrato && (nuevoContrato.codigo || nuevoContrato.id)) {
        toast({
          title: "Contrato creado exitosamente",
          description: `Se ha registrado el contrato ${nuevoContrato.codigo || `ID: ${nuevoContrato.id}`}`,
        })

        // Redirigir al listado de finanzas
        router.push("/finanzas")
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
      
    } catch (error) {
      console.error('❌ Error al crear contrato:', error)
      
      // Mostrar error específico si está disponible
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      toast({
        title: "Error al crear contrato",
        description: `No se pudo guardar el contrato: ${errorMessage}`,
        variant: "destructive",
      })
      
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/finanzas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Contrato</h1>
          <p className="text-muted-foreground mt-1">Registra un nuevo contrato de servicios legales</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Contrato</CardTitle>
            <CardDescription>Complete los datos del contrato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cliente */}
            <div className="space-y-2">
              <Label>
                Cliente <span className="text-destructive">*</span>
              </Label>
              <ClientSelector
                selectedClientId={selectedCliente?.id.toString()}
                onClientSelect={(cliente) => {
                  console.log('Cliente seleccionado:', cliente)
                  setSelectedCliente(cliente)
                }}
              />
            </div>

            {/* Proceso */}
            <div className="space-y-2">
              <Label>
                Proceso Legal <span className="text-destructive">*</span>
              </Label>
              <ProcessSelectorFinance
                selectedProcessId={selectedProceso?.id.toString()}
                onProcessSelect={(proceso) => {
                  console.log('Proceso seleccionado:', proceso)
                  setSelectedProceso(proceso)
                }}
              />
            </div>

            {/* Montos */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="montoTotal">
                  Monto Total (S/) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="montoTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.montoTotal}
                  onChange={(e) => setFormData({ ...formData, montoTotal: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montoPagado">Monto Inicial Pagado (S/)</Label>
                <Input
                  id="montoPagado"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.montoPagado}
                  onChange={(e) => setFormData({ ...formData, montoPagado: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Opcional: ingrese si ya hay un pago inicial</p>
              </div>
            </div>

            {/* Preview */}
            {formData.montoTotal && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monto Total:</span>
                      <span className="font-semibold">
                        S/ {Number.parseFloat(formData.montoTotal || "0").toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pagado:</span>
                      <span className="font-semibold text-green-600">
                        S/ {Number.parseFloat(formData.montoPagado || "0").toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Saldo Pendiente:</span>
                      <span className="font-bold text-orange-600">
                        S/{" "}
                        {(
                          Number.parseFloat(formData.montoTotal || "0") - Number.parseFloat(formData.montoPagado || "0")
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push("/finanzas")} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Crear Contrato"}
          </Button>
        </div>
      </form>
    </div>
  )
}
