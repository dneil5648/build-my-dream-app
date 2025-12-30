import { apiClient } from '../client';
import { 
  CryptoAddress, 
  CreateCryptoAddressRequest,
  CryptoWithdrawalFeeRequest,
  ListQueryParams,
  ApiResponse,
} from '../types';

export const cryptoService = {
  // List all crypto deposit addresses
  listCryptoAddresses: async (params?: ListQueryParams): Promise<ApiResponse<CryptoAddress[]>> => {
    return apiClient.get<CryptoAddress[]>('/assets/crypto/deposit-address', params as Record<string, unknown>);
  },

  // Get crypto address by ID
  getCryptoAddress: async (id: string): Promise<ApiResponse<CryptoAddress>> => {
    return apiClient.get<CryptoAddress>(`/assets/crypto/deposit-address/${id}`);
  },

  // Create crypto deposit address
  createCryptoAddress: async (data: CreateCryptoAddressRequest): Promise<ApiResponse<CryptoAddress>> => {
    return apiClient.post<CryptoAddress>('/assets/crypto/deposit-address', data);
  },

  // Calculate withdrawal fee
  calculateWithdrawalFee: async (data: CryptoWithdrawalFeeRequest): Promise<ApiResponse<{ fee: string; asset: string }>> => {
    return apiClient.post<{ fee: string; asset: string }>('/assets/crypto/withdraw/fee', data);
  },

  // Create withdrawal
  createWithdrawal: async (data: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    return apiClient.post<unknown>('/assets/withdraw', data);
  },

  // Create conversion
  createConversion: async (data: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    return apiClient.post<unknown>('/assets/convert', data);
  },
};
