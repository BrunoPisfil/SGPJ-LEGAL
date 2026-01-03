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
    console.log('🚀 Getting pagos for contrato:', contratoId);
    
    try {
      const response = await apiClient.get<Pago[]>(`/finanzas/contratos/${contratoId}/pagos`);
      console.log('✅ Pagos response:', response);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Error in getByContrato:', error);
      throw error;
    }
  },

  // Crear un nuevo pago
  async create(contratoId: number, pago: Omit<PagoCreate, 'contrato_id'>): Promise<Pago> {
    console.log('🚀 Creating pago for contrato:', contratoId, 'Data:', pago);
    
    try {
      const pagoData = {
        ...pago,
        contrato_id: contratoId
      };
      
      const response = await apiClient.post<Pago>(`/finanzas/contratos/${contratoId}/pagos`, pagoData);
      console.log('✅ Pago created:', response);
      
      return response as Pago;
    } catch (error) {
      console.error('❌ Error in create:', error);
      throw error;
    }
  },

  // Obtener todos los pagos (con filtros opcionales)
  async getAll(contratoId?: number): Promise<Pago[]> {
    console.log('🚀 Getting all pagos, contrato filter:', contratoId);
    
    try {
      const params = contratoId ? `?contrato_id=${contratoId}` : '';
      const response = await apiClient.get<Pago[]>(`/finanzas/pagos${params}`);
      console.log('✅ All pagos response:', response);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Error in getAll:', error);
      throw error;
    }
  }
};