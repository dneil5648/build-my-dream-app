import { apiClient } from '../client';
import { 
  CryptoAddress, 
  CreateCryptoAddressRequest,
  CryptoWithdrawalFeeRequest,
  CryptoWithdrawalFeeResponse,
  CreateCryptoDestinationAddressRequest,
  CryptoDestinationAddress,
  ListQueryParams,
  ApiResponse,
} from '../types';

export const cryptoService = {
  // ============= Crypto Deposit Addresses =============

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

  // ============= Crypto Destination Addresses (Withdrawal Addresses) =============

  // List all destination addresses
  listDestinationAddresses: async (params?: ListQueryParams): Promise<ApiResponse<CryptoDestinationAddress[]>> => {
    return apiClient.get<CryptoDestinationAddress[]>('/assets/crypto/destination-address', params as Record<string, unknown>);
  },

  // Get destination address by ID
  getDestinationAddress: async (id: string): Promise<ApiResponse<CryptoDestinationAddress>> => {
    return apiClient.get<CryptoDestinationAddress>(`/assets/crypto/destination-address/${id}`);
  },

  // Create destination address
  createDestinationAddress: async (data: CreateCryptoDestinationAddressRequest): Promise<ApiResponse<CryptoDestinationAddress>> => {
    return apiClient.post<CryptoDestinationAddress>('/assets/crypto/destination-address', data);
  },

  // ============= Withdrawal Operations =============

  // Calculate withdrawal fee
  calculateWithdrawalFee: async (data: CryptoWithdrawalFeeRequest): Promise<ApiResponse<CryptoWithdrawalFeeResponse>> => {
    return apiClient.post<CryptoWithdrawalFeeResponse>('/assets/crypto/withdraw/fee', data);
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
