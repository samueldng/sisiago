'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

// Rotas que não precisam de autenticação
const publicRoutes = ['/login'];

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se ainda está carregando, não fazer nada
    if (isLoading) return;

    // Se a rota é pública, permitir acesso
    if (publicRoutes.includes(pathname)) {
      return;
    }

    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Se tem role requerida e o usuário não tem a role
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, redirectTo, pathname]);

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se a rota é pública, mostrar conteúdo
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Se não está autenticado, não mostrar nada (vai redirecionar)
  if (!isAuthenticated) {
    return null;
  }

  // Se tem role requerida e o usuário não tem a role, não mostrar nada
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
