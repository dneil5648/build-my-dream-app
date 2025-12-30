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
    return apiClient.get<CryptoAddress[]>('/crypto/deposit-address', params as Record<string, unknown>);
  },

  // Get crypto address by ID
  getCryptoAddress: async (id: string): Promise<ApiResponse<CryptoAddress>> => {
    return apiClient.get<CryptoAddress>(`/crypto/deposit-address/${id}`);
  },

  // Create crypto deposit address
  createCryptoAddress: async (data: CreateCryptoAddressRequest): Promise<ApiResponse<CryptoAddress>> => {
    return apiClient.post<CryptoAddress>('/crypto/deposit-address', data);
  },

  // Calculate withdrawal fee
  calculateWithdrawalFee: async (data: CryptoWithdrawalFeeRequest): Promise<ApiResponse<{ fee: string; asset: string }>> => {
    return apiClient.post<{ fee: string; asset: string }>('/crypto/fee', data);
  },
};
