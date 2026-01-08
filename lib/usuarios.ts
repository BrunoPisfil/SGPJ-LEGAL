import { apiClient } from './api';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: 'admin' | 'abogado' | 'practicante';
  telefono?: string;
  created_at: string;
  updated_at: string;
}

export const usuariosAPI = {
  // Listar todos los usuarios (solo admin)
  async getAll(): Promise<Usuario[]> {
    return apiClient.get<Usuario[]>('/usuarios');
  },

  // Obtener perfil del usuario actual
  async getProfile(): Promise<Usuario> {
    return apiClient.get<Usuario>('/usuarios/profile');
  },
};

export default usuariosAPI;
