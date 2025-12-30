import { useQuery } from '@tanstack/react-query';
import { transactionsService } from '@/api';
import { TransactionQueryParams, Transaction } from '@/api/types';

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params?: TransactionQueryParams) => [...transactionKeys.lists(), params] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

// Helper to extract transactions array from API response
const extractTransactions = (response: any): Transaction[] => {
  if (!response?.data) return [];
  // Handle nested { transactions: [...] } format
  if (response.data.transactions && Array.isArray(response.data.transactions)) {
    return response.data.transactions;
  }
  // Handle flat array format
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

export const useTransactions = (params?: TransactionQueryParams) => {
  const query = useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsService.listTransactions(params),
  });

  return {
    ...query,
    // Provide normalized transactions array
    transactions: extractTransactions(query.data),
  };
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsService.getTransaction(id),
    enabled: !!id,
  });
};
