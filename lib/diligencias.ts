/**
 * API client para Diligencias
 */

import { API_BASE_URL } from "@/config/api";

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
    const response = await fetch(`${API_BASE_URL}/diligencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(diligencia),
    });

    if (!response.ok) {
      throw new Error(`Error al crear diligencia: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener todas las diligencias
   */
  obtenerTodas: async (skip: number = 0, limit: number = 100): Promise<Diligencia[]> => {
    const response = await fetch(
      `${API_BASE_URL}/diligencias?skip=${skip}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Error al obtener diligencias: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener diligencias de un proceso específico
   */
  obtenerPorProceso: async (
    procesoId: number,
    skip: number = 0,
    limit: number = 100
  ): Promise<Diligencia[]> => {
    const response = await fetch(
      `${API_BASE_URL}/diligencias/proceso/${procesoId}?skip=${skip}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(
        `Error al obtener diligencias del proceso: ${response.statusText}`
      );
    }

    return response.json();
  },

  /**
   * Obtener una diligencia específica
   */
  obtener: async (diligenciaId: number): Promise<Diligencia> => {
    const response = await fetch(`${API_BASE_URL}/diligencias/${diligenciaId}`);

    if (!response.ok) {
      throw new Error(`Error al obtener diligencia: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Actualizar una diligencia
   */
  actualizar: async (
    diligenciaId: number,
    diligencia: DiligenciaUpdate
  ): Promise<Diligencia> => {
    const response = await fetch(`${API_BASE_URL}/diligencias/${diligenciaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(diligencia),
    });

    if (!response.ok) {
      throw new Error(`Error al actualizar diligencia: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Eliminar una diligencia
   */
  eliminar: async (diligenciaId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/diligencias/${diligenciaId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Error al eliminar diligencia: ${response.statusText}`);
    }
  },
};
