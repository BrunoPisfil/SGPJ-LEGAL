import { apiClient } from './api';

// Tipos para autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol?: 'admin' | 'abogado' | 'asistente' | 'cliente';
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'admin' | 'abogado' | 'asistente' | 'cliente';
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Funciones de autenticación
export const authAPI = {
  // Iniciar sesión
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // Guardar token automáticamente
      apiClient.setToken(response.access_token);
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Registrar usuario
  async register(userData: RegisterRequest): Promise<User> {
    return apiClient.post<User>('/auth/register', userData);
  },

  // Obtener usuario actual
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  // Refrescar token
  async refreshToken(): Promise<{ access_token: string; token_type: string }> {
    return apiClient.post('/auth/refresh');
  },

  // Cerrar sesión
  logout() {
    apiClient.removeToken();
  },

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },
};

// Verificar salud del backend
export const healthAPI = {
  async checkHealth(): Promise<{ status: string; service: string }> {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
      process.env.NEXT_PUBLIC_API_URL ||
      "";

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL no está configurado");
    }

    const response = await fetch(`${baseUrl}/health`);
    return response.json();
  },
};
