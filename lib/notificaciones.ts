// API client para notificaciones
import { apiClient } from './api';

export interface Notificacion {
  id: number;
  audiencia_id?: number;
  proceso_id?: number;
  tipo: 'audiencia_programada' | 'audiencia_recordatorio' | 'proceso_actualizado' | 'vencimiento_plazo' | 'sistema';
  canal: 'email' | 'sms' | 'sistema';
  titulo: string;
  mensaje: string;
  email_destinatario?: string;
  telefono_destinatario?: string;
  estado: 'pendiente' | 'enviada' | 'error' | 'leida';
  fecha_programada?: string;
  fecha_enviada?: string;
  fecha_leida?: string;
  metadata_extra?: string;
  error_mensaje?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificacionList {
  notificaciones: Notificacion[];
  total: number;
  no_leidas: number;
  page: number;
  per_page: number;
}

export interface EnviarNotificacionRequest {
  audiencia_id: number;
  canales: ('email' | 'sms' | 'sistema')[];
  email_destinatario?: string;
  telefono_destinatario?: string;
  mensaje_personalizado?: string;
}

export interface NotificacionFilters {
  estado?: 'pendiente' | 'enviada' | 'error' | 'leida';
  tipo?: 'audiencia_programada' | 'audiencia_recordatorio' | 'proceso_actualizado' | 'vencimiento_plazo' | 'sistema';
  canal?: 'email' | 'sms' | 'sistema';
  solo_no_leidas?: boolean;
  skip?: number;
  limit?: number;
}

export interface NotificacionStats {
  total_notificaciones: number;
  no_leidas: number;
  leidas: number;
}

class NotificacionesAPI {
  async getAll(filters?: NotificacionFilters): Promise<NotificacionList> {
    const params = new URLSearchParams();
    
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.canal) params.append('canal', filters.canal);
    if (filters?.solo_no_leidas) params.append('solo_no_leidas', filters.solo_no_leidas.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/notificaciones/?${queryString}` : '/notificaciones/';
    
    return apiClient.get<NotificacionList>(url);
  }

  async getById(id: number): Promise<Notificacion> {
    return apiClient.get<Notificacion>(`/notificaciones/${id}`);
  }

  async marcarComoLeida(id: number): Promise<Notificacion> {
    return apiClient.put<Notificacion>(`/notificaciones/${id}/marcar-leida`, {});
  }

  async enviarNotificacionAudiencia(request: EnviarNotificacionRequest): Promise<Notificacion[]> {
    return apiClient.post<Notificacion[]>('/notificaciones/enviar-audiencia', request);
  }

  async getStats(): Promise<NotificacionStats> {
    return apiClient.get<NotificacionStats>('/notificaciones/stats/resumen');
  }

  async eliminar(id: number): Promise<void> {
    return apiClient.delete(`/notificaciones/${id}`);
  }

  // Helper methods
  async marcarVariasComoLeidas(ids: number[]): Promise<void> {
    await Promise.all(ids.map(id => this.marcarComoLeida(id)));
  }

  async getNoLeidas(): Promise<NotificacionList> {
    return this.getAll({ solo_no_leidas: true });
  }
}

export const notificacionesAPI = new NotificacionesAPI();