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

// Função helper para buscar logs
export async function getAuditLogs(filters?: {
  tableName?: string;
  operation?: string;
  userId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.tableName) {
      query = query.eq('table_name', filters.tableName);
    }

    if (filters?.operation) {
      query = query.eq('operation', filters.operation);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return [];
  }
}