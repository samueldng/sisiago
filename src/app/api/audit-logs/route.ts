import { NextRequest, NextResponse } from 'next/server';
import { checkUserPermission } from '@/lib/supabase';
import { getAuditLogs } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    const hasPermission = await checkUserPermission(userId, 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar logs de auditoria.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const table_name = searchParams.get('table_name');
    const operation = searchParams.get('operation');
    const user_id = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Usar o sistema de auditoria simplificado
    const filters: any = { limit };
    if (table_name) filters.tableName = table_name;
    if (operation) filters.operation = operation;
    if (user_id) filters.userId = user_id;

    const logs = await getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: logs
    });

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}