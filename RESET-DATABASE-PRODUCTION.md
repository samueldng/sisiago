# Reset da Base de Dados para Produção

Este documento explica como limpar e preparar a base de dados do SISIAGO para uso em produção.

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

**Esta operação é IRREVERSÍVEL e irá:**
- Limpar TODOS os dados de teste da base de dados
- Manter apenas a estrutura das tabelas
- Criar um usuário administrador padrão
- Inserir categorias básicas do sistema
- Configurar permissões RLS (Row Level Security)

## 📋 Pré-requisitos

1. **Configuração do Supabase**: Certifique-se de que o projeto está conectado ao Supabase
2. **Arquivo .env.production**: Configure as variáveis de ambiente de produção
3. **Backup**: Faça backup dos dados importantes antes de executar

## 🔧 Configuração

### 1. Configure o arquivo .env.production

O arquivo `.env.production` já existe no projeto. Configure as seguintes variáveis obrigatórias:

```env
# Supabase Configuration (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Database URL (OBRIGATÓRIO)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Obtenha as credenciais do Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Execução

### Método 1: Via npm script (Recomendado)

```bash
npm run db:reset-production
```

### Método 2: Execução direta

```bash
node reset-production-database.js
```

## 📝 Processo de Execução

1. **Verificação de configuração**: O script verifica se todas as variáveis estão configuradas
2. **Teste de conexão**: Testa a conexão com o Supabase
3. **Confirmação dupla**: Solicita confirmação do usuário (duas vezes para segurança)
4. **Execução do script SQL**: Executa o arquivo `reset-database-production.sql`
5. **Relatório final**: Mostra estatísticas da operação

## 📊 O que o script faz

### Limpeza de dados:
- Remove todos os registros de vendas de teste
- Remove todos os produtos de teste
- Remove usuários de teste (mantém apenas estrutura)
- Limpa logs de auditoria antigos

### Configuração inicial:
- Cria usuário administrador padrão:
  - **Email**: admin@sisiago.com
  - **Senha**: Admin123!
- Insere categorias básicas:
  - Bebidas
  - Alimentação
  - Limpeza
  - Higiene
  - Outros

### Configurações de segurança:
- Habilita RLS (Row Level Security) em todas as tabelas
- Configura permissões para roles `anon` e `authenticated`
- Aplica políticas de segurança

## 🔒 Segurança

- O script usa a **SERVICE_ROLE_KEY** que tem privilégios administrativos
- Todas as operações são logadas
- Confirmação dupla obrigatória antes da execução
- Verificação de conexão antes de iniciar

## 📋 Após a execução

1. **Faça login no sistema**:
   - Email: `admin@sisiago.com`
   - Senha: `Admin123!`

2. **Altere a senha do administrador** imediatamente

3. **Configure os dados da empresa**:
   - Nome da empresa
   - Dados de contato
   - Configurações fiscais

4. **Crie usuários adicionais** conforme necessário

5. **Comece a cadastrar produtos e usar o sistema**

## 🐛 Solução de problemas

### Erro de conexão
- Verifique se as credenciais do Supabase estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique a conectividade com a internet

### Erro de permissões
- Certifique-se de usar a `SERVICE_ROLE_KEY` (não a `ANON_KEY`)
- Verifique se a chave não expirou

### Script não encontrado
- Certifique-se de que o arquivo `reset-database-production.sql` existe
- Execute o comando na pasta raiz do projeto

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro exibidos pelo script
2. Confirme todas as configurações
3. Consulte a documentação do Supabase

---

**⚠️ LEMBRE-SE: Esta operação é irreversível. Sempre faça backup antes de executar!**