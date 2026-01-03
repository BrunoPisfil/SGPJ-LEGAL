// API client para audiencias
import { apiClient } from './api';

export interface AudienciaFormData {
  procesoId: string;
  tipo: string;
  fecha: Date;
  hora: string;
  modalidad: 'presencial' | 'virtual';
  sede?: string;
  link?: string;
  notas?: string;
}

export interface Audiencia {
  id: number;
  proceso_id: number;
  tipo: string;
  fecha: string; // YYYY-MM-DD format
  hora: string; // HH:MM format  
  sede?: string;
  link?: string;
  notas?: string;
  notificar: boolean;
  fecha_hora?: string; // ISO datetime
  created_at: string;
  updated_at: string;
}

export interface AudienciaCreate {
  proceso_id: number;
  tipo: string;
  fecha: string; // YYYY-MM-DD format
  hora: string; // HH:MM format
  sede?: string;
  link?: string;
  notas?: string;
  notificar?: boolean;
}

export interface AudienciaList {
  audiencias: Audiencia[];
  total: number;
  page: number;
  per_page: number;
}

export interface AudienciaFilters {
  proceso_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo?: string;
  skip?: number;
  limit?: number;
}

class AudienciasAPI {

  async getAll(filters?: AudienciaFilters): Promise<AudienciaList> {
    const params = new URLSearchParams();
    
    if (filters?.proceso_id) params.append('proceso_id', filters.proceso_id.toString());
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/audiencias/?${queryString}` : '/audiencias/';
    
    return apiClient.get<AudienciaList>(url);
  }

  async getById(id: number): Promise<Audiencia> {
    return apiClient.get<Audiencia>(`/audiencias/${id}`);
  }

  async create(data: AudienciaCreate): Promise<Audiencia> {
    return apiClient.post<Audiencia>('/audiencias/', data);
  }

  async update(id: number, data: Partial<AudienciaCreate>): Promise<Audiencia> {
    return apiClient.put<Audiencia>(`/audiencias/${id}`, data);
  }

  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete(`/audiencias/${id}`);
  }

  async getByProceso(procesoId: number): Promise<Audiencia[]> {
    return apiClient.get<Audiencia[]>(`/audiencias/proceso/${procesoId}`);
  }

  async getProximas(limit: number = 10): Promise<Audiencia[]> {
    return apiClient.get<Audiencia[]>(`/audiencias/proximas/list?limit=${limit}`);
  }

  // Helper method to convert form data to API format
  convertFormDataToAPI(formData: AudienciaFormData): AudienciaCreate {
    // Convert Date to YYYY-MM-DD format
    const fecha = formData.fecha.toISOString().split('T')[0];
    
    return {
      proceso_id: parseInt(formData.procesoId),
      tipo: formData.tipo,
      fecha: fecha,
      hora: formData.hora,
      sede: formData.modalidad === 'presencial' ? formData.sede : undefined,
      link: formData.modalidad === 'virtual' ? formData.link : undefined,
      notas: formData.notas || undefined,
      notificar: true
    };
  }
}

export const audienciasAPI = new AudienciasAPI();