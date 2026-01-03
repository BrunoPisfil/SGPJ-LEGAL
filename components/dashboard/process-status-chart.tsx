"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Loader } from "lucide-react"
import { useState, useEffect } from "react"
import { procesosAPI } from "@/lib/procesos"

export function ProcessStatusChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProcessData()
  }, [])

  const loadProcessData = async () => {
    try {
      setLoading(true)
      const procesos = await procesosAPI.getAll({ skip: 0, limit: 500 })

      // Contar procesos por estado
      const statusMap: Record<string, number> = {
        "Pendiente Impulsar": 0,
        "Pendiente Sentencia": 0,
        "Resolución": 0,
        "Audiencia Programada": 0,
      }

      procesos.forEach((p) => {
        const estadoJuridico = p.estado_juridico?.toLowerCase()
        const estado = p.estado?.toLowerCase()
        
        // Intentar con estado_juridico primero, luego con estado
        if (estadoJuridico === "pendiente_impulsar" || estado === "pendiente_impulsar" || estado === "pendiente") {
          statusMap["Pendiente Impulsar"]++
        } else if (estadoJuridico === "pendiente_sentencia" || estado === "en_tramite" || estado === "en trámite") {
          statusMap["Pendiente Sentencia"]++
        } else if (estadoJuridico === "resolucion" || estado === "resuelto" || estado === "resolucion") {
          statusMap["Resolución"]++
        } else if (estadoJuridico === "audiencia_programada" || estado === "audiencia") {
          statusMap["Audiencia Programada"]++
        }
      })

      const chartData = [
        { name: "Pendiente Impulsar", value: statusMap["Pendiente Impulsar"], color: "#f59e0b" },
        { name: "Pendiente Sentencia", value: statusMap["Pendiente Sentencia"], color: "#3b82f6" },
        { name: "Resolución", value: statusMap["Resolución"], color: "#10b981" },
        { name: "Audiencia Programada", value: statusMap["Audiencia Programada"], color: "#a855f7" },
      ].filter((item) => item.value > 0)

      setData(chartData.length > 0 ? chartData : [{ name: "Sin datos", value: 1, color: "#d1d5db" }])
    } catch (error) {
      console.error("Error cargando datos de procesos:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Procesos por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground text-sm">Cargando datos...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Procesos por Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
