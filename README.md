# Sis IA Go

Sistema de Ponto de Venda (PDV) moderno e modular desenvolvido com Next.js 14, React, TypeScript e Tailwind CSS.

## 🚀 Deploy na Vercel + Supabase

### Pré-requisitos
1. Conta na [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com)

### Configuração do Supabase

1. **Criar projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave do banco

2. **Configurar banco de dados:**
   ```sql
   -- O Prisma criará as tabelas automaticamente
   -- Apenas certifique-se de que o projeto está ativo
   ```

### Deploy na Vercel

1. **Conectar repositório:**
   - Faça push do código para GitHub/GitLab
   - Conecte o repositório na Vercel

2. **Configurar variáveis de ambiente:**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

3. **Deploy automático:**
   - A Vercel fará o build automaticamente
   - O Prisma gerará o cliente durante o build

### Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Migrar banco (após deploy)
npm run migrate:deploy

# Popular banco com dados iniciais
npm run db:seed
```

## Características

- **Mobile-First**: Interface otimizada para dispositivos móveis
- **Scanner de Código de Barras**: Leitura via câmera do celular
- **Pagamentos PIX**: Geração de QR codes para pagamentos instantâneos
- **Gestão Completa**: Produtos, vendas, estoque e relatórios
- **Arquitetura Modular**: Fácil expansão e manutenção
- **Deploy Simples**: Vercel + Supabase

## Tecnologias

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Banco de Dados**: Prisma ORM + PostgreSQL (Supabase)
- **Deploy**: Vercel
- **Validação**: Zod, React Hook Form
- **Funcionalidades**: QR Scanner, PIX QR Code

## Instalação Local

```bash
# Clone o repositório
git clone <repository-url>
cd sisiago

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Configure o banco de dados
npx prisma migrate dev

# Popular com dados iniciais
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
src/
├── app/                 # App Router do Next.js 14
│   ├── pdv/            # Módulo PDV (Ponto de Venda)
│   ├── produtos/       # Gestão de Produtos
│   ├── vendas/         # Histórico de Vendas
│   └── pagamentos/     # Controle de Pagamentos
├── components/         # Componentes reutilizáveis
│   ├── ui/            # Componentes de UI base
│   ├── BarcodeScanner.tsx
│   └── PixQRCode.tsx
├── lib/               # Utilitários e configurações
└── types/             # Definições de tipos TypeScript
```

## Módulos Implementados

### 🏪 PDV (Ponto de Venda)
- Interface mobile-first para vendas
- Scanner de código de barras
- Carrinho de compras dinâmico
- Múltiplas formas de pagamento
- Geração de QR code PIX

### 📦 Gestão de Produtos
- Cadastro e edição de produtos
- Controle de estoque
- Categorização
- Scanner para código de barras

### 💰 Vendas
- Histórico completo de transações
- Filtros por período e status
- Detalhes de cada venda
- Controle de pagamentos

### 💳 Pagamentos
- Gestão de pagamentos PIX
- Verificação de status
- Histórico de transações

## Próximos Módulos

- **Estoque Avançado**: Controle detalhado de entrada/saída
- **Financeiro**: Fluxo de caixa e relatórios
- **CRM**: Gestão de clientes e fidelidade
- **Relatórios**: Dashboards e analytics
- **Módulos Específicos**: Restaurantes, oficinas, etc.

## Licença

MIT License