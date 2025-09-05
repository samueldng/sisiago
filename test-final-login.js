// Teste final do sistema de login
const testLogin = async () => {
  console.log('🧪 Iniciando teste final do login...');
  
  try {
    // Teste 1: Login com credenciais corretas
    console.log('\n1️⃣ Testando login com credenciais corretas...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sisiago.com',
        password: 'admin123'
      })
    });

    console.log('Status do login:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Resposta do login:', loginData);

    if (loginResponse.ok && loginData.success) {
      console.log('✅ Login bem-sucedido!');
      
      // Extrair cookie do cabeçalho Set-Cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      console.log('Cookie definido:', setCookieHeader);
      
      if (setCookieHeader) {
        // Teste 2: Verificar token
        console.log('\n2️⃣ Testando verificação de token...');
        const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
          method: 'GET',
          headers: {
            'Cookie': setCookieHeader,
            'Content-Type': 'application/json',
          }
        });

        console.log('Status da verificação:', verifyResponse.status);
        const verifyData = await verifyResponse.json();
        console.log('Resposta da verificação:', verifyData);

        if (verifyResponse.ok && verifyData.authenticated) {
          console.log('✅ Verificação de token bem-sucedida!');
          console.log('👤 Usuário autenticado:', verifyData.user.email);
        } else {
          console.log('❌ Falha na verificação de token');
        }
      }
    } else {
      console.log('❌ Falha no login:', loginData.error);
    }

    // Teste 3: Login com credenciais incorretas
    console.log('\n3️⃣ Testando login com credenciais incorretas...');
    const wrongLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sisiago.com',
        password: 'senhaerrada'
      })
    });

    console.log('Status do login incorreto:', wrongLoginResponse.status);
    const wrongLoginData = await wrongLoginResponse.json();
    console.log('Resposta do login incorreto:', wrongLoginData);

    if (!wrongLoginResponse.ok) {
      console.log('✅ Login com credenciais incorretas rejeitado corretamente!');
    } else {
      console.log('❌ Login com credenciais incorretas foi aceito (ERRO!)');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
};

// Executar teste
testLogin();