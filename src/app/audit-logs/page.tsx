'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces
interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface ApiResponse {
  success: boolean;
  data: AuditLog[];
  pagination: Pagination;
}

// Funções auxiliares
const getOperationLabel = (operation: string) => {
  switch (operation) {
    case 'INSERT': return 'Criação';
    case 'UPDATE': return 'Atualização';
    case 'DELETE': return 'Exclusão';
    default: return operation;
  }
};

const getOperationColor = (operation: string) => {
  switch (operation) {
    case 'INSERT': return 'bg-green-100 text-green-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTableLabel = (tableName: string) => {
  switch (tableName) {
    case 'users': return 'Usuários';
    case 'products': return 'Produtos';
    case 'categories': return 'Categorias';
    case 'sales': return 'Vendas';
    case 'clients': return 'Clientes';
    case 'payments': return 'Pagamentos';
    default: return tableName;
  }
};

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 25,
    offset: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    table_name: '',
    operation: '',
    user_id: '',
    start_date: '',
    end_date: ''
  });
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Carregar logs
  const loadLogs = async (resetPagination = false) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('limit', pagination.limit.toString());
      params.append('offset', resetPagination ? '0' : pagination.offset.toString());
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      
      if (response.ok) {
        const data: ApiResponse = await response.json();
        
        if (resetPagination) {
          setLogs(data.data);
          setPagination({ ...data.pagination, offset: 0 });
        } else {
          setLogs(prev => [...prev, ...data.data]);
          setPagination(data.pagination);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao carregar logs');
      }
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(true);
  }, []);

  // Aplicar filtros
  const handleFilter = () => {
    loadLogs(true);
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      table_name: '',
      operation: '',
      user_id: '',
      start_date: '',
      end_date: ''
    });
    setTimeout(() => loadLogs(true), 100);
  };

  // Carregar mais logs
  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
      setTimeout(() => loadLogs(false), 100);
    }
  };

  // Formatar JSON para exibição
  const formatJson = (obj: any) => {
    if (!obj) return 'N/A';
    return JSON.stringify(obj, null, 2);
  };

  if (loading && logs.length === 0) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando logs de auditoria...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
                <p className="text-gray-600 mt-1">Histórico de ações no sistema</p>
              </div>
              <div className="text-sm text-gray-500">
                Total: {pagination.total} registros
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tabela
                </label>
                <select
                  value={filters.table_name}
                  onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  <option value="users">Usuários</option>
                  <option value="products">Produtos</option>
                  <option value="categories">Categorias</option>
                  <option value="sales">Vendas</option>
                  <option value="clients">Clientes</option>
                  <option value="payments">Pagamentos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operação
                </label>
                <select
                  value={filters.operation}
                  onChange={(e) => setFilters({ ...filters, operation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  <option value="INSERT">Criação</option>
                  <option value="UPDATE">Atualização</option>
                  <option value="DELETE">Exclusão</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleFilter}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Filtrar
                </button>
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de logs */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tabela
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.user_name || 'Sistema'}
                          </div>
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTableLabel(log.table_name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperationColor(log.operation)}`}>
                          {getOperationLabel(log.operation)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {log.record_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setShowDetails(showDetails === log.id ? null : log.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {showDetails === log.id ? 'Ocultar' : 'Detalhes'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botão carregar mais */}
            {pagination.hasMore && (
              <div className="px-6 py-4 border-t border-gray-200 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Carregando...' : 'Carregar Mais'}
                </button>
              </div>
            )}
          </div>

          {/* Modal de detalhes */}
          {showDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Detalhes do Log</h2>
                    <button
                      onClick={() => setShowDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {(() => {
                    const log = logs.find(l => l.id === showDetails);
                    if (!log) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">ID do Log</label>
                            <p className="text-sm text-gray-900 font-mono">{log.id}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Data/Hora</label>
                            <p className="text-sm text-gray-900">
                              {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Usuário</label>
                            <p className="text-sm text-gray-900">{log.user_name} ({log.user_email})</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <p className="text-sm text-gray-900">{log.user_role}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tabela</label>
                            <p className="text-sm text-gray-900">{getTableLabel(log.table_name)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Operação</label>
                            <p className="text-sm text-gray-900">{getOperationLabel(log.operation)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">ID do Registro</label>
                            <p className="text-sm text-gray-900 font-mono">{log.record_id}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">IP</label>
                            <p className="text-sm text-gray-900">{log.ip_address || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">User Agent</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                            {log.user_agent || 'N/A'}
                          </p>
                        </div>
                        
                        {log.old_values && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valores Antigos</label>
                            <pre className="text-xs text-gray-900 bg-red-50 p-3 rounded overflow-x-auto">
                              {formatJson(log.old_values)}
                            </pre>
                          </div>
                        )}
                        
                        {log.new_values && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Valores Novos</label>
                            <pre className="text-xs text-gray-900 bg-green-50 p-3 rounded overflow-x-auto">
                              {formatJson(log.new_values)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })()
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
