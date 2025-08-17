import { NextRequest, NextResponse } from 'next/server';
import { supabase, db } from '@/lib/supabase';

/**
 * Verifica se o usuário tem permissão para acessar logs de auditoria
 */
async function checkUserPermission(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await db.users.findById(userId);
    
    if (error || !user) {
      console.error('Erro ao verificar permissão do usuário:', error);
      return false;
    }
    
    return user.role === 'ADMIN';
  } catch (error) {
    console.error('Erro ao verificar permissão do usuário:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Token de autenticação necessário' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão
    const hasPermission = await checkUserPermission(userId);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar logs de auditoria.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100); // Máximo 100
    const offset = parseInt(searchParams.get('offset') || '0');
    const tableName = searchParams.get('table_name') || undefined;
    const operation = searchParams.get('operation') || undefined;
    const userIdFilter = searchParams.get('user_id') || undefined;
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');

    // Converter datas se fornecidas
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Buscar logs usando o cliente Supabase
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (tableName) {
      query = query.eq('table_name', tableName);
    }
    if (operation) {
      query = query.eq('operation', operation);
    }
    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar logs de auditoria' },
        { status: 500 }
      );
    }

    // Buscar total de registros para paginação
    let countQuery = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (tableName) countQuery = countQuery.eq('table_name', tableName);
    if (operation) countQuery = countQuery.eq('operation', operation);
    if (userIdFilter) countQuery = countQuery.eq('user_id', userIdFilter);
    if (startDate) countQuery = countQuery.gte('created_at', startDate.toISOString());
    if (endDate) countQuery = countQuery.lte('created_at', endDate.toISOString());

    const { count: totalCount } = await countQuery;

    // Formatar dados para compatibilidade com o frontend
    const formattedLogs = (logs || []).map(log => ({
      id: log.id,
      table_name: log.table_name,
      record_id: log.record_id,
      operation: log.operation,
      old_values: log.old_values,
      new_values: log.new_values,
      user_id: log.user_id,
      user_name: log.user?.name || 'Usuário não encontrado',
      user_email: log.user?.email || log.user_email,
      user_role: log.user?.role || 'N/A',
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: offset + limit < (totalCount || 0)
      }
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