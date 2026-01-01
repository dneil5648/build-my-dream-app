import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/api';
import { CreateAccountRequest, ListQueryParams, PaxosAccount, AccountBalanceItem } from '@/api/types';

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
    refetchInterval: 10000, // Poll every 10 seconds for faster balance updates
  });
};

// Hook to fetch balances for all accounts in a module
export const useAllAccountsBalances = (accounts: PaxosAccount[]) => {
  const queries = useQueries({
    queries: accounts.map((account) => ({
      queryKey: accountKeys.balances(account.id),
      queryFn: () => accountService.getAccountBalances(account.id),
      enabled: !!account.id,
      refetchInterval: 10000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const allBalances: AccountBalanceItem[] = [];
  
  queries.forEach((query, index) => {
    const items = Array.isArray(query.data?.data?.items) ? query.data.data.items : [];
    // Attach account_id to each balance item for tracking
    const itemsWithAccountId = items.map(item => ({
      ...item,
      account_id: accounts[index]?.id
    }));
    allBalances.push(...itemsWithAccountId);
  });

  return { allBalances, isLoading };
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
