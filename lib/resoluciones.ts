import { apiClient } from './api'

export interface Resolucion {
  id: number
  proceso_id: number
  tipo: "improcedente" | "infundada" | "fundada_en_parte" | "rechazo_medios_probatorios" | "no_ha_lugar"
  fecha_notificacion: string
  accion_requerida: "apelar" | "subsanar"
  fecha_limite: string
  responsable: string
  estado_accion: "pendiente" | "en_tramite" | "completada"
  notas?: string
  created_at: string
  updated_at: string
  expediente?: string
}

export interface ResolucionCreate {
  proceso_id: number
  tipo: "improcedente" | "infundada" | "fundada_en_parte" | "rechazo_medios_probatorios" | "no_ha_lugar"
  fecha_notificacion: string
  accion_requerida: "apelar" | "subsanar"
  fecha_limite: string
  responsable: string
  estado_accion?: "pendiente" | "en_tramite" | "completada"
  notas?: string
}

export interface ResolucionUpdate {
  tipo?: "improcedente" | "infundada" | "fundada_en_parte" | "rechazo_medios_probatorios" | "no_ha_lugar"
  fecha_notificacion?: string
  accion_requerida?: "apelar" | "subsanar"
  fecha_limite?: string
  responsable?: string
  estado_accion?: "pendiente" | "en_tramite" | "completada"
  notas?: string
}

export const resolucionesAPI = {
  async getAll(skip = 0, limit = 100, procesoId?: number): Promise<Resolucion[]> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    })
    
    if (procesoId) {
      params.append('proceso_id', procesoId.toString())
    }
    
    return await apiClient.get<Resolucion[]>(`/resoluciones/?${params}`)
  },

  async getById(id: number): Promise<Resolucion> {
    return await apiClient.get<Resolucion>(`/resoluciones/${id}`)
  },

  async create(data: ResolucionCreate): Promise<Resolucion> {
    return await apiClient.post<Resolucion>('/resoluciones/', data)
  },

  async update(id: number, data: ResolucionUpdate): Promise<Resolucion> {
    return await apiClient.put<Resolucion>(`/resoluciones/${id}`, data)
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/resoluciones/${id}`)
  },

  async getByProceso(procesoId: number): Promise<Resolucion[]> {
    return await apiClient.get<Resolucion[]>(`/resoluciones/proceso/${procesoId}`)
  }
}