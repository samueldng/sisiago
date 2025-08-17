import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { auditLogger } from '@/middleware/auditMiddleware';
import { z } from 'zod';

// Schema de validação para alteração de status/role
const statusRoleSchema = z.object({
  is_active: z.boolean().optional(),
  role: z.enum(['admin', 'manager', 'user']).optional()
}).refine(data => data.is_active !== undefined || data.role !== undefined, {
  message: "Pelo menos um campo (is_active ou role) deve ser fornecido"
});

type StatusRoleUpdate = z.infer<typeof statusRoleSchema>;

// PATCH - Alterar status ou role do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const currentUserId = request.headers.get('x-user-id');
    
    // Apenas admin pode alterar status/role de usuários
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem alterar status/role de usuários.' },
        { status: 403 }
      );
    }

    // Admin não pode alterar seu próprio status
    if (currentUserId === params.id) {
      return NextResponse.json(
        { error: 'Você não pode alterar seu próprio status ou role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validatedData = statusRoleSchema.parse(body);

    // Verificar se o usuário existe
    const { data: existingUser, error: findError } = await db.users.findById(params.id);
    
    if (findError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (validatedData.is_active !== undefined) {
      updateData.is_active = validatedData.is_active;
    }
    
    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
    }

    // Atualizar usuário
    const { data: updatedUser, error } = await db.users.update(params.id, updateData);

    if (error) {
      console.error('Erro ao atualizar status/role do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status/role do usuário' },
        { status: 500 }
      );
    }

    // Criar log de auditoria
    const oldValues = {
      is_active: existingUser.is_active,
      role: existingUser.role
    };
    
    const newValues = {
      is_active: updatedUser.is_active,
      role: updatedUser.role
    };
    
    await auditLogger.logUpdate(
      'users',
      params.id,
      oldValues,
      newValues,
      currentUserId!,
      request
    );

    // Remover senha antes de retornar
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'Status/Role do usuário atualizado com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro na atualização de status/role:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}