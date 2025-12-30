import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '@/api';
import { ConvertAssetRequest, WithdrawAssetRequest } from '@/api/types';
import { accountKeys } from './useAccounts';

export const useConvertAssets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ConvertAssetRequest) => assetsService.convertAssets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};

export const useWithdrawAssets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WithdrawAssetRequest) => assetsService.withdrawAssets(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};
