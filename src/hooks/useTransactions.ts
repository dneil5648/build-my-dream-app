import { useQuery } from '@tanstack/react-query';
import { transactionsService } from '@/api';
import { TransactionQueryParams } from '@/api/types';

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params?: TransactionQueryParams) => [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

export const useTransactions = (params?: TransactionQueryParams) => {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsService.listTransactions(params),
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsService.getTransaction(id),
    enabled: !!id,
  });
};
