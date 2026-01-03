"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader } from "lucide-react"
import { Money } from "@/components/money"
import { useState, useEffect } from "react"
import { contratosAPI } from "@/lib/contratos"

export function TopDebtsCard() {
  const [topDebts, setTopDebts] = useState<any[]>([])
  const [totalDeuda, setTotalDeuda] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDebts()
  }, [])

  const loadDebts = async () => {
    try {
      setLoading(true)
      // Cargar contratos directamente (es la fuente de verdad para deudas)
      const contratos = await contratosAPI.getAll()

      // Mapear contratos a deudas y filtrar por saldo pendiente
      const debts = contratos
        .map((contrato) => ({
          contrato_id: contrato.id,
          codigo: contrato.codigo,
          clienteNombre: contrato.cliente_nombre || "Sin cliente",
          expediente: contrato.proceso_expediente || `Proceso #${contrato.proceso_id}`,
          montoTotal: contrato.monto_total,
          montoPagado: contrato.monto_pagado,
          saldo: contrato.monto_total - contrato.monto_pagado,
          porcentajePagado: contrato.monto_total > 0 ? (contrato.monto_pagado / contrato.monto_total) * 100 : 0,
        }))
        .filter((d) => d.saldo > 0)
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5) // Top 5

      const total = debts.reduce((sum, d) => sum + d.saldo, 0)

      setTopDebts(debts)
      setTotalDeuda(total)
    } catch (error) {
      console.error("Error cargando deudas:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Principales Deudas</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Total pendiente: <Money amount={totalDeuda} className="font-semibold text-foreground" />
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href="/finanzas">
            Ver todas
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : topDebts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No hay deudas registradas</p>
          </div>
        ) : (
          topDebts.map((debt, index) => (
            <div key={debt.contrato_id || `debt-${index}`} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{debt.clienteNombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{debt.expediente}</p>
                </div>
                <Money amount={debt.saldo} className="font-semibold text-amber-600 dark:text-amber-400 ml-2 flex-shrink-0" />
              </div>
              <Progress value={debt.porcentajePagado} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Pagado: <Money amount={debt.montoPagado} /> de <Money amount={debt.montoTotal} />
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
