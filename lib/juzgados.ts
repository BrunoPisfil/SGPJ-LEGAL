import { apiClient } from '@/lib/api';

export interface Juzgado {
  id: number;
  nombre: string;
  distrito_judicial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

class JuzgadosAPI {
  async getAll(): Promise<Juzgado[]> {
    try {
      const response = await apiClient.get<Juzgado[]>('/directorio/juzgados');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching juzgados:', error);
      throw error;
    }
  }

  async getById(id: number): Promise<Juzgado> {
    try {
      const response = await apiClient.get<Juzgado>(`/directorio/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching juzgado ${id}:`, error);
      throw error;
    }
  }

  async create(juzgado: Omit<Juzgado, 'id'>): Promise<Juzgado> {
    try {
      const response = await apiClient.post<Juzgado>('/directorio', {
        ...juzgado,
        tipo: 'juzgado'
      });
      return response;
    } catch (error) {
      console.error('Error creating juzgado:', error);
      throw error;
    }
  }

  async update(id: number, juzgado: Partial<Juzgado>): Promise<Juzgado> {
    try {
      const response = await apiClient.put<Juzgado>(`/directorio/${id}`, juzgado);
      return response;
    } catch (error) {
      console.error(`Error updating juzgado ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/directorio/${id}`);
    } catch (error) {
      console.error(`Error deleting juzgado ${id}:`, error);
      throw error;
    }
  }
}

export const juzgadosAPI = new JuzgadosAPI();
