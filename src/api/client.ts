import { ApiResponse } from './types';

// API Configuration stored in localStorage
const CONFIG_KEY = 'paxos_api_config';

export interface ApiConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  customerId: string;
  scope: string;
  environment: 'sandbox' | 'production';
}

export const getApiConfig = (): ApiConfig | null => {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const saveApiConfig = (config: ApiConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Default backend URL for when no config is set
const DEFAULT_BACKEND_URL = 'https://glossiest-junko-tangential.ngrok-free.dev';

// Base API client
class ApiClient {
  private getBaseUrl(): string {
    const isBrowser = typeof window !== 'undefined';
    const isLocalhost = isBrowser && window.location.hostname === 'localhost';
    
    // Only use Vite proxy (empty baseUrl) when running on localhost
    if (isLocalhost) {
      return '';
    }
    
    // For all other environments (preview, production), use the ngrok URL directly
    return DEFAULT_BACKEND_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = this.getBaseUrl();
    const token = getAuthToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
