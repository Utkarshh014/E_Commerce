import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'vendor';
  isApprovedVendor?: boolean;
  vendorName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string, vendorName?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isVendor: boolean;
  isApprovedVendor: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!savedToken || !savedUser) {
      setIsLoading(false);
      return;
    }

    // Validate token is still accepted by the server
    api
      .get('/auth/profile', { headers: { Authorization: `Bearer ${savedToken}` } })
      .then((res) => {
        // Use fresh user data from server (reflects any approval status changes)
        setToken(savedToken);
        setUser(res.data.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
      })
      .catch(() => {
        // Token expired or revoked — clear stale session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, token: t } = res.data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const register = async (name: string, email: string, password: string, role?: string, vendorName?: string) => {
    const res = await api.post('/auth/register', { name, email, password, role, vendorName });
    const { user: u, token: t } = res.data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAdmin: user?.role === 'admin',
        isVendor: user?.role === 'vendor',
        isApprovedVendor: !!(user?.role === 'vendor' && user?.isApprovedVendor),
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};