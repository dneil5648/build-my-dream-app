import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { identityService } from '@/api';
import { CreateIdentityRequest, IdentityQueryParams } from '@/api/types';

export const identityKeys = {
  all: ['identities'] as const,
  lists: () => [...identityKeys.all, 'list'] as const,
  list: (params?: IdentityQueryParams) => [...identityKeys.lists(), params] as const,
  details: () => [...identityKeys.all, 'detail'] as const,
  detail: (id: string) => [...identityKeys.details(), id] as const,
};

export const useIdentities = (params?: IdentityQueryParams) => {
  return useQuery({
    queryKey: identityKeys.list(params),
    queryFn: () => identityService.listIdentities(params),
  });
};

export const useIdentity = (id: string) => {
  return useQuery({
    queryKey: identityKeys.detail(id),
    queryFn: () => identityService.getIdentity(id),
    enabled: !!id,
  });
};

export const useCreateIdentity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateIdentityRequest) => identityService.createIdentity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.lists() });
    },
  });
};
