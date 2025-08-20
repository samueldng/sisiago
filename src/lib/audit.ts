// Sistema de auditoria com persistência no banco de dados
import { createClient } from '@supabase/supabase-js';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Cliente Supabase para operações de auditoria
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

class SimpleAuditLogger {
  private logs: AuditLog[] = [];

  async createLog(logData: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const log: AuditLog = {
      id: this.generateId(),
      created_at: new Date().toISOString(),
      ...logData
    };

    // Armazenar em memória
    this.logs.push(log);

    // Log no console para desenvolvimento
    console.log('🔍 Audit Log:', {
      operation: log.operation,
      table: log.table_name,
      record: log.record_id,
      user: log.user_id,
      timestamp: log.created_at
    });

    return log;
  }

  async getLogs(filters?: {
    table_name?: string;
    operation?: string;
    user_id?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    let filteredLogs = [...this.logs];

    if (filters?.table_name) {
      filteredLogs = filteredLogs.filter(log => log.table_name === filters.table_name);
    }

    if (filters?.operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === filters.operation);
    }

    if (filters?.user_id) {
      filteredLogs = filteredLogs.filter(log => log.user_id === filters.user_id);
    }

    // Ordenar por data (mais recente primeiro)
    filteredLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Aplicar limite
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Método para limpar logs (útil para testes)
  clearLogs(): void {
    this.logs = [];
  }

  // Método para obter estatísticas
  getStats(): { total: number; byOperation: Record<string, number>; byTable: Record<string, number> } {
    const stats = {
      total: this.logs.length,
      byOperation: {} as Record<string, number>,
      byTable: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;
      stats.byTable[log.table_name] = (stats.byTable[log.table_name] || 0) + 1;
    });

    return stats;
  }
}

// Instância singleton
const auditLogger = new SimpleAuditLogger();

export { auditLogger };

// Função helper para criar logs de auditoria
export async function createAuditLog(
  tableName: string,
  recordId: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  data: {
    oldValues?: any;
    newValues?: any;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    const auditLog = {
      table_name: tableName,
      record_id: recordId,
      operation,
      old_values: data.oldValues,
      new_values: data.newValues,
      user_id: data.userId,
      ip_address: data.ipAddress,
      user_agent: data.userAgent
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert([auditLog]);

    if (error) {
      console.error('Erro ao criar log de auditoria:', error);
      throw error;
    }
    
    console.log('🔍 Audit Log criado:', {
      operation: auditLog.operation,
      table: auditLog.table_name,
      record: auditLog.record_id,
      user: auditLog.user_id
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    // Não falhar a operação principal por causa do log
  }
}

// Interface para resultado paginado
export interface PaginatedAuditLogs {
  logs: AuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Função helper para buscar logs com paginação e filtros avançados
export async function getAuditLogs(filters?: {
  tableName?: string;
  operation?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedAuditLogs> {
  try {
    const limit = filters?.limit || 25;
    const offset = filters?.offset || 0;

    // Query para contar total
    let countQuery = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // Query para buscar dados
    let dataQuery = supabase
      .from('audit_logs')
      .select(`
        *,
        users!inner(
          name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros em ambas as queries
    if (filters?.tableName) {
      countQuery = countQuery.eq('table_name', filters.tableName);
      dataQuery = dataQuery.eq('table_name', filters.tableName);
    }

    if (filters?.operation) {
      countQuery = countQuery.eq('operation', filters.operation);
      dataQuery = dataQuery.eq('operation', filters.operation);
    }

    if (filters?.userId) {
      countQuery = countQuery.eq('user_id', filters.userId);
      dataQuery = dataQuery.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
      const startDateTime = `${filters.startDate}T00:00:00.000Z`;
      countQuery = countQuery.gte('created_at', startDateTime);
      dataQuery = dataQuery.gte('created_at', startDateTime);
    }

    if (filters?.endDate) {
      const endDateTime = `${filters.endDate}T23:59:59.999Z`;
      countQuery = countQuery.lte('created_at', endDateTime);
      dataQuery = dataQuery.lte('created_at', endDateTime);
    }

    // Executar queries
    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery
    ]);

    if (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return {
        logs: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      };
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    // Transformar dados para incluir informações do usuário
    const transformedLogs = (data || []).map(log => ({
      ...log,
      user_name: log.users?.name || 'Sistema',
      user_email: log.users?.email || '',
      user_role: log.users?.role || 'system'
    }));

    return {
      logs: transformedLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore
      }
    };
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return {
      logs: [],
      pagination: {
        total: 0,
        limit: filters?.limit || 25,
        offset: filters?.offset || 0,
        hasMore: false
      }
    };
  }
}

// Função para exportar logs de auditoria
export async function exportAuditLogs(
  filters?: {
    tableName?: string;
    operation?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  },
  format: 'csv' | 'json' = 'csv'
): Promise<string> {
  try {
    // Buscar todos os logs sem paginação para exportação
    const result = await getAuditLogs({ ...filters, limit: 10000, offset: 0 });
    const logs = result.logs;

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // Gerar CSV
    const headers = [
      'ID',
      'Data/Hora',
      'Usuário',
      'Email',
      'Role',
      'Tabela',
      'Operação',
      'ID do Registro',
      'IP',
      'User Agent',
      'Valores Antigos',
      'Valores Novos'
    ];

    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.id,
        new Date(log.created_at).toLocaleString('pt-BR'),
        `"${log.user_name || 'Sistema'}"`,
        `"${log.user_email || ''}"`,
        log.user_role || 'system',
        log.table_name,
        log.operation,
        log.record_id,
        log.ip_address || '',
        `"${log.user_agent || ''}"`,
        `"${log.old_values ? JSON.stringify(log.old_values).replace(/"/g, '""') : ''}"`,
        `"${log.new_values ? JSON.stringify(log.new_values).replace(/"/g, '""') : ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  } catch (error) {
    console.error('Erro ao exportar logs de auditoria:', error);
    throw new Error('Erro ao exportar logs de auditoria');
  }
}

// Função para obter estatísticas de auditoria
export async function getAuditStats(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalLogs: number;
  byOperation: Record<string, number>;
  byTable: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: AuditLog[];
}> {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        users!inner(
          name,
          email,
          role
        )
      `);

    if (filters?.startDate) {
      const startDateTime = `${filters.startDate}T00:00:00.000Z`;
      query = query.gte('created_at', startDateTime);
    }

    if (filters?.endDate) {
      const endDateTime = `${filters.endDate}T23:59:59.999Z`;
      query = query.lte('created_at', endDateTime);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar estatísticas de auditoria:', error);
      throw error;
    }

    const logs = data || [];
    const stats = {
      totalLogs: logs.length,
      byOperation: {} as Record<string, number>,
      byTable: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      recentActivity: logs
        .slice(0, 10)
        .map(log => ({
          ...log,
          user_name: log.users?.name || 'Sistema',
          user_email: log.users?.email || '',
          user_role: log.users?.role || 'system'
        }))
    };

    logs.forEach(log => {
      // Por operação
      stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;
      
      // Por tabela
      stats.byTable[log.table_name] = (stats.byTable[log.table_name] || 0) + 1;
      
      // Por usuário
      const userName = log.users?.name || 'Sistema';
      stats.byUser[userName] = (stats.byUser[userName] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    return {
      totalLogs: 0,
      byOperation: {},
      byTable: {},
      byUser: {},
      recentActivity: []
    };
  }
}