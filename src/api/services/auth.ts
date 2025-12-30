import { apiClient, setAuthToken, clearAuthToken, getApiConfig } from '../client';
import { 
  User, 
  UserRegistrationRequest, 
  LoginRequest,
  LoginResponse,
  UpdateUserRequest,
  ListQueryParams,
  ApiResponse,
} from '../types';

// Default backend URL for when no config is set
const DEFAULT_BACKEND_URL = 'https://glossiest-junko-tangential.ngrok-free.dev';

const getBaseUrl = (): string => {
  const config = getApiConfig();

  const configuredBaseUrl = config?.baseUrl?.trim();
  const isBrowser = typeof window !== 'undefined';
  const isLocalSite = isBrowser && window.location.hostname === 'localhost';
  const isConfiguredLocalhost = !!configuredBaseUrl && /^(http:\/\/localhost|https:\/\/localhost|http:\/\/127\.0\.0\.1|https:\/\/127\.0\.0\.1)/.test(configuredBaseUrl);

  if (configuredBaseUrl && (!isConfiguredLocalhost || isLocalSite)) {
    return configuredBaseUrl;
  }

  if (isLocalSite) {
    return '';
  }

  return DEFAULT_BACKEND_URL;
};

export const authService = {
  // Login - backend expects form data
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    // Backend expects application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('user_name', credentials.user_name);
    formData.append('password', credentials.password);

    const token = localStorage.getItem('auth_token');
    const baseUrl = getBaseUrl();

    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'ngrok-skip-browser-warning': 'true',
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const fetchResponse = await fetch(`${baseUrl}/users/login`, {
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
