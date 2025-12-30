import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/api/services/auth';
import { getAuthToken, clearAuthToken } from '@/api/client';
import { User as ApiUser } from '@/api/types';

interface User {
  id: string;
  user_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const token = getAuthToken();
      const userId = localStorage.getItem('user_id');

      if (token && userId) {
        try {
          // Fetch user details using stored user_id
          const response = await authService.getUser(userId);
          if (response.success && response.data) {
            setUser({
              id: response.data.id,
              user_name: response.data.user_name,
              role: response.data.role,
            });
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          clearAuthToken();
          localStorage.removeItem('user_id');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({
        user_name: username,
        password: password,
      });

      console.log('Login response:', response);
      console.log('Response data:', response.data);

      if (response.success && response.data) {
        // Backend returns { token, user_id }, need to fetch full user details
        const userId = (response.data as { user_id?: string; token?: string }).user_id;

        if (!userId) {
          throw new Error('No user_id in login response');
        }

        // Fetch full user details using the user_id
        const userResponse = await authService.getUser(userId);

        if (userResponse.success && userResponse.data) {
          // Store user_id for session restoration
          localStorage.setItem('user_id', userResponse.data.id);

          setUser({
            id: userResponse.data.id,
            user_name: userResponse.data.user_name,
            role: userResponse.data.role,
          });
        } else {
          throw new Error('Failed to fetch user details after login');
        }
      } else {
        console.error('Login failed - response:', response);
        throw new Error(`Login failed: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await authService.register({
        user_name: username,
        password: password,
      });

      if (response.success && response.data) {
        // After registration, automatically log in
        await login(username, password);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_id');
    authService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
