import { apiClient } from '../client';
import { 
  PaxosAccount, 
  CreateAccountRequest,
  AccountBalance,
  ListQueryParams,
  ApiResponse,
} from '../types';

export const accountService = {
  // List all accounts
  listAccounts: async (params?: ListQueryParams): Promise<ApiResponse<PaxosAccount[]>> => {
    return apiClient.get<PaxosAccount[]>('/entities/account', params as Record<string, unknown>);
  },

  // Get account by ID
  getAccount: async (id: string): Promise<ApiResponse<PaxosAccount>> => {
    return apiClient.get<PaxosAccount>(`/entities/account/${id}`);
  },

  // Create account
  createAccount: async (data: CreateAccountRequest): Promise<ApiResponse<PaxosAccount>> => {
    return apiClient.post<PaxosAccount>('/entities/account', data);
  },

  // Get account balances
  getAccountBalances: async (id: string): Promise<ApiResponse<AccountBalance[]>> => {
    return apiClient.get<AccountBalance[]>(`/entities/account/${id}/balances`);
  },
};
