import type { ProcessStatus } from "@/components/process-status-badge"

export interface Process {
  id: string
  expediente: string
  materia: string
  demandante: string
  demandado: string
  juzgado: string
  especialista: string
  estado: ProcessStatus
  estadoDescripcion: string
  ultimaActuacion: Date
  fecha_ultima_revision?: Date
}

export interface Audiencia {
  id: string
  procesoId: string
  expediente: string
  tipo: string
  fecha: Date
  hora: string
  sede?: string
  link?: string
  notas?: string
  notificacionEnviada?: boolean
}

export interface Cliente {
  id: string
  tipo: "natural" | "juridica"
  nombres?: string
  apellidos?: string
  razonSocial?: string
  documento: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
}

export interface Contrato {
  id: string
  codigo: string
  clienteId: string
  clienteNombre: string
  procesoId: string
  expediente: string
  montoTotal: number
  montoPagado: number
}

export interface Resolucion {
  id: string
  procesoId: string
  expediente: string
  tipo: "improcedente" | "infundada" | "fundada_en_parte" | "rechazo_medios_probatorios" | "no_ha_lugar"
  fechaNotificacion: Date
  accionRequerida: "apelar" | "subsanar"
  fechaLimite: Date
  responsable: string
  estadoAccion: "pendiente" | "en_tramite" | "completada"
  notas?: string
}

export interface Notificacion {
  id: string
  tipo: "audiencia" | "proceso" | "pago" | "sistema" | "impulso" | "resolucion"
  titulo: string
  mensaje: string
  fecha: Date
  leida: boolean
  link?: string
  estado?: "enviado" | "pendiente" | "error"
}

// Sample data - CLEANED: Only empty arrays for clean testing
export const sampleProcesses: Process[] = []

export const sampleAudiencias: Audiencia[] = []

export const sampleResoluciones: Resolucion[] = []

export const sampleContratos: Contrato[] = []

export const sampleClientes: Cliente[] = []

export const sampleNotificaciones: Notificacion[] = []
