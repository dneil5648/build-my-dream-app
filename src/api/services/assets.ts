import { apiClient } from '../client';
import { 
  ConvertAssetRequest,
  WithdrawAssetRequest,
  ApiResponse,
} from '../types';

export const assetsService = {
  // Convert assets within the same profile
  convertAssets: async (data: ConvertAssetRequest): Promise<ApiResponse<void>> => {
    return apiClient.post<void>('/assets/convert', data);
  },

  // Withdraw or transfer assets
  withdrawAssets: async (data: WithdrawAssetRequest): Promise<ApiResponse<void>> => {
    return apiClient.post<void>('/assets/withdraw', data);
  },
};
