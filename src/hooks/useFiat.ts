import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fiatService } from '@/api';
import { 
  RegisterFiatAccountRequest, 
  CreateFiatDepositInstructionsRequest,
  CreateSandboxDepositRequest,
  ListQueryParams 
} from '@/api/types';

export const fiatKeys = {
  all: ['fiat'] as const,
  accounts: () => [...fiatKeys.all, 'accounts'] as const,
  accountList: (params?: ListQueryParams) => [...fiatKeys.accounts(), 'list', params] as const,
  accountDetail: (id: string) => [...fiatKeys.accounts(), 'detail', id] as const,
  instructions: () => [...fiatKeys.all, 'instructions'] as const,
  instructionList: (params?: ListQueryParams) => [...fiatKeys.instructions(), 'list', params] as const,
  instructionDetail: (id: string) => [...fiatKeys.instructions(), 'detail', id] as const,
};

// Fiat Accounts
export const useFiatAccounts = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: fiatKeys.accountList(params),
    queryFn: () => fiatService.listFiatAccounts(params),
  });
};

export const useFiatAccount = (id: string) => {
  return useQuery({
    queryKey: fiatKeys.accountDetail(id),
    queryFn: () => fiatService.getFiatAccount(id),
    enabled: !!id,
  });
};

export const useRegisterFiatAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterFiatAccountRequest) => fiatService.registerFiatAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fiatKeys.accounts() });
    },
  });
};

// Deposit Instructions
export const useDepositInstructions = (params?: ListQueryParams & { 
  account_type?: string; 
  instruction_type?: string;
}) => {
  return useQuery({
    queryKey: fiatKeys.instructionList(params),
    queryFn: () => fiatService.listDepositInstructions(params),
  });
};

export const useDepositInstruction = (id: string) => {
  return useQuery({
    queryKey: fiatKeys.instructionDetail(id),
    queryFn: () => fiatService.getDepositInstruction(id),
    enabled: !!id,
  });
};

export const useCreateDepositInstructions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFiatDepositInstructionsRequest) => fiatService.createDepositInstructions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fiatKeys.instructions() });
    },
  });
};

// Sandbox
export const useSandboxDeposit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSandboxDepositRequest) => fiatService.createSandboxDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fiatKeys.all });
    },
  });
};
