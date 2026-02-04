/**
 * API client para Diligencias
 */

import { apiClient } from "./api";

export type EstadoDiligencia = "pendiente" | "en_progreso" | "completada" | "cancelada";

export interface Diligencia {
  id: number;
  proceso_id: number;
  titulo: string;
  motivo: string;
  fecha: string;
  hora: string;
  descripcion?: string;
  estado: EstadoDiligencia;
  notificar: boolean;
  notificacion_enviada: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiligenciaCreate {
  proceso_id: number;
  titulo: string;
  motivo: string;
  fecha: string;
  hora: string;
  descripcion?: string;
  estado?: EstadoDiligencia;
  notificar?: boolean;
}

export interface DiligenciaUpdate {
  titulo?: string;
  motivo?: string;
  fecha?: string;
  hora?: string;
  descripcion?: string;
  estado?: EstadoDiligencia;
  notificar?: boolean;
}

export const diligenciasAPI = {
  /**
   * Crear una nueva diligencia
   */
  crear: async (diligencia: DiligenciaCreate): Promise<Diligencia> => {
    return await apiClient.post<Diligencia>("/diligencias", diligencia);
  },

  /**
   * Obtener todas las diligencias
   */
  obtenerTodas: async (skip: number = 0, limit: number = 100): Promise<Diligencia[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    return await apiClient.get<Diligencia[]>(`/diligencias?${params}`);
  },

  /**
   * Obtener diligencias de un proceso específico
   */
  obtenerPorProceso: async (
    procesoId: number,
    skip: number = 0,
    limit: number = 100
  ): Promise<Diligencia[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    return await apiClient.get<Diligencia[]>(
      `/diligencias/proceso/${procesoId}?${params}`
    );
  },

  /**
   * Obtener una diligencia específica
   */
  obtener: async (diligenciaId: number): Promise<Diligencia> => {
    return await apiClient.get<Diligencia>(`/diligencias/${diligenciaId}`);
  },

  /**
   * Actualizar una diligencia
   */
  actualizar: async (
    diligenciaId: number,
    diligencia: DiligenciaUpdate
  ): Promise<Diligencia> => {
    return await apiClient.put<Diligencia>(`/diligencias/${diligenciaId}`, diligencia);
  },

  /**
   * Eliminar una diligencia
   */
  eliminar: async (diligenciaId: number): Promise<void> => {
    await apiClient.delete(`/diligencias/${diligenciaId}`);
  },
};
