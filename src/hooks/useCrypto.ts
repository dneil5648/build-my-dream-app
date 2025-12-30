import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cryptoService } from '@/api';
import { 
  CreateCryptoAddressRequest, 
  CryptoWithdrawalFeeRequest,
  CreateCryptoDestinationAddressRequest,
  ListQueryParams 
} from '@/api/types';

export const cryptoKeys = {
  all: ['crypto'] as const,
  addresses: () => [...cryptoKeys.all, 'addresses'] as const,
  addressList: (params?: ListQueryParams) => [...cryptoKeys.addresses(), 'list', params] as const,
  addressDetail: (id: string) => [...cryptoKeys.addresses(), 'detail', id] as const,
  destinations: () => [...cryptoKeys.all, 'destinations'] as const,
  destinationList: (params?: ListQueryParams) => [...cryptoKeys.destinations(), 'list', params] as const,
  destinationDetail: (id: string) => [...cryptoKeys.destinations(), 'detail', id] as const,
};

// ============= Crypto Deposit Addresses =============

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

// ============= Crypto Destination Addresses =============

export const useCryptoDestinationAddresses = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: cryptoKeys.destinationList(params),
    queryFn: () => cryptoService.listDestinationAddresses(params),
  });
};

export const useCryptoDestinationAddress = (id: string) => {
  return useQuery({
    queryKey: cryptoKeys.destinationDetail(id),
    queryFn: () => cryptoService.getDestinationAddress(id),
    enabled: !!id,
  });
};

export const useCreateCryptoDestinationAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCryptoDestinationAddressRequest) => cryptoService.createDestinationAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cryptoKeys.destinations() });
    },
  });
};

// ============= Withdrawal Operations =============

export const useCalculateWithdrawalFee = () => {
  return useMutation({
    mutationFn: (data: CryptoWithdrawalFeeRequest) => cryptoService.calculateWithdrawalFee(data),
  });
};
