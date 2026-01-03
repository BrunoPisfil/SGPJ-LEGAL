import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ProcessStatus = "Activo" | "En trámite" | "Suspendido" | "Archivado" | "Finalizado"
export type JuridicalStatus = "pendiente_impulsar" | "pendiente_sentencia" | "resolucion" | "audiencia_programada"
export type ContractStatus = "activo" | "completado" | "cancelado"

interface ProcessStatusBadgeProps {
  status?: ProcessStatus
  juridicalStatus?: JuridicalStatus
  estado?: ContractStatus
  className?: string
}

const processStatusConfig: Record<ProcessStatus, { label: string; className: string }> = {
  "Activo": {
    label: "Activo",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  "En trámite": {
    label: "En trámite",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  "Suspendido": {
    label: "Suspendido",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  "Archivado": {
    label: "Archivado",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
  "Finalizado": {
    label: "Finalizado",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
}

const juridicalStatusConfig: Record<JuridicalStatus, { label: string; className: string }> = {
  "pendiente_impulsar": {
    label: "Pendiente Impulsar",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  "pendiente_sentencia": {
    label: "Pendiente Sentencia",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  "resolucion": {
    label: "Resolución",
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  "audiencia_programada": {
    label: "Audiencia Programada",
    className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
}

const contractStatusConfig: Record<ContractStatus, { label: string; className: string }> = {
  "activo": {
    label: "Activo",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  "completado": {
    label: "Completado",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  "cancelado": {
    label: "Cancelado",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
}

export function ProcessStatusBadge({ status, juridicalStatus, estado, className }: ProcessStatusBadgeProps) {
  let config = {
    label: "Sin estado",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  }

  // Priorizar estado jurídico > estado general > estado de contrato
  if (juridicalStatus && juridicalStatusConfig[juridicalStatus]) {
    config = juridicalStatusConfig[juridicalStatus]
  } else if (status && processStatusConfig[status]) {
    config = processStatusConfig[status]
  } else if (estado && contractStatusConfig[estado]) {
    config = contractStatusConfig[estado]
  }

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
