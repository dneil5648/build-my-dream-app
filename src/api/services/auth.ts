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
  // Login - backend expects form data
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    // Backend expects application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('user_name', credentials.user_name);
    formData.append('password', credentials.password);

    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Use relative URL to leverage Vite proxy in development
    const fetchResponse = await fetch('/users/login', {
      method: 'POST',
      headers,
      body: formData.toString(),
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      throw new Error(errorText || `HTTP error! status: ${fetchResponse.status}`);
    }

    const response: ApiResponse<LoginResponse> = await fetchResponse.json();

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
