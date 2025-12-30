import { apiClient } from '../client';
import { 
  PaxosIdentity, 
  CreateIdentityRequest,
  IdentityQueryParams,
  ApiResponse,
} from '../types';

export const identityService = {
  // List all identities
  listIdentities: async (params?: IdentityQueryParams): Promise<ApiResponse<PaxosIdentity[]>> => {
    return apiClient.get<PaxosIdentity[]>('/entities/identity', params as Record<string, unknown>);
  },

  // Get identity by ID
  getIdentity: async (id: string): Promise<ApiResponse<PaxosIdentity>> => {
    return apiClient.get<PaxosIdentity>(`/entities/identity/${id}`);
  },

  // Create identity
  createIdentity: async (data: CreateIdentityRequest): Promise<ApiResponse<PaxosIdentity>> => {
    return apiClient.post<PaxosIdentity>('/entities/identity', data);
  },
};
