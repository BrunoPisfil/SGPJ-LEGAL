import { apiClient } from './api';

// Helper function para transformar procesos normalizados en formato compatible
export function transformProceso(proceso: any): Proceso {
  return {
    ...proceso,
    // Propiedades computadas para compatibilidad con código existente
    demandante: proceso.demandantes?.[0] || 'Sin demandante',
    demandado: proceso.demandados?.[0] || 'Sin demandado', 
    juzgado: proceso.juzgado_nombre || 'Sin juzgado',
    juez: proceso.juez_nombre || undefined
  };
}

// Tipos para procesos
export type EstadoProceso = 'Activo' | 'En trámite' | 'Suspendido' | 'Archivado' | 'Finalizado';
export type EstadoJuridico = 'pendiente_impulsar' | 'pendiente_sentencia' | 'resolucion' | 'audiencia_programada';
export type TipoProceso = 'Civil' | 'Penal' | 'Laboral' | 'Administrativo' | 'Familia' | 'Comercial';

export interface Proceso {
  id: number;
  expediente: string;
  tipo: TipoProceso;
  materia: string;
  demandantes: string[];
  demandados: string[];
  juzgado_nombre: string;
  juez_nombre?: string;
  estado?: EstadoProceso;
  estado_juridico?: EstadoJuridico;
  monto_pretension?: number;
  fecha_inicio: string;
  fecha_notificacion?: string;
  fecha_ultima_revision?: string;
  observaciones?: string;
  abogado_responsable_id: number;
  abogado_responsable_nombre?: string;
  created_at: string;
  updated_at?: string;
  // Propiedades computadas para compatibilidad
  demandante?: string;
  demandado?: string;
  juzgado?: string;
  juez?: string;
}

export interface ProcesoCreate {
  expediente: string;
  tipo: TipoProceso;
  materia: string;
  demandante: string;
  demandado: string;
  cliente_id?: number;
  juzgado: string;
  juez?: string;
  estado?: EstadoProceso;
  monto_pretension?: number;
  fecha_inicio: string;
  fecha_notificacion?: string;
  fecha_ultima_revision?: string;
  observaciones?: string;
}

export interface ProcesoUpdate {
  tipo?: TipoProceso;
  materia?: string;
  demandante?: string;
  demandado?: string;
  juzgado?: string;
  juez?: string;
  estado?: EstadoProceso;
  estado_juridico?: EstadoJuridico;
  monto_pretension?: number;
  fecha_inicio?: string;
  fecha_notificacion?: string;
  fecha_ultima_revision?: string;
  observaciones?: string;
}

export interface ProcesosParams {
  skip?: number;
  limit?: number;
  estado?: EstadoProceso;
}

// API functions para procesos
export const procesosAPI = {
  // Listar procesos
  async getAll(params?: ProcesosParams): Promise<Proceso[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.estado) queryParams.append('estado', params.estado);
    
    const url = `/procesos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await apiClient.get<any[]>(url);
    return data.map(transformProceso);
  },

  // Obtener proceso por ID
  async getById(id: number): Promise<Proceso> {
    const data = await apiClient.get<any>(`/procesos/${id}`);
    return transformProceso(data);
  },

  // Crear nuevo proceso
  async create(proceso: ProcesoCreate): Promise<Proceso> {
    const data = await apiClient.post<any>('/procesos', proceso);
    return transformProceso(data);
  },

  // Actualizar proceso
  async update(id: number, proceso: ProcesoUpdate): Promise<Proceso> {
    const data = await apiClient.put<any>(`/procesos/${id}`, proceso);
    return transformProceso(data);
  },

  // Eliminar proceso
  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete(`/procesos/${id}`);
  },

  // Marcar proceso como revisado (actualiza fecha_ultima_revision a hoy)
  async markAsReviewed(id: number): Promise<Proceso> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this.update(id, { fecha_ultima_revision: today });
  },

  // Desmarcar revisión (limpia fecha_ultima_revision)
  async clearReview(id: number): Promise<Proceso> {
    return this.update(id, { fecha_ultima_revision: null });
  },

  // Búsqueda de procesos para selector (optimizada)
  async search(query: string, limit: number = 20): Promise<Proceso[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    queryParams.append('limit', limit.toString());
    
    const url = `/procesos?${queryParams.toString()}`;
    const data = await apiClient.get<any[]>(url);
    return data.map(transformProceso);
  }
};