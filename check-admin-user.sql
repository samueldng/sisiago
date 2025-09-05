-- Script para verificar e criar usuário admin padrão
-- Verifica se o usuário admin@sisiago.com existe
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM users 
WHERE email = 'admin@sisiago.com';

-- Se não existir, criar o usuário admin padrão
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (id, email, name, password, role, is_active)
SELECT 
  gen_random_uuid()::text,
  'admin@sisiago.com',
  'Administrador',
  '$2b$10$rQJ8kHqM7FwJYzGQVQJ8kOeKQJ8kHqM7FwJYzGQVQJ8kOeKQJ8kHq',
  'ADMIN',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@sisiago.com'
);

-- Verificar novamente após inserção
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM users 
WHERE email = 'admin@sisiago.com';