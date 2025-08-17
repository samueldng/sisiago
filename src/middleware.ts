import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Usar jose em vez de jsonwebtoken para compatibilidade com Edge Runtime

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Rotas que não precisam de autenticação
const publicPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/login',
  '/_next',
  '/favicon.ico',
  '/manifest.json'
];

// Rotas que todos os usuários autenticados podem acessar
const authenticatedUserPaths = [
  '/api/auth/verify',      // Verificação de autenticação
  '/api/products/expired', // Produtos vencidos - usado no dashboard
  '/api/dashboard/stats'   // Estatísticas do dashboard
];

// Rotas que precisam de role específica
const adminOnlyPaths = [
  '/api/users',
  '/api/audit-logs'
];

const managerPaths = [
  '/api/products',
  '/api/categories',
  '/api/sales'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota pública
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );

  // Obter token do cookie para verificar se usuário está autenticado
  const token = request.cookies.get('auth-token')?.value;

  // Se é a página de login e o usuário já está autenticado, redirecionar para home
  if (pathname === '/login' && token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      // Token válido, redirecionar usuário autenticado para home
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      // Token inválido, permitir acesso à página de login
      return NextResponse.next();
    }
  }

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Token já foi obtido acima

  if (!token) {
    // Se é uma página, redirecionar para login
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Se é API, retornar 401
    return NextResponse.json(
      { error: 'Token de autenticação necessário' },
      { status: 401 }
    );
  }

  try {
    // Verificar e decodificar o token
    console.log('🔍 Middleware - Token recebido:', token ? 'Presente' : 'Ausente');
    console.log('🔑 JWT_SECRET:', JWT_SECRET ? 'Configurado' : 'Não configurado');
    
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const decoded = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string
    };
    
    console.log('✅ Token decodificado:', { userId: decoded.userId, role: decoded.role });

    // Verificar se é uma rota que todos os usuários autenticados podem acessar
    const isAuthenticatedUserPath = authenticatedUserPaths.some(path => 
      pathname.startsWith(path)
    );

    // Se é uma rota para usuários autenticados, permitir acesso
    if (isAuthenticatedUserPath) {
      // Continuar para adicionar headers e permitir acesso
    } else {
      // Verificar permissões para rotas específicas
      const isAdminOnlyPath = adminOnlyPaths.some(path => 
        pathname.startsWith(path)
      );
      
      const isManagerPath = managerPaths.some(path => 
        pathname.startsWith(path)
      );

      // Se é rota apenas para admin e usuário não é admin
      if (isAdminOnlyPath && decoded.role !== 'admin') {
        if (!pathname.startsWith('/api/')) {
          return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.json(
          { error: 'Acesso negado. Apenas administradores.' },
          { status: 403 }
        );
      }

      // Se é rota para manager e usuário não é manager nem admin
      if (isManagerPath && !['admin', 'manager'].includes(decoded.role)) {
        if (!pathname.startsWith('/api/')) {
          return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.json(
          { error: 'Acesso negado. Permissão insuficiente.' },
          { status: 403 }
        );
      }
    }

    // Adicionar informações do usuário aos headers para as APIs
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    
    // Token inválido
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};