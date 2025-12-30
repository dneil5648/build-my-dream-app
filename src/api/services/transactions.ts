import { apiClient } from '../client';
import { 
  Transaction,
  TransactionQueryParams,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export const transactionsService = {
  // List all transactions
  listTransactions: async (params?: TransactionQueryParams): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<Transaction[]>('/transactions', params as Record<string, unknown>);
    // The API returns pagination metadata, adapt the response
    return response as unknown as PaginatedResponse<Transaction>;
  },

  // Get transaction by ID
  getTransaction: async (id: string): Promise<ApiResponse<Transaction>> => {
    return apiClient.get<Transaction>(`/transactions/${id}`);
  },
};
