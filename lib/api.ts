// Configuración de la API
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
      ? 'https://sgpj-legal-backend.vercel.app/api/v1'
      : 'http://localhost:8000/api/v1',
  TIMEOUT: 30000,
} as const;


// Callback para manejar errores de autenticación
let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
  // Retornar una función de limpieza
  return () => {
    onUnauthorizedCallback = null;
  };
}

// Cliente HTTP para la API
class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    console.log('🌐 API Client initialized with baseURL:', this.baseURL);
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Agregar token si está disponible
    const token = this.getToken();
    console.log('🔑 Token disponible:', token ? 'SÍ' : 'NO');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
      console.log('✅ Token agregado a headers');
    } else {
      console.log('❌ No hay token disponible - request sin autenticación');
    }

    try {
      console.log('Making request to:', url, 'with config:', config);
      
      // Agregar timeout manual
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      
      timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout after 15 seconds');
        controller.abort();
      }, 15000);
      
      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        
        // Manejar error 401 - No autenticado
        if (response.status === 401) {
          console.error('❌ Error 401: Not authenticated');
          // Limpiar token
          this.removeToken();
          // Ejecutar callback de no autorizado
          onUnauthorizedCallback?.();
          throw new Error('Not authenticated');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        return data;
      } catch (fetchError) {
        if (timeoutId) clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('API Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('La solicitud fue cancelada. Intenta nuevamente.');
      }
      throw error;
    }
  }

  // Métodos HTTP
  async request<T>(options: { method: string; url: string; data?: any }): Promise<T> {
    return this.makeRequest<T>(options.url, {
      method: options.method,
      body: options.data ? JSON.stringify(options.data) : undefined,
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Gestión de tokens
  setToken(token: string) {
    console.log('💾 Guardando token:', token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgpj_token', token);
      console.log('✅ Token guardado en localStorage');
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sgpj_token');
      console.log('🔑 Token obtenido de localStorage:', token ? 'EXISTE' : 'NO EXISTE');
      return token;
    }
    return null;
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sgpj_token');
    }
  }
}

// Instancia singleton del cliente API
export const apiClient = new APIClient();