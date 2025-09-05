// Script para testar o login e verificação de token
// Usando fetch nativo do Node.js 18+

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    console.log('🧪 Testando sistema de autenticação...');
    console.log('🌐 URL Base:', BASE_URL);
    
    // Teste 1: Login
    console.log('\n1️⃣ Testando login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sisiago.com',
        password: 'admin123'
      })
    });
    
    console.log('📊 Status do login:', loginResponse.status);
    console.log('🍪 Headers de resposta:', Object.fromEntries(loginResponse.headers.entries()));
    
    const loginData = await loginResponse.json();
    console.log('📄 Dados de resposta do login:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.status === 200 && loginData.success) {
      console.log('✅ Login bem-sucedido!');
      
      // Extrair cookie do header Set-Cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      console.log('🍪 Set-Cookie header:', setCookieHeader);
      
      let authToken = null;
      if (setCookieHeader) {
        const cookieMatch = setCookieHeader.match(/auth-token=([^;]+)/);
        if (cookieMatch) {
          authToken = cookieMatch[1];
          console.log('🔑 Token extraído:', authToken.substring(0, 20) + '...');
        }
      }
      
      // Teste 2: Verificação de token
      console.log('\n2️⃣ Testando verificação de token...');
      const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Cookie': setCookieHeader || '',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📊 Status da verificação:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('📄 Dados de resposta da verificação:', JSON.stringify(verifyData, null, 2));
      
      if (verifyResponse.status === 200 && verifyData.authenticated) {
        console.log('✅ Verificação de token bem-sucedida!');
        console.log('👤 Usuário autenticado:', verifyData.user.email);
      } else {
        console.log('❌ Falha na verificação de token');
      }
      
    } else {
      console.log('❌ Falha no login');
      console.log('🔍 Detalhes do erro:', loginData);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Aguardar um pouco para garantir que o servidor está rodando
setTimeout(testLogin, 2000);