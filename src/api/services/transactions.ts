import { apiClient } from '../client';
import { 
  Transaction,
  TransactionQueryParams,
  ApiResponse,
  TransactionsApiResponse,
} from '../types';

export const transactionsService = {
  // List all transactions
  listTransactions: async (params?: TransactionQueryParams): Promise<TransactionsApiResponse> => {
    const response = await apiClient.get<TransactionsApiResponse>('/transactions', params as Record<string, unknown>);
    return response as unknown as TransactionsApiResponse;
  },

  // Get transaction by ID
  getTransaction: async (id: string): Promise<ApiResponse<Transaction>> => {
    return apiClient.get<Transaction>(`/transactions/${id}`);
  },
};
