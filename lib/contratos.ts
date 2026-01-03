import { apiClient } from './api';

// Tipo para contratos
export interface Contrato {
  id: number;
  codigo: string;
  cliente_id: number;
  proceso_id: number;
  monto_total: number;
  monto_pagado: number;
  estado: 'activo' | 'completado' | 'cancelado';
  fecha_creacion: string;
  fecha_actualizacion?: string;
  notas?: string;
  // Información expandida para mostrar
  cliente_nombre?: string;
  cliente_documento?: string;
  proceso_expediente?: string;
  proceso_demandante?: string;
  proceso_demandado?: string;
}

export interface ContratoCreate {
  cliente_id: number;
  proceso_id: number;
  monto_total: number;
  monto_pagado?: number;
  estado?: 'activo' | 'completado' | 'cancelado';
  notas?: string;
}

export interface ContratoUpdate {
  monto_total?: number;
  monto_pagado?: number;
  estado?: 'activo' | 'completado' | 'cancelado';
  notas?: string;
}

export interface ContratoFilters {
  cliente_id?: number;
  proceso_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// API functions
export const contratosAPI = {
  // Obtener todos los contratos con filtros opcionales
  async getAll(filters?: ContratoFilters): Promise<Contrato[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = params.toString() ? `/finanzas?${params.toString()}` : '/finanzas';
    console.log('🚀 Getting contratos from:', url);
    
    try {
      const response = await apiClient.get(url);
      console.log('✅ Contratos API response:', response);
      
      // La respuesta puede venir directamente como array o en response.contratos
      if (Array.isArray(response)) {
        return response;
      } else if (response.contratos && Array.isArray(response.contratos)) {
        return response.contratos;
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        return [];
      }
    } catch (error) {
      console.error('❌ Error in getAll:', error);
      throw error;
    }
  },

  // Obtener un contrato por ID
  async getById(id: number): Promise<Contrato> {
    console.log('🚀 Getting contrato by ID:', id);
    
    try {
      const response = await apiClient.get<Contrato>(`/finanzas/contratos/${id}`);
      console.log('✅ Contrato by ID response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error in getById:', error);
      throw error;
    }
  },

  // Crear un nuevo contrato
  async create(contrato: ContratoCreate): Promise<Contrato> {
    console.log('🚀 contratosAPI.create called with:', contrato);
    
    try {
      const response = await apiClient.post('/finanzas/contratos', contrato);
      console.log('✅ API response received:', response);
      console.log('✅ Response type:', typeof response);
      console.log('✅ Response keys:', Object.keys(response || {}));
      
      if (!response) {
        throw new Error('Response is null or undefined');
      }
      
      // La respuesta del apiClient.request ya es el objeto directo, no tiene .data
      return response as Contrato;
    } catch (error) {
      console.error('❌ Error in contratosAPI.create:', error);
      throw error;
    }
  },

  // Actualizar un contrato
  async update(id: number, contrato: ContratoUpdate): Promise<Contrato> {
    try {
      const response = await apiClient.put<Contrato>(`/finanzas/contratos/${id}`, contrato);
      return response as Contrato;
    } catch (error) {
      console.error('❌ Error in update:', error);
      throw error;
    }
  },

  // Eliminar un contrato
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/finanzas/contratos/${id}`);
    } catch (error) {
      console.error('❌ Error in delete:', error);
      throw error;
    }
  },

  // Obtener estadísticas de contratos
  async getStats(): Promise<{
    total: number;
    activos: number;
    completados: number;
    monto_total: number;
    monto_pagado: number;
    monto_pendiente: number;
  }> {
    console.log('🚀 Getting contract stats...');
    
    try {
      const response = await apiClient.get<{
        total: number;
        activos: number;
        completados: number;
        monto_total: number;
        monto_pagado: number;
        monto_pendiente: number;
      }>('/finanzas/contratos/stats');
      console.log('✅ Stats API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error in getStats:', error);
      throw error;
    }
  },

  // Buscar contratos
  async search(query: string): Promise<Contrato[]> {
    try {
      const response = await apiClient.get<Contrato[]>(`/finanzas/contratos/search?q=${encodeURIComponent(query)}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Error in search:', error);
      throw error;
    }
  }
};

// Función helper para generar código de contrato
export const generateContratoCode = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getTime()).slice(-4);
  
  return `CTR-${year}${month}${day}-${time}`;
};

// Función helper para calcular monto pendiente
export const calcularMontoPendiente = (contrato: Contrato): number => {
  return contrato.monto_total - contrato.monto_pagado;
};

// Función helper para calcular porcentaje pagado
export const calcularPorcentajePagado = (contrato: Contrato): number => {
  if (contrato.monto_total === 0) return 0;
  return Math.round((contrato.monto_pagado / contrato.monto_total) * 100);
};