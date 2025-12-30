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

  // Create identity - backend expects different endpoints for individual vs institution
  createIdentity: async (data: CreateIdentityRequest): Promise<ApiResponse<PaxosIdentity>> => {
    const endpoint = data.type === 'INDIVIDUAL'
      ? '/entities/identity/individual'
      : '/entities/identity/institution';

    // Backend expects the identity data directly, not wrapped in type/individual/institution
    const payload = data.type === 'INDIVIDUAL' ? data.individual : data.institution;

    return apiClient.post<PaxosIdentity>(endpoint, payload);
  },
};
