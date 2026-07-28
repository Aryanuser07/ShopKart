import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginWithTokens: (userData: User, tokens: any) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('shopkart_token');
      const savedUser = localStorage.getItem('shopkart_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const res = await api.get('/auth/me');
          if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('shopkart_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // Token expired or server unreachable, fallback to saved session
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithTokens = (userData: User, tokens: any) => {
    setUser(userData);
    localStorage.setItem('shopkart_token', tokens?.accessToken || 'token');
    localStorage.setItem('shopkart_user', JSON.stringify(userData));
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, tokens } = res.data;
    setUser(userData);
    localStorage.setItem('shopkart_token', tokens.accessToken);
    localStorage.setItem('shopkart_user', JSON.stringify(userData));
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { user: userData, tokens } = res.data;
    setUser(userData);
    localStorage.setItem('shopkart_token', tokens.accessToken);
    localStorage.setItem('shopkart_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shopkart_token');
    localStorage.removeItem('shopkart_user');
    localStorage.removeItem('shopkart_cart');
    window.dispatchEvent(new Event('shopkart-user-logout'));
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.put('/auth/profile', data);
    if (res.data.user) {
      setUser(res.data.user);
      localStorage.setItem('shopkart_user', JSON.stringify(res.data.user));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithTokens,
        logout,
        updateProfile,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
