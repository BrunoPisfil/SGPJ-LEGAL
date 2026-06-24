'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

// Funciones para manejar persistencia de usuario
const STORAGE_KEY = 'sgpj_user';

function saveUserToStorage(user: User | null) {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

function getUserFromStorage(): User | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        return user;
      }
    } catch (error) {
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionExpiredReason, setSessionExpiredReason] = useState<'inactivity' | 'unauthorized'>('unauthorized');

  // Verificar autenticación al cargar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Primero intentar recuperar del localStorage
        const storedUser = getUserFromStorage();
        
        if (authAPI.isAuthenticated()) {
          if (storedUser) {
            // Usar datos del localStorage como estado inicial
            setUser(storedUser);
            
            // En background, verificar que el token siga válido
            try {
              const serverUser = await authAPI.getCurrentUser();
              // Si los datos cambió en el servidor, actualizar
              if (JSON.stringify(serverUser) !== JSON.stringify(storedUser)) {
                setUser(serverUser);
                saveUserToStorage(serverUser);
              }
            } catch (error) {
            }
          } else {
            // Si no hay usuario en localStorage pero hay token, obtener del servidor
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            saveUserToStorage(userData);
          }
        } else {
        }
      } catch (error) {
        authAPI.logout();
        saveUserToStorage(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    // Configurar el callback para errores 401
    setUnauthorizedHandler(() => {
      setSessionExpired(true);
      setSessionExpiredReason('unauthorized');
      setUser(null);
      saveUserToStorage(null);
    });
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user);
      saveUserToStorage(response.user);
      setSessionExpired(false);
    } catch (error) {
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    saveUserToStorage(null);
    setSessionExpired(false);
  };

  const refreshUser = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        saveUserToStorage(userData);
      }
    } catch (error) {
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
