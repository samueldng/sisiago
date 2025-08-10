# Deploy do Sistema Sis Iago

## Pré-requisitos

1. **Conta no Supabase** configurada com as tabelas criadas
2. **Conta no Vercel** para deploy
3. **Variáveis de ambiente** configuradas

## Configuração do Supabase

1. Execute o script `supabase-setup.sql` no seu projeto Supabase
2. Execute o script `simple-rls.sql` para habilitar as políticas de segurança
3. Anote as seguintes informações do seu projeto Supabase:
   - URL do projeto
   - Chave anônima (anon key)

## Deploy na Vercel

### 1. Instalar Vercel CLI (opcional)
```bash
npm install -g vercel
```

### 2. Deploy via CLI
```bash
# Na pasta do projeto
vercel

# Ou para deploy direto
vercel --prod
```

### 3. Deploy via GitHub
1. Faça push do código para um repositório GitHub
2. Conecte o repositório na dashboard da Vercel
3. Configure as variáveis de ambiente

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel da Vercel:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima

# Next.js Auth (opcional)
NEXTAUTH_SECRET=sua-chave-secreta-aqui
NEXTAUTH_URL=https://seu-app.vercel.app
```

### Como configurar no Vercel:

1. Acesse o dashboard da Vercel
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione cada variável:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://seu-projeto.supabase.co`
   - Environment: `Production`, `Preview`, `Development`

## Comandos de Deploy

### Deploy manual via CLI:
```bash
# Build local (teste)
npm run build

# Deploy para produção
vercel --prod
```

### Deploy automático:
O deploy será automático a cada push na branch principal se conectado via GitHub.

## Verificação Pós-Deploy

1. ✅ Aplicação carrega sem erros
2. ✅ Conexão com Supabase funcionando
3. ✅ APIs respondendo corretamente
4. ✅ Interface responsiva

## Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão instaladas
- Confirme que não há erros de TypeScript

### Erro de Conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme se as tabelas foram criadas no Supabase
- Verifique se as políticas RLS estão habilitadas

### Erro 404 em APIs
- Confirme se todas as rotas API estão funcionando localmente
- Verifique se não há imports do Prisma restantes

## Monitoramento

- Use o dashboard da Vercel para monitorar logs
- Configure alertas para erros de runtime
- Monitore performance e usage

---

**Nota**: Este projeto foi migrado do Prisma para Supabase. Certifique-se de que todas as APIs estão usando o cliente Supabase antes do deploy.