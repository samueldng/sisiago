const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedData() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...')
    
    // Criar categorias padrão
    const categories = [
      { name: 'Bebidas', description: 'Refrigerantes, sucos, águas' },
      { name: 'Padaria', description: 'Pães, bolos, doces' },
      { name: 'Laticínios', description: 'Leites, queijos, iogurtes' },
      { name: 'Mercearia', description: 'Arroz, feijão, açúcar' },
      { name: 'Limpeza', description: 'Produtos de limpeza e higiene' },
      { name: 'Higiene', description: 'Produtos de higiene pessoal' },
      { name: 'Carnes', description: 'Carnes bovinas, suínas, aves' },
      { name: 'Frutas', description: 'Frutas frescas' },
      { name: 'Verduras', description: 'Verduras e legumes' }
    ]
    
    console.log('📂 Criando categorias...')
    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      })
      console.log(`✅ Categoria criada: ${category.name}`)
    }
    
    // Buscar categorias criadas
    const createdCategories = await prisma.category.findMany()
    const bebidasCategory = createdCategories.find(c => c.name === 'Bebidas')
    const padariaCategory = createdCategories.find(c => c.name === 'Padaria')
    const laticiniosCategory = createdCategories.find(c => c.name === 'Laticínios')
    const merceariaCategory = createdCategories.find(c => c.name === 'Mercearia')
    const limpezaCategory = createdCategories.find(c => c.name === 'Limpeza')
    
    // Criar produtos de exemplo
    const products = [
      {
        name: 'Coca-Cola 2L',
        barcode: '7894900011517',
        salePrice: 8.50,
        costPrice: 6.00,
        stock: 50,
        unit: 'UN',
        description: 'Refrigerante Coca-Cola 2 Litros',
        categoryId: bebidasCategory?.id || createdCategories[0].id
      },
      {
        name: 'Pão de Açúcar 500g',
        barcode: '7891000100103',
        salePrice: 4.50,
        costPrice: 3.20,
        stock: 25,
        unit: 'UN',
        description: 'Pão de açúcar tradicional 500g',
        categoryId: padariaCategory?.id || createdCategories[1].id
      },
      {
        name: 'Leite Integral 1L',
        barcode: '7891000053508',
        salePrice: 5.20,
        costPrice: 4.10,
        stock: 30,
        unit: 'L',
        description: 'Leite integral UHT 1 litro',
        categoryId: laticiniosCategory?.id || createdCategories[2].id
      },
      {
        name: 'Arroz Branco 5kg',
        barcode: '7891000315507',
        salePrice: 22.90,
        costPrice: 18.50,
        stock: 15,
        unit: 'KG',
        description: 'Arroz branco tipo 1, pacote 5kg',
        categoryId: merceariaCategory?.id || createdCategories[3].id
      },
      {
        name: 'Detergente Líquido 500ml',
        barcode: '7891150056503',
        salePrice: 3.80,
        costPrice: 2.90,
        stock: 8,
        unit: 'UN',
        description: 'Detergente líquido neutro 500ml',
        categoryId: limpezaCategory?.id || createdCategories[4].id
      },
      {
        name: 'Guaraná Antarctica 2L',
        barcode: '7894900010015',
        salePrice: 7.90,
        costPrice: 5.50,
        stock: 35,
        unit: 'UN',
        description: 'Refrigerante Guaraná Antarctica 2 Litros',
        categoryId: bebidasCategory?.id || createdCategories[0].id
      }
    ]
    
    console.log('📦 Criando produtos...')
    for (const product of products) {
      await prisma.product.upsert({
        where: { barcode: product.barcode },
        update: {},
        create: product
      })
      console.log(`✅ Produto criado: ${product.name}`)
    }
    
    // Criar usuário padrão
    console.log('👤 Criando usuário padrão...')
    await prisma.user.upsert({
      where: { email: 'admin@sisiago.com' },
      update: {},
      create: {
        email: 'admin@sisiago.com',
        name: 'Administrador',
        password: 'admin123', // Em produção, usar hash
        role: 'ADMIN'
      }
    })
    console.log('✅ Usuário admin criado')
    
    console.log('🎉 Seed concluído com sucesso!')
    
    // Mostrar estatísticas
    const stats = {
      categories: await prisma.category.count(),
      products: await prisma.product.count(),
      users: await prisma.user.count()
    }
    
    console.log('📊 Estatísticas:')
    console.log(`   Categorias: ${stats.categories}`)
    console.log(`   Produtos: ${stats.products}`)
    console.log(`   Usuários: ${stats.users}`)
    
  } catch (error) {
    console.error('❌ Erro no seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedData()