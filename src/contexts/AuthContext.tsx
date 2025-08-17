'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: (signal?: AbortSignal) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const isAuthenticated = !!user;

  // Verificar autenticação ao carregar a aplicação
  const checkAuth = async (signal?: AbortSignal) => {
    // Evitar chamadas duplicadas
    if (isCheckingAuth) {
      return;
    }
    
    setIsCheckingAuth(true);
    
    try {

      // Verificar se a requisição foi cancelada
      if (signal?.aborted) {
        return;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // Ignorar erros de cancelamento
      if (error.name === 'AbortError') {
        return;
      }
      
      // Silenciar erro em desenvolvimento para evitar logs duplicados do React Strict Mode
      if (process.env.NODE_ENV === 'development') {
        console.debug('Auth check:', error.message);
      } else {
        console.error('Erro ao verificar autenticação:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erro ao fazer login' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    const controller = new AbortController();
    checkAuth(controller.signal);
    
    return () => {
      controller.abort();
    };
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para verificar se o usuário tem uma role específica
export function useRole(requiredRole: string) {
  const { user } = useAuth();
  return user?.role === requiredRole;
}

// Hook para verificar se o usuário é admin
export function useIsAdmin() {
  return useRole('admin');
}

// Hook para verificar se o usuário é manager ou admin
export function useIsManager() {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.role === 'manager';
}