'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Registrar el handler de unauthorized
  const registerUnauthorizedHandler = () => {
    // Limpiar el anterior si existe
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    // Registrar el nuevo handler
    const unsubscribe = setUnauthorizedHandler(() => {
      console.log(`⏰ Sesión expirada por: unauthorized`);
      setSessionExpired(true);
      setSessionExpiredReason('unauthorized');
      setUser(null);
    });
    unsubscribeRef.current = unsubscribe || null;
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
          // Registrar handler cuando hay sesión
          registerUnauthorizedHandler();
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        authAPI.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Cleanup: remover el handler cuando el componente se desmonte
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user);
      // Registrar el handler para el nuevo usuario
      registerUnauthorizedHandler();
      // Limpiar estado de sesión expirada
      setSessionExpired(false);
      // Recargar la página después de login para asegurar hidratación correcta
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
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
    // Limpiar estado ANTES de limpiar el handler
    setUser(null);
    setSessionExpired(false);
    // Limpiar el handler al hacer logout
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    // Registrar un nuevo handler vacío para después del logout
    setUnauthorizedHandler(() => {
      // No hacer nada después del logout
      console.log('⏰ Solicitud no autenticada después de logout');
    });
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