import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cryptoService } from '@/api';
import { 
  CreateCryptoAddressRequest, 
  CryptoWithdrawalFeeRequest,
  ListQueryParams 
} from '@/api/types';

export const cryptoKeys = {
  all: ['crypto'] as const,
  addresses: () => [...cryptoKeys.all, 'addresses'] as const,
  addressList: (params?: ListQueryParams) => [...cryptoKeys.addresses(), 'list', params] as const,
  addressDetail: (id: string) => [...cryptoKeys.addresses(), 'detail', id] as const,
};

export const useCryptoAddresses = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: cryptoKeys.addressList(params),
    queryFn: () => cryptoService.listCryptoAddresses(params),
  });
};

export const useCryptoAddress = (id: string) => {
  return useQuery({
    queryKey: cryptoKeys.addressDetail(id),
    queryFn: () => cryptoService.getCryptoAddress(id),
    enabled: !!id,
  });
};

export const useCreateCryptoAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCryptoAddressRequest) => cryptoService.createCryptoAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cryptoKeys.addresses() });
    },
  });
};

export const useCalculateWithdrawalFee = () => {
  return useMutation({
    mutationFn: (data: CryptoWithdrawalFeeRequest) => cryptoService.calculateWithdrawalFee(data),
  });
};
