import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRole, ROLE_PERMISSIONS } from './lib/permissions';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

// Rotas protegidas por role
const PROTECTED_ROUTES = {
  '/users': ['admin', 'manager'],
  '/audit': ['admin'],
  '/system': ['admin'],
  '/reports': ['admin', 'manager'],
} as const;

export async function middleware(request: NextRequest) {
  // Rotas que não precisam de autenticação
  const publicPaths = ['/login', '/api/auth/login'];
  
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as UserRole;
    const userId = payload.userId as string;
    
    // Verifica se o usuário tem permissão para acessar a rota
    const pathname = request.nextUrl.pathname;
    const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route => 
      pathname.startsWith(route)
    );
    
    if (protectedRoute) {
      const allowedRoles = PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES];
      if (!allowedRoles.includes(userRole)) {
        // Redireciona para página de acesso negado ou dashboard
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
      }
    }
    
    // Adiciona informações do usuário aos headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId);
    requestHeaders.set('x-user-role', userRole);
    requestHeaders.set('x-user-permissions', JSON.stringify(ROLE_PERMISSIONS[userRole] || []));
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/((?!auth/login).*)',
  ],
};