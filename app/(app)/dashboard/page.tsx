"use client"

import { FileText, Calendar, DollarSign, AlertCircle } from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { ProcessStatusChart } from "@/components/dashboard/process-status-chart"
import { UpcomingHearingsTable } from "@/components/dashboard/upcoming-hearings-table"
import { TopDebtsCard } from "@/components/dashboard/top-debts-card"
import { ImpulsoControlCard } from "@/components/dashboard/impulso-control-card"
import { PlazosCard } from "@/components/dashboard/plazos-card"
import { useState, useEffect } from "react"
import { Loader } from "lucide-react"
import { procesosAPI } from "@/lib/procesos"
import { audienciasAPI } from "@/lib/audiencias"
import { contratosAPI } from "@/lib/contratos"
import { resolucionesAPI } from "@/lib/resoluciones"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProcesses: 0,
    upcomingHearings: 0,
    totalDebt: 0,
    urgentProcesses: 0,
    loading: true,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Cargar procesos
      const procesos = await procesosAPI.getAll({ skip: 0, limit: 500 })
      setStats((prev) => ({
        ...prev,
        totalProcesses: procesos.length,
      }))

      // Cargar audiencias próximas (próximos 30 días)
      const audienciasResponse = await audienciasAPI.getAll({ skip: 0, limit: 500 })
      const audiencias = Array.isArray(audienciasResponse) ? audienciasResponse : (audienciasResponse.audiencias || [])
      const now = new Date()
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const upcomingCount = audiencias.filter((a: any) => {
        const fecha = new Date(a.fecha)
        return fecha > now && fecha < nextMonth
      }).length

      setStats((prev) => ({
        ...prev,
        upcomingHearings: upcomingCount,
      }))

      // Cargar contratos para calcular deudas pendientes
      try {
        const contratosData = await contratosAPI.getAll()
        const contratos = Array.isArray(contratosData) ? contratosData : []
        // Calcular total de deudas pendientes (monto_total - monto_pagado)
        const totalDebt = contratos.reduce((sum, c) => sum + (c.monto_total - c.monto_pagado), 0)

        setStats((prev) => ({
          ...prev,
          totalDebt: totalDebt,
        }))
      } catch (error) {
        console.warn("No se pudieron cargar los contratos:", error)
      }

      // Contar procesos que requieren atención (pendientes)
      const urgentCount = procesos.filter((p) => {
        const estadoJuridico = p.estado_juridico?.toLowerCase()
        const estado = p.estado?.toLowerCase()
        return estadoJuridico === "pendiente_impulsar" || estado === "pendiente_impulsar" || estado === "pendiente"
      }).length

      setStats((prev) => ({
        ...prev,
        urgentProcesses: urgentCount,
        loading: false,
      }))
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error)
      setStats((prev) => ({
        ...prev,
        loading: false,
      }))
    }
  }

  if (stats.loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center py-8 sm:py-12">
          <Loader className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-base sm:text-lg font-semibold">Cargando panel...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Resumen general del sistema de gestión judicial</p>
      </div>

      {/* KPI Cards - Responsive grid */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Procesos" value={stats.totalProcesses} icon={FileText} description="Procesos activos" />
        <KPICard
          title="Audiencias Próximas"
          value={stats.upcomingHearings}
          icon={Calendar}
          description="En los próximos 30 días"
        />
        <KPICard
          title="Deudas Pendientes"
          value={`S/ ${(stats.totalDebt / 1000).toFixed(1)}K`}
          icon={DollarSign}
          description="Saldo por cobrar"
        />
        <KPICard
          title="Requieren Atención"
          value={stats.urgentProcesses}
          icon={AlertCircle}
          description="Pendientes de impulsar"
        />
      </div>

      {/* Charts and Tables - Responsive stacking */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProcessStatusChart />
        </div>
        <div className="lg:col-span-2">
          <TopDebtsCard />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ImpulsoControlCard />
        <PlazosCard />
      </div>

      {/* Upcoming Hearings */}
      <UpcomingHearingsTable />
    </div>
  )
}
