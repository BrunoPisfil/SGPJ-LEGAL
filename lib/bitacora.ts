// Tipos para bitácora de procesos
import { apiClient } from './api'

export type AccionBitacora = 'creacion' | 'actualizacion' | 'eliminacion' | 'audiencia' | 'estado' | 'observacion'

export interface BitacoraEntry {
  id: number
  proceso_id: number
  usuario_id?: number
  accion: AccionBitacora
  campo_modificado?: string
  valor_anterior?: string
  valor_nuevo?: string
  descripcion?: string
  fecha_cambio: string
  usuario_nombre?: string
}

export interface BitacoraCreate {
  accion: AccionBitacora
  campo_modificado?: string
  valor_anterior?: string
  valor_nuevo?: string
  descripcion?: string
}

// API de bitácora
export const bitacoraAPI = {
  // Obtener historial de un proceso
  async getByProceso(procesoId: number): Promise<BitacoraEntry[]> {
    console.log('🔍 Solicitando bitácora para proceso:', procesoId)
    const response = await apiClient.get(`/procesos/${procesoId}/bitacora`)
    console.log('📡 Respuesta de bitácora:', response)
    return response.data || response
  },

  // Crear nueva entrada en bitácora
  async create(procesoId: number, data: BitacoraCreate): Promise<BitacoraEntry> {
    const response = await apiClient.post(`/procesos/${procesoId}/bitacora`, data)
    return response.data
  }
}