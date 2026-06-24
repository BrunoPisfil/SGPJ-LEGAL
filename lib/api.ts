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

    const token = this.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.removeToken();
        onUnauthorizedCallback?.();
        throw new Error('Not authenticated');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (response.status === 204) {
        return null as any;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      // AbortError por timeout real (no por navegación del usuario)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Intenta nuevamente.');
      }
      throw error;
    }
  }

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

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgpj_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sgpj_token');
    }
    return null;
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sgpj_token');
    }
  }
}

export const apiClient = new APIClient();
