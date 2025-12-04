import { apiClient } from './api';

export interface TipoPersona {
  tipo: 'natural' | 'juridica';
}

export interface TipoDocumento {
  tipo: 'DNI' | 'RUC' | 'CE' | 'PAS';
}

export interface DirectorioEntry {
  id: number;
  tipo: 'cliente' | 'juzgado' | 'especialista';
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  // Cliente fields
  tipo_persona?: 'natural' | 'juridica';
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  doc_tipo?: 'DNI' | 'RUC' | 'CE' | 'PAS';
  doc_numero?: string;
  // Juzgado fields
  distrito_judicial?: string;
  // Especialista fields
  especialidad?: string;
  numero_colegiado?: string;
  juzgado_id?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DirectorioCreate {
  tipo: 'cliente' | 'juzgado' | 'especialista';
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipo_persona?: 'natural' | 'juridica';
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  doc_tipo?: 'DNI' | 'RUC' | 'CE' | 'PAS';
  doc_numero?: string;
  distrito_judicial?: string;
  especialidad?: string;
  numero_colegiado?: string;
  juzgado_id?: number;
  activo?: boolean;
}

export interface DirectorioUpdate {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipo_persona?: 'natural' | 'juridica';
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  doc_tipo?: 'DNI' | 'RUC' | 'CE' | 'PAS';
  doc_numero?: string;
  distrito_judicial?: string;
  especialidad?: string;
  numero_colegiado?: string;
  juzgado_id?: number;
  activo?: boolean;
}

export interface EstadisticasDirectorio {
  por_tipo: Record<string, number>;
  total: number;
}

const directorioAPI = {
  // Listar con filtros
  getAll: async (skip = 0, limit = 100, tipo?: string, activosSolo = false) => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (tipo) params.append('tipo', tipo);
    if (activosSolo) params.append('activos_solo', 'true');
    
    return apiClient.request<DirectorioEntry[]>({
      method: 'GET',
      url: `/directorio?${params.toString()}`,
    });
  },

  // Obtener por ID
  getById: async (id: number) => {
    return apiClient.request<DirectorioEntry>({
      method: 'GET',
      url: `/directorio/${id}`,
    });
  },

  // Listar solo clientes
  getClientes: async () => {
    return apiClient.request<DirectorioEntry[]>({
      method: 'GET',
      url: '/directorio/clientes',
    });
  },

  // Listar solo juzgados
  getJuzgados: async () => {
    return apiClient.request<DirectorioEntry[]>({
      method: 'GET',
      url: '/directorio/juzgados',
    });
  },

  // Listar solo especialistas
  getEspecialistas: async () => {
    return apiClient.request<DirectorioEntry[]>({
      method: 'GET',
      url: '/directorio/especialistas',
    });
  },

  // Listar especialistas por juzgado
  getEspecialistasByJuzgado: async (juzgadoId: number) => {
    return apiClient.request<DirectorioEntry[]>({
      method: 'GET',
      url: `/directorio/juzgados/${juzgadoId}/especialistas`,
    });
  },

  // Buscar
  search: async (query: string, tipo?: string) => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (tipo) params.append('tipo', tipo);
    
    return apiClient.request<DirectorioEntry[]>({
      method: 'GET',
      url: `/directorio/buscar?${params.toString()}`,
    });
  },

  // Crear
  create: async (data: DirectorioCreate) => {
    return apiClient.request<DirectorioEntry>({
      method: 'POST',
      url: '/directorio',
      data,
    });
  },

  // Actualizar
  update: async (id: number, data: DirectorioUpdate) => {
    return apiClient.request<DirectorioEntry>({
      method: 'PUT',
      url: `/directorio/${id}`,
      data,
    });
  },

  // Eliminar
  delete: async (id: number) => {
    return apiClient.request<void>({
      method: 'DELETE',
      url: `/directorio/${id}`,
    });
  },

  // Estadísticas
  getEstadisticas: async () => {
    return apiClient.request<EstadisticasDirectorio>({
      method: 'GET',
      url: '/directorio/estadisticas',
    });
  },
};

export { directorioAPI };
export default directorioAPI;
