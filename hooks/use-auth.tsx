'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authAPI, User, LoginRequest, RegisterRequest } from '@/lib/auth';
import { setUnauthorizedHandler } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  sessionExpired: boolean;
  sessionExpiredReason?: 'inactivity' | 'unauthorized';
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionExpiredReason, setSessionExpiredReason] = useState<'inactivity' | 'unauthorized'>('unauthorized');

  // Manejar sesión expirada por inactividad o error 401
  const handleSessionExpired = useCallback((reason: 'inactivity' | 'unauthorized' = 'unauthorized') => {
    console.log(`⏰ Sesión expirada por: ${reason}`);
    setSessionExpired(true);
    setSessionExpiredReason(reason);
    // Limpiar usuario
    setUser(null);
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
    
    // Configurar el callback para errores 401 en el APIClient
    setUnauthorizedHandler(() => {
      handleSessionExpired('unauthorized');
    });
  }, [handleSessionExpired]);

  const checkAuth = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      authAPI.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user);
      // Limpiar estado de sesión expirada
      setSessionExpired(false);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      await authAPI.register(userData);
      // Después del registro, hacer login automáticamente
      await login({ email: userData.email, password: userData.password });
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setSessionExpired(false);
  };

  const refreshUser = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error);
      logout();
    }
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    sessionExpired,
    sessionExpiredReason,
    clearSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}