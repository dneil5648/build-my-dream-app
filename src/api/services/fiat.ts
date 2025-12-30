import { apiClient } from '../client';
import { 
  FiatAccount, 
  RegisterFiatAccountRequest,
  FiatDepositInstructions,
  CreateFiatDepositInstructionsRequest,
  CreateSandboxDepositRequest,
  ListQueryParams,
  ApiResponse,
} from '../types';

export const fiatService = {
  // ============= Fiat Accounts =============

  // List all fiat accounts
  listFiatAccounts: async (params?: ListQueryParams): Promise<ApiResponse<FiatAccount[]>> => {
    return apiClient.get<FiatAccount[]>('/assets/fiat/accounts', params as Record<string, unknown>);
  },

  // Get fiat account by ID
  getFiatAccount: async (id: string): Promise<ApiResponse<FiatAccount>> => {
    return apiClient.get<FiatAccount>(`/assets/fiat/accounts/${id}`);
  },

  // Register fiat account
  registerFiatAccount: async (data: RegisterFiatAccountRequest): Promise<ApiResponse<FiatAccount>> => {
    return apiClient.post<FiatAccount>('/assets/fiat/accounts', data);
  },

  // ============= Deposit Instructions =============

  // List all deposit instructions
  listDepositInstructions: async (params?: ListQueryParams & {
    account_type?: string;
    instruction_type?: string;
  }): Promise<ApiResponse<FiatDepositInstructions[]>> => {
    return apiClient.get<FiatDepositInstructions[]>('/assets/fiat/deposit-instructions', params as Record<string, unknown>);
  },

  // Get deposit instruction by ID
  getDepositInstruction: async (id: string): Promise<ApiResponse<FiatDepositInstructions>> => {
    return apiClient.get<FiatDepositInstructions>(`/assets/fiat/deposit-instructions/${id}`);
  },

  // Create deposit instructions
  createDepositInstructions: async (data: CreateFiatDepositInstructionsRequest): Promise<ApiResponse<FiatDepositInstructions>> => {
    return apiClient.post<FiatDepositInstructions>('/assets/fiat/deposit-instructions', data);
  },

  // ============= Sandbox =============

  // Create sandbox deposit
  createSandboxDeposit: async (data: CreateSandboxDepositRequest): Promise<ApiResponse<void>> => {
    return apiClient.post<void>('/assets/fiat/sandbox-deposit', data);
  },
};
