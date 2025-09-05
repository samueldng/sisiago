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
      console.log('🔍 AuthContext: Verificação já em andamento, ignorando...');
      return;
    }
    
    console.log('🔍 AuthContext: Verificando autenticação...');
    setIsCheckingAuth(true);
    
    try {
      // Verificar se a requisição foi cancelada
      if (signal?.aborted) {
        console.log('🔍 AuthContext: Requisição cancelada');
        return;
      }

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 AuthContext: Status da resposta:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 AuthContext: Dados da verificação:', data);
        if (data.user && data.authenticated) {
          console.log('✅ AuthContext: Usuário autenticado:', data.user.email);
          setUser(data.user);
        } else {
          console.log('❌ AuthContext: Dados de autenticação inválidos');
          setUser(null);
        }
      } else {
        // Log específico para diferentes tipos de erro
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.log('❌ AuthContext: Falha na autenticação, status:', response.status);
        console.log('❌ AuthContext: Detalhes do erro:', errorData);
        
        if (response.status === 500 && errorData.code === 'JWT_CONFIG_ERROR') {
          console.error('Erro de configuração JWT. Verifique as variáveis de ambiente.');
        } else if (response.status === 401) {
          console.debug('Token inválido ou expirado:', errorData.code);
        }
        
        setUser(null);
      }
    } catch (error: any) {
      // Ignorar erros de cancelamento
      if (error.name === 'AbortError') {
        console.log('🔍 AuthContext: Requisição cancelada (AbortError)');
        return;
      }
      
      // Tratamento específico para diferentes tipos de erro
      if (error.message?.includes('fetch')) {
        console.error('❌ AuthContext: Erro de conexão com a API de autenticação:', error.message);
      } else {
        console.error('❌ AuthContext: Erro ao verificar autenticação:', error);
      }
      
      setUser(null);
    } finally {
      console.log('🔍 AuthContext: Finalizando verificação de autenticação');
      setIsLoading(false);
      setIsCheckingAuth(false);
    }
  };

  // Login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔑 AuthContext: Iniciando login para:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      console.log('🔑 AuthContext: Status da resposta de login:', response.status);
      const data = await response.json();
      console.log('🔑 AuthContext: Dados da resposta:', data);

      if (response.ok && data.success && data.user) {
        console.log('✅ AuthContext: Login bem-sucedido, definindo usuário:', data.user.email);
        setUser(data.user);
        return { success: true };
      } else {
        console.log('❌ AuthContext: Falha no login:', data.error || 'Credenciais inválidas');
        return { success: false, error: data.error || 'Credenciais inválidas' };
      }
    } catch (error: any) {
      console.error('❌ AuthContext: Erro no login:', error);
      
      if (error.message?.includes('fetch')) {
        return { success: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
      }
      
      return { success: false, error: 'Erro interno. Tente novamente.' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
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