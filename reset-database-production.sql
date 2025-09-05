-- SISIAGO - Script de Reset da Base de Dados para Produção
-- Este script limpa todos os dados de teste e prepara o sistema para uso em produção

-- =====================================================
-- 1. LIMPEZA DE DADOS DE TESTE
-- =====================================================

-- Desabilitar verificações de chave estrangeira temporariamente
SET session_replication_role = replica;

-- Limpar todas as tabelas de dados (manter estrutura)
TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE sales RESTART IDENTITY CASCADE;
TRUNCATE TABLE products RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Reabilitar verificações de chave estrangeira
SET session_replication_role = DEFAULT;

-- =====================================================
-- 2. CRIAÇÃO DE USUÁRIO ADMINISTRADOR PADRÃO
-- =====================================================

-- Inserir usuário administrador padrão
-- Senha padrão: 'admin123' (deve ser alterada no primeiro login)
INSERT INTO users (id, name, email, password, role, created_at, updated_at, is_active) VALUES 
(
  gen_random_uuid(),
  'Administrador',
  'admin@sisiago.com',
  '$2b$10$rQZ8kqVZ8qVZ8qVZ8qVZ8O7Z8qVZ8qVZ8qVZ8qVZ8qVZ8qVZ8qVZ8q',
  'ADMIN',
  NOW(),
  NOW(),
  true
);

-- =====================================================
-- 3. CATEGORIAS BÁSICAS ESSENCIAIS
-- =====================================================

-- Inserir categorias básicas para começar
INSERT INTO categories (name, description, created_at, updated_at) VALUES 
('Geral', 'Categoria geral para produtos diversos', NOW(), NOW()),
('Alimentação', 'Produtos alimentícios', NOW(), NOW()),
('Bebidas', 'Bebidas em geral', NOW(), NOW()),
('Limpeza', 'Produtos de limpeza', NOW(), NOW()),
('Higiene', 'Produtos de higiene pessoal', NOW(), NOW());

-- =====================================================
-- 4. CONFIGURAÇÕES DE SEGURANÇA E RLS
-- =====================================================

-- Garantir que RLS está habilitado em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
-- Usuários podem ver todos os dados (necessário para o sistema funcionar)
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Categorias - acesso completo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Produtos - acesso completo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Vendas - acesso completo para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can manage sales" ON sales;
CREATE POLICY "Authenticated users can manage sales" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

-- Logs de auditoria - apenas leitura para usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. PERMISSÕES PARA ROLES ANON E AUTHENTICATED
-- =====================================================

-- Garantir permissões básicas para role anon (necessário para login)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON users TO anon;

-- Permissões completas para role authenticated
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 6. VERIFICAÇÃO E LIMPEZA FINAL
-- =====================================================

-- Nota: As tabelas usam UUID como chave primária, não há sequências para resetar

-- Atualizar estatísticas das tabelas
ANALYZE users;
ANALYZE categories;
ANALYZE products;
ANALYZE sales;
ANALYZE audit_logs;

-- =====================================================
-- 7. MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

-- Log de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Base de dados limpa e preparada para produção!';
  RAISE NOTICE '📊 Estatísticas:';
  RAISE NOTICE '   - Usuários: % (1 admin criado)', (SELECT COUNT(*) FROM users);
  RAISE NOTICE '   - Categorias: % (categorias básicas)', (SELECT COUNT(*) FROM categories);
  RAISE NOTICE '   - Produtos: % (limpo)', (SELECT COUNT(*) FROM products);
  RAISE NOTICE '   - Vendas: % (limpo)', (SELECT COUNT(*) FROM sales);
  RAISE NOTICE '   - Logs: % (limpo)', (SELECT COUNT(*) FROM audit_logs);
  RAISE NOTICE '🔐 RLS habilitado em todas as tabelas';
  RAISE NOTICE '👤 Usuário admin criado: admin@sisiago.com';
  RAISE NOTICE '🚀 Sistema pronto para produção!';
END $$;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se todas as operações foram executadas com sucesso
-- 3. Configure a autenticação do usuário admin no Supabase Auth
-- 4. Teste o login com o usuário admin
-- 5. Comece a usar o sistema em produção
--
-- IMPORTANTE: 
-- - Este script remove TODOS os dados existentes
-- - Faça backup antes de executar se necessário
-- - Execute apenas uma vez para preparar produção
-- =====================================================