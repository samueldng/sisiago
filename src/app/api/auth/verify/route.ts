import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Obter token do cookie
    const token = request.cookies.get('auth-token')?.value;
    console.log('🔍 Verificação - Token recebido:', token ? 'Presente' : 'Ausente');
    console.log('🍪 Cookies disponíveis:', request.cookies.getAll().map(c => c.name));

    if (!token) {
      console.log('❌ Token não encontrado nos cookies');
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      );
    }

    // Verificar e decodificar o token usando jose (mesma lib do middleware)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const decoded = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string
    };

    // Buscar usuário atualizado no banco
    const { data: user, error } = await db.users.findById(decoded.userId);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Retornar dados do usuário (sem senha)
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      authenticated: true
    });

  } catch (error) {
    console.error('Erro na verificação de token:', error);
    
    if (error.name === 'JWTExpired' || error.name === 'JWTInvalid') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}