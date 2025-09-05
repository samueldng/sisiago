// Script para corrigir a senha do usuário admin
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYxODQ4OCwiZXhwIjoyMDcwMTk0NDg4fQ.BmFb5dIUybyTQOSfqdBwJm-fzIU_g475bODWCcpDrnw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminPassword() {
  try {
    console.log('🔧 Corrigindo senha do usuário admin...');
    
    // Gerar hash correto para a senha 'admin123'
    const password = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Hash gerado:', hashedPassword);
    
    // Verificar se o usuário admin existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@sisiago.com')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar usuário:', checkError);
      return;
    }
    
    if (!existingUser) {
      // Criar usuário admin se não existir
      console.log('👤 Criando usuário admin...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'admin@sisiago.com',
          name: 'Administrador',
          password: hashedPassword,
          role: 'ADMIN',
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        return;
      }
      
      console.log('✅ Usuário admin criado com sucesso:', newUser);
    } else {
      // Atualizar senha do usuário existente
      console.log('🔄 Atualizando senha do usuário admin existente...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          role: 'ADMIN',
          is_active: true
        })
        .eq('email', 'admin@sisiago.com')
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError);
        return;
      }
      
      console.log('✅ Senha do usuário admin atualizada com sucesso:', updatedUser);
    }
    
    // Verificar se a senha funciona
    console.log('🧪 Testando validação da senha...');
    const { data: testUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@sisiago.com')
      .single();
    
    if (testUser) {
      const isValid = await bcrypt.compare('admin123', testUser.password);
      console.log('🔍 Validação da senha:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
      
      if (isValid) {
        console.log('🎉 Usuário admin configurado corretamente!');
        console.log('📧 Email: admin@sisiago.com');
        console.log('🔑 Senha: admin123');
        console.log('👑 Role:', testUser.role);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixAdminPassword();