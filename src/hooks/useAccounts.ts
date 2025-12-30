import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/api';
import { CreateAccountRequest, ListQueryParams } from '@/api/types';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (params?: ListQueryParams) => [...accountKeys.lists(), params] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  balances: (id: string) => [...accountKeys.all, 'balances', id] as const,
};

export const useAccounts = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: accountKeys.list(params),
    queryFn: () => accountService.listAccounts(params),
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountService.getAccount(id),
    enabled: !!id,
  });
};

export const useAccountBalances = (id: string) => {
  return useQuery({
    queryKey: accountKeys.balances(id),
    queryFn: () => accountService.getAccountBalances(id),
    enabled: !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
};
