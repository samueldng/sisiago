import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Buscar usuário no banco
    const { data: user, error: userError } = await db.users.findByEmail(validatedData.email);

    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    // Criar resposta com cookie httpOnly
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
    });

    // Definir cookie httpOnly para o token
    console.log('🍪 Definindo cookie auth-token para produção:', process.env.NODE_ENV === 'production');
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/' // Garantir que o cookie seja válido para todo o site
    });
    
    console.log('✅ Cookie definido com sucesso');

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}