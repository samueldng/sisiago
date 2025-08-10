const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testando conexão com o banco...')
    
    // Teste simples de conexão
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Conexão com banco OK:', result)
    
    // Testar se consegue listar produtos
    const products = await prisma.product.findMany({
      take: 5
    })
    console.log(`✅ Produtos encontrados: ${products.length}`)
    
    // Testar se consegue listar vendas
    const sales = await prisma.sale.findMany({
      take: 5
    })
    console.log(`✅ Vendas encontradas: ${sales.length}`)
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()