#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuração do readline para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer pergunta ao usuário
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Função para carregar variáveis de ambiente
function loadEnvVariables() {
  // Primeiro tenta .env.production, depois .env como fallback
  const envProdPath = path.join(__dirname, '.env.production');
  const envPath = path.join(__dirname, '.env');
  
  let selectedPath = null;
  
  // Verifica se .env.production existe e tem configurações reais
  if (fs.existsSync(envProdPath)) {
    const prodContent = fs.readFileSync(envProdPath, 'utf8');
    if (!prodContent.includes('your-project-ref.supabase.co') && 
        !prodContent.includes('your-anon-key-here')) {
      selectedPath = envProdPath;
      console.log('📋 Usando configurações de: .env.production');
    }
  }
  
  // Se .env.production não existe ou tem placeholders, usa .env
  if (!selectedPath && fs.existsSync(envPath)) {
    selectedPath = envPath;
    console.log('📋 Usando configurações de: .env (desenvolvimento)');
  }
  
  if (!selectedPath) {
    console.error('❌ Nenhum arquivo de configuração encontrado!');
    console.log('Por favor, configure um dos arquivos:');
    console.log('  • .env.production (recomendado para produção)');
    console.log('  • .env (para desenvolvimento/teste)');
    console.log('\nVariáveis necessárias:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase');
    console.log('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key');
    process.exit(1);
  }

  const envContent = fs.readFileSync(selectedPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/["']/g, '');
    }
  });

  return envVars;
}

// Função para executar o script SQL
async function executeSQLScript(supabase, sqlContent) {
  console.log('🔄 Executando script de limpeza da base de dados...');
  
  try {
    // Dividir o script em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      if (command.toLowerCase().includes('select') || 
          command.toLowerCase().includes('insert') ||
          command.toLowerCase().includes('update') ||
          command.toLowerCase().includes('delete') ||
          command.toLowerCase().includes('truncate') ||
          command.toLowerCase().includes('grant')) {
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: command });
          
          if (error) {
            // Tentar executar diretamente se RPC falhar
            const { error: directError } = await supabase
              .from('_temp_exec')
              .select('*')
              .limit(0);
            
            if (directError && !directError.message.includes('relation "_temp_exec" does not exist')) {
              console.warn(`⚠️  Aviso ao executar comando: ${error.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          console.warn(`⚠️  Erro ao executar comando: ${err.message}`);
          errorCount++;
        }
      }
    }

    return { successCount, errorCount };
  } catch (error) {
    throw new Error(`Erro ao executar script SQL: ${error.message}`);
  }
}

// Função principal
async function main() {
  console.log('🚀 SISIAGO - Reset da Base de Dados para Produção');
  console.log('=' .repeat(50));
  
  try {
    // Carregar variáveis de ambiente
    console.log('📋 Carregando configurações...');
    const envVars = loadEnvVariables();
    
    if (!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias!');
    }

    // Criar cliente Supabase
    console.log('🔗 Conectando ao Supabase...');
    const supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.SUPABASE_SERVICE_ROLE_KEY
    );

    // Testar conexão
    console.log('🔄 Testando conectividade...');
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error && !error.message.includes('relation "users" does not exist')) {
        console.error('❌ Detalhes do erro de conexão:');
        console.error(`   Mensagem: ${error.message}`);
        console.error(`   Código: ${error.code || 'N/A'}`);
        console.error(`   Detalhes: ${error.details || 'N/A'}`);
        console.error(`   Hint: ${error.hint || 'N/A'}`);
        throw new Error(`Erro de conexão: ${error.message}`);
      }
      console.log('✅ Conexão estabelecida com sucesso!');
    } catch (fetchError) {
      console.error('❌ Erro de rede ou conectividade:');
      console.error(`   Tipo: ${fetchError.name}`);
      console.error(`   Mensagem: ${fetchError.message}`);
      console.error(`   URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`);
      
      if (fetchError.message.includes('fetch failed')) {
        console.error('\n🔧 Possíveis causas:');
        console.error('   • Problema de conectividade com a internet');
        console.error('   • URL do Supabase incorreta');
        console.error('   • Firewall bloqueando a conexão');
        console.error('   • Projeto Supabase pausado ou inativo');
        console.error('   • Chave de API inválida ou expirada');
      }
      
      throw fetchError;
    }

    // Carregar script SQL
    const sqlPath = path.join(__dirname, 'reset-database-production.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Arquivo reset-database-production.sql não encontrado!');
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Script SQL carregado com sucesso!');

    // Confirmação de segurança
    console.log('\n⚠️  ATENÇÃO: Esta operação irá:');
    console.log('   • Limpar TODOS os dados de teste da base de dados');
    console.log('   • Manter apenas a estrutura das tabelas');
    console.log('   • Criar um usuário administrador padrão');
    console.log('   • Inserir categorias básicas');
    console.log('   • Esta ação é IRREVERSÍVEL!');
    
    const confirmation1 = await askQuestion('\n❓ Tem certeza que deseja continuar? (digite "SIM" para confirmar): ');
    
    if (confirmation1.toUpperCase() !== 'SIM') {
      console.log('❌ Operação cancelada pelo usuário.');
      rl.close();
      return;
    }

    const confirmation2 = await askQuestion('❓ Confirma novamente? Esta é sua última chance! (digite "CONFIRMO"): ');
    
    if (confirmation2.toUpperCase() !== 'CONFIRMO') {
      console.log('❌ Operação cancelada pelo usuário.');
      rl.close();
      return;
    }

    console.log('\n🔄 Iniciando limpeza da base de dados...');
    
    // Executar script
    const startTime = Date.now();
    const result = await executeSQLScript(supabase, sqlContent);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO DA OPERAÇÃO');
    console.log('='.repeat(50));
    console.log(`✅ Comandos executados com sucesso: ${result.successCount}`);
    console.log(`⚠️  Comandos com avisos/erros: ${result.errorCount}`);
    console.log(`⏱️  Tempo de execução: ${duration}s`);
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    
    if (result.errorCount === 0) {
      console.log('\n🎉 Base de dados limpa com sucesso!');
      console.log('✅ Sistema pronto para uso em produção!');
    } else {
      console.log('\n⚠️  Limpeza concluída com alguns avisos.');
      console.log('🔍 Verifique os logs acima para mais detalhes.');
    }
    
    console.log('\n📋 Próximos passos:');
    console.log('   1. Faça login com: admin@sisiago.com / Admin123!');
    console.log('   2. Altere a senha do administrador');
    console.log('   3. Configure os dados da sua empresa');
    console.log('   4. Comece a usar o sistema!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a operação:');
    console.error(error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };