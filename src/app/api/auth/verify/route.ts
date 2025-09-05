import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Função para criar resposta com headers CORS
function createResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status });
  
  // Adicionar headers CORS
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se JWT_SECRET está configurado
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
      console.error('JWT_SECRET não está configurado corretamente');
      return createResponse(
        { error: 'Configuração de autenticação inválida', code: 'JWT_CONFIG_ERROR' },
        500
      );
    }

    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return createResponse(
        { error: 'Token não encontrado', code: 'NO_TOKEN' },
        401
      );
    }

    // Verificar o token JWT usando jose (mesma lib do middleware)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Extrair dados do usuário do token
    const user = {
      id: payload.userId as string || '1',
      name: payload.name as string || 'Administrador',
      email: payload.email as string || 'admin@sisiago.com',
      role: payload.role as string || 'admin',
      created_at: payload.created_at as string || new Date().toISOString(),
      updated_at: payload.updated_at as string || new Date().toISOString()
    };

    return createResponse({
      user,
      authenticated: true
    });
  } catch (error: any) {
    console.error('Erro na verificação do token:', error);
    
    // Diferentes tipos de erro
    if (error.code === 'ERR_JWT_EXPIRED') {
      return createResponse(
        { error: 'Token expirado', code: 'TOKEN_EXPIRED' },
        401
      );
    }
    
    if (error.code === 'ERR_JWT_INVALID') {
      return createResponse(
        { error: 'Token inválido', code: 'TOKEN_INVALID' },
        401
      );
    }
    
    return createResponse(
      { error: 'Erro na verificação de autenticação', code: 'AUTH_ERROR' },
      401
    );
  }
}

// Adicionar suporte para OPTIONS (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return createResponse({}, 200);
}