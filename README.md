# Sis IA Go

Sistema de Ponto de Venda (PDV) moderno e modular desenvolvido com Next.js 14, React, TypeScript e Tailwind CSS.

> 📋 **[Ver Documentação Completa (DocView)](./DOCVIEW.md)** - Documentação técnica detalhada, arquitetura e roadmap

## 🌐 Aplicação em Produção

**URL Principal**: https://sisiago-2g8jnazv1-samuels-projects-9c53f90f.vercel.app

### 🔗 Links Diretos:
- **PDV (Ponto de Venda)**: https://sisiago-2g8jnazv1-samuels-projects-9c53f90f.vercel.app/pdv
- **Teste de Scanners**: https://sisiago-2g8jnazv1-samuels-projects-9c53f90f.vercel.app/test-scanner
- **Gestão de Produtos**: https://sisiago-2g8jnazv1-samuels-projects-9c53f90f.vercel.app/produtos
- **Relatórios**: https://sisiago-2g8jnazv1-samuels-projects-9c53f90f.vercel.app/relatorios

## 🚀 Deploy na Vercel + Supabase

### Pré-requisitos
1. Conta na [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com)
3. Node.js 18+ instalado
4. Git configurado

### Configuração do Supabase

1. **Criar projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e a chave do banco

2. **Configurar banco de dados:**
   ```sql
   -- As tabelas são criadas via Supabase
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
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy automático:**
   - A Vercel fará o build automaticamente
   - O cliente Supabase é configurado automaticamente

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

## ✨ Características Principais

- **Mobile-First**: Interface otimizada para dispositivos móveis
- **Scanner Confiável**: ZXing scanner que elimina números aleatórios
- **Pagamentos PIX**: Geração de QR codes para pagamentos instantâneos
- **Gestão Completa**: Produtos, vendas, estoque e relatórios
- **Arquitetura Modular**: Fácil expansão e manutenção
- **Deploy Automático**: Vercel + Supabase com CI/CD
- **Type Safety**: 100% TypeScript com validação Zod
- **Performance**: SSR/SSG otimizado, Edge Runtime

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, shadcn/ui
- **Banco de Dados**: Supabase PostgreSQL
- **Deploy**: Vercel com Edge Runtime
- **Validação**: Zod + React Hook Form
- **Scanner**: @zxing/library (ZXing)
- **Pagamentos**: PIX QR Code generation
- **Autenticação**: NextAuth.js (planejado)

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
# Tabelas criadas via Supabase SQL Editor

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

## 🔮 Roadmap

### ✅ Implementado
- Scanner de código de barras confiável (ZXing)
- PDV completo com carrinho dinâmico
- Gestão de produtos com CRUD
- Sistema de vendas e histórico
- Deploy automático na Vercel

### 🚧 Em Desenvolvimento
- Relatórios e analytics avançados
- Sistema de estoque detalhado
- Configurações personalizáveis

### 📋 Planejado
- **Estoque Avançado**: Controle detalhado de entrada/saída
- **Financeiro**: Fluxo de caixa e relatórios
- **CRM**: Gestão de clientes e fidelidade
- **Autenticação**: Sistema de usuários e permissões
- **Módulos Específicos**: Restaurantes, oficinas, etc.
- **App Mobile**: Aplicativo nativo React Native

## 📚 Documentação

- **[DocView Completo](./DOCVIEW.md)** - Documentação técnica detalhada
- **[Guia de Setup](./README-SETUP.md)** - Configuração local
- **[Deploy Guide](./DEPLOY.md)** - Guia de deploy
- **[Bug Fixes](./BUGFIXES.md)** - Histórico de correções

## 📄 Licença

MIT License