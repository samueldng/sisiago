'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { formatCurrency, translateUnit } from '@/utils'
import { Product, Category } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      // TODO: Implementar chamada para API
      // const response = await fetch('/api/products')
      // const data = await response.json()
      // setProducts(data)
      
      // Dados mockados para demonstração
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Coca-Cola 2L',
          barcode: '7894900011517',
          salePrice: 8.50,
          costPrice: 6.00,
          stock: 50,
          unit: 'UN' as any,
          description: 'Refrigerante Coca-Cola 2 Litros',
          isActive: true,
          categoryId: '1',
          category: { id: '1', name: 'Bebidas', createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Pão de Açúcar 500g',
          barcode: '7891000100103',
          salePrice: 4.50,
          costPrice: 3.20,
          stock: 25,
          unit: 'UN' as any,
          description: 'Pão de açúcar tradicional 500g',
          isActive: true,
          categoryId: '2',
          category: { id: '2', name: 'Padaria', createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Leite Integral 1L',
          barcode: '7891000053508',
          salePrice: 5.20,
          costPrice: 4.10,
          stock: 30,
          unit: 'L' as any,
          description: 'Leite integral UHT 1 litro',
          isActive: true,
          categoryId: '3',
          category: { id: '3', name: 'Laticínios', createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          name: 'Arroz Branco 5kg',
          barcode: '7891000315507',
          salePrice: 22.90,
          costPrice: 18.50,
          stock: 15,
          unit: 'KG' as any,
          description: 'Arroz branco tipo 1, pacote 5kg',
          isActive: true,
          categoryId: '4',
          category: { id: '4', name: 'Mercearia', createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '5',
          name: 'Detergente Líquido 500ml',
          barcode: '7891150056503',
          salePrice: 3.80,
          costPrice: 2.90,
          stock: 8,
          unit: 'UN' as any,
          description: 'Detergente líquido neutro 500ml',
          isActive: true,
          categoryId: '5',
          category: { id: '5', name: 'Limpeza', createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      setProducts(mockProducts)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      // TODO: Implementar chamada para API
      const mockCategories: Category[] = [
        { id: '1', name: 'Bebidas', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Padaria', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Laticínios', createdAt: new Date(), updatedAt: new Date() },
        { id: '4', name: 'Mercearia', createdAt: new Date(), updatedAt: new Date() },
        { id: '5', name: 'Limpeza', createdAt: new Date(), updatedAt: new Date() }
      ]
      setCategories(mockCategories)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Calcular estatísticas
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.isActive).length
  const lowStockProducts = products.filter(p => p.stock <= 10).length
  const totalValue = products.reduce((sum, p) => sum + (p.salePrice * p.stock), 0)

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    
    try {
      // TODO: Implementar chamada para API
      setProducts(prev => prev.filter(p => p.id !== productId))
      alert('Produto excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Sem estoque', color: 'text-red-600 bg-red-50' }
    if (stock <= 10) return { text: 'Estoque baixo', color: 'text-yellow-600 bg-yellow-50' }
    return { text: 'Em estoque', color: 'text-green-600 bg-green-50' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:block">Voltar</span>
              </Link>
              <Package className="w-6 h-6 mr-2 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-900">Produtos</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button size="sm" asChild>
                <Link href="/produtos/novo">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
              <div className="text-sm text-gray-600">Total de Produtos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
              <div className="text-sm text-gray-600">Produtos Ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{lowStockProducts}</div>
              <div className="text-sm text-gray-600">Estoque Baixo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-gray-600">Valor Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, código de barras ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Mínimo
                    </label>
                    <Input type="number" placeholder="0,00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Máximo
                    </label>
                    <Input type="number" placeholder="999,99" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="">Todos</option>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="">Todos</option>
                      <option value="low">Estoque baixo</option>
                      <option value="out">Sem estoque</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando produtos...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum produto encontrado</p>
                <Button className="mt-4" asChild>
                  <Link href="/produtos/novo">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Produto
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Produto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Categoria</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Preço</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Estoque</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock)
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.barcode}</div>
                              {product.description && (
                                <div className="text-xs text-gray-400 mt-1">{product.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category?.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{formatCurrency(product.salePrice)}</div>
                            {product.costPrice && (
                              <div className="text-sm text-gray-500">
                                Custo: {formatCurrency(product.costPrice)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{product.stock} {translateUnit(product.unit)}</div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/produtos/${product.id}/editar`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}