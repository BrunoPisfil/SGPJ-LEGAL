import { apiClient } from './api';

// Tipos para pagos
export interface Pago {
  id: number;
  contrato_id: number;
  monto: number;
  medio?: string;
  referencia?: string;
  notas?: string;
  fecha_pago: string;
  created_at: string;
  updated_at: string;
  // Información expandida
  contrato_codigo?: string;
  cliente_nombre?: string;
}

export interface PagoCreate {
  contrato_id: number;
  monto: number;
  medio?: string;
  referencia?: string;
  notas?: string;
  fecha_pago?: string;
}

export interface PagoUpdate {
  monto?: number;
  medio?: string;
  referencia?: string;
  notas?: string;
  fecha_pago?: string;
}

// API functions
export const pagosAPI = {
  // Obtener pagos de un contrato específico
  async getByContrato(contratoId: number): Promise<Pago[]> {
    
    try {
      const response = await apiClient.get<Pago[]>(`/finanzas/contratos/${contratoId}/pagos`);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      throw error;
    }
  },

  // Crear un nuevo pago
  async create(contratoId: number, pago: Omit<PagoCreate, 'contrato_id'>): Promise<Pago> {
    
    try {
      const pagoData = {
        ...pago,
        contrato_id: contratoId
      };
      
      const response = await apiClient.post<Pago>(`/finanzas/contratos/${contratoId}/pagos`, pagoData);
      
      return response as Pago;
    } catch (error) {
      throw error;
    }
  },

  // Obtener todos los pagos (con filtros opcionales)
  async getAll(contratoId?: number): Promise<Pago[]> {
    
    try {
      const params = contratoId ? `?contrato_id=${contratoId}` : '';
      const response = await apiClient.get<Pago[]>(`/finanzas/pagos${params}`);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      throw error;
    }
  }
};