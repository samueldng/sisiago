'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

// Interfaces
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'user';
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Schemas de validação
const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'manager', 'user'])
});

const updateUserSchema = userSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional()
});

type CreateUserData = z.infer<typeof userSchema>;
type UpdateUserData = z.infer<typeof updateUserSchema>;

// Funções auxiliares
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'manager': return 'Gerente';
    case 'user': return 'Usuário';
    default: return role;
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'manager': return 'bg-blue-100 text-blue-800';
    case 'user': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    name: '',
    password: '',
    role: 'user'
  });
  const [editFormData, setEditFormData] = useState<UpdateUserData>({
    email: '',
    name: '',
    role: 'user'
  });

  // Carregar usuários
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Erro ao carregar usuários');
      }
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Criar usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = userSchema.parse(formData);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        toast.success('Usuário criado com sucesso!');
        setShowCreateModal(false);
        setFormData({ email: '', name: '', password: '', role: 'user' });
        loadUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Erro ao criar usuário');
      }
    }
  };

  // Editar usuário
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const validatedData = updateUserSchema.parse(editFormData);
      
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        toast.success('Usuário atualizado com sucesso!');
        setShowEditModal(false);
        setEditingUser(null);
        loadUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    }
  };

  // Deletar usuário
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Usuário deletado com sucesso!');
        loadUsers();
      } else {
        toast.error('Erro ao deletar usuário');
      }
    } catch (error) {
      toast.error('Erro ao deletar usuário');
    }
  };

  // Alterar status do usuário
  const handleToggleStatus = async (userId: string, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (response.ok) {
        toast.success('Status alterado com sucesso!');
        loadUsers();
      } else {
        toast.error('Erro ao alterar status do usuário');
      }
    } catch (error) {
      toast.error('Erro ao alterar status do usuário');
    }
  };

  // Alterar role do usuário
  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Tem certeza que deseja alterar a role para ${getRoleLabel(newRole)}?`)) return;

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success('Role alterada com sucesso!');
        loadUsers();
      } else {
        toast.error('Erro ao alterar role do usuário');
      }
    } catch (error) {
      toast.error('Erro ao alterar role do usuário');
    }
  };

  // Abrir modal de edição
  const openEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditFormData({
      email: userToEdit.email,
      name: userToEdit.name || '',
      role: userToEdit.role
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando usuários...</p>
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
                <p className="text-gray-600 mt-1">Gerencie usuários do sistema</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Usuário
              </button>
            </div>
          </div>

          {/* Tabela de usuários */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.name || 'Sem nome'}
                          </div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                          {getRoleLabel(userItem.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userItem.is_active === undefined 
                            ? 'bg-gray-100 text-gray-800'
                            : userItem.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.is_active === undefined ? 'N/A' : (userItem.is_active ? 'Ativo' : 'Inativo')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userItem.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(userItem)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleStatus(userItem.id, userItem.is_active)}
                            className={`${userItem.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          >
                            {userItem.is_active ? 'Desativar' : 'Ativar'}
                          </button>
                          <select
                            value={userItem.role}
                            onChange={(e) => handleChangeRole(userItem.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="user">User</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={userItem.id === user?.id}
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal de criação */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Criar Novo Usuário</h2>
              <form onSubmit={handleCreateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'user' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">Usuário</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de edição */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
              <form onSubmit={handleEditUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nova Senha (opcional)
                    </label>
                    <input
                      type="password"
                      value={editFormData.password || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'admin' | 'manager' | 'user' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">Usuário</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}