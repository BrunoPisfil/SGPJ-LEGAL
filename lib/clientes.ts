import { apiClient } from './api';

// Tipos para clientes
export type TipoPersona = 'natural' | 'juridica';
export type TipoDocumento = 'DNI' | 'RUC' | 'CE' | 'PAS';

export interface Cliente {
  id: number;
  tipo_persona: TipoPersona;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  doc_tipo: TipoDocumento;
  doc_numero: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ClienteCreate {
  tipo_persona: TipoPersona;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  doc_tipo?: TipoDocumento;
  doc_numero: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

export interface ClienteUpdate {
  tipo_persona?: TipoPersona;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  doc_tipo?: TipoDocumento;
  doc_numero?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

export interface ClientesParams {
  skip?: number;
  limit?: number;
  search?: string;
  tipo_persona?: TipoPersona;
  activo?: boolean;
}

// API de clientes
export const clientesAPI = {
  // Obtener todos los clientes
  async getAll(params: ClientesParams = {}): Promise<Cliente[]> {
    const queryParams = new URLSearchParams();
    
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.tipo_persona) queryParams.append('tipo_persona', params.tipo_persona);
    if (params.activo !== undefined) queryParams.append('activo', params.activo.toString());

    const url = `/directorio${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Cliente[]>(url);
  },

  // Obtener cliente por ID
  async getById(id: number): Promise<Cliente> {
    return apiClient.get<Cliente>(`/directorio/${id}`);
  },

  // Crear nuevo cliente
  async create(cliente: ClienteCreate): Promise<Cliente> {
    return apiClient.post<Cliente>('/directorio', cliente);
  },

  // Actualizar cliente
  async update(id: number, cliente: ClienteUpdate): Promise<Cliente> {
    return apiClient.put<Cliente>(`/directorio/${id}`, cliente);
  },

  // Eliminar cliente (soft delete)
  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete(`/directorio/${id}`);
  },

  // Obtener conteo de clientes
  async getCount(params: ClientesParams = {}): Promise<{ total: number }> {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.tipo_persona) queryParams.append('tipo_persona', params.tipo_persona);
    if (params.activo !== undefined) queryParams.append('activo', params.activo.toString());

    const url = `/directorio/stats/count${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<{ total: number }>(url);
  },

  // Búsqueda de clientes para selector (optimizada)
  async search(query: string, limit: number = 20): Promise<Cliente[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    queryParams.append('limit', limit.toString());
    queryParams.append('activo', 'true'); // Solo clientes activos
    
    const url = `/directorio?${queryParams.toString()}`;
    return apiClient.get<Cliente[]>(url);
  }
};