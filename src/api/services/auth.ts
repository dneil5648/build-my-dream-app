import { apiClient, setAuthToken, clearAuthToken } from '../client';
import { 
  User, 
  UserRegistrationRequest, 
  LoginRequest,
  LoginResponse,
  UpdateUserRequest,
  ListQueryParams,
  ApiResponse,
} from '../types';

export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<LoginResponse>('/users/login', credentials);
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  // Register
  register: async (data: UserRegistrationRequest): Promise<ApiResponse<User>> => {
    return apiClient.post<User>('/users/register', data);
  },

  // Logout
  logout: (): void => {
    clearAuthToken();
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<User>('/users/me');
  },

  // List users (admin)
  listUsers: async (params?: ListQueryParams): Promise<ApiResponse<User[]>> => {
    return apiClient.get<User[]>('/users', params as Record<string, unknown>);
  },

  // Get user by ID
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    return apiClient.put<User>(`/users/${id}`, data);
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/users/${id}`);
  },
};
