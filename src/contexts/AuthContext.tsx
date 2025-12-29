import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
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
    const storedUser = localStorage.getItem('paxos_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in production, this would call the API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
    };
    
    setUser(mockUser);
    localStorage.setItem('paxos_user', JSON.stringify(mockUser));
    localStorage.setItem('paxos_token', 'mock_jwt_token');
  };

  const register = async (email: string, password: string, name: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email,
      name,
    };
    
    setUser(mockUser);
    localStorage.setItem('paxos_user', JSON.stringify(mockUser));
    localStorage.setItem('paxos_token', 'mock_jwt_token');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('paxos_user');
    localStorage.removeItem('paxos_token');
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
