'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Save,
  Scan,
  Package
} from 'lucide-react'
import { ProductUnit, Category } from '@/types'
import { translateUnit } from '@/utils'

interface ProductFormData {
  name: string
  barcode: string
  salePrice: string
  costPrice: string
  stock: string
  unit: ProductUnit
  description: string
  categoryId: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    barcode: '',
    salePrice: '',
    costPrice: '',
    stock: '0',
    unit: ProductUnit.UN,
    description: '',
    categoryId: ''
  })
  const [errors, setErrors] = useState<Partial<ProductFormData>>({})

  useEffect(() => {
    loadCategories()
  }, [])

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

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
      newErrors.salePrice = 'Preço de venda deve ser maior que zero'
    }

    if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
      newErrors.costPrice = 'Preço de custo não pode ser negativo'
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Estoque não pode ser negativo'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória'
    }

    // Validar código de barras se fornecido
    if (formData.barcode && !/^\d{8}$|^\d{13}$/.test(formData.barcode)) {
      newErrors.barcode = 'Código de barras deve ter 8 ou 13 dígitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      const productData = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || undefined,
        salePrice: parseFloat(formData.salePrice),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        stock: parseInt(formData.stock),
        unit: formData.unit,
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        isActive: true
      }

      // TODO: Implementar chamada para API
      console.log('Criando produto:', productData)
      
      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Produto cadastrado com sucesso!')
      router.push('/produtos')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      alert('Erro ao cadastrar produto')
    } finally {
      setLoading(false)
    }
  }

  const startBarcodeScanner = () => {
    setIsScanning(true)
    // TODO: Implementar scanner de código de barras
    // Simulação de scan
    setTimeout(() => {
      const mockBarcode = '7894900011517'
      handleInputChange('barcode', mockBarcode)
      setIsScanning(false)
    }, 2000)
  }

  const calculateMargin = () => {
    const salePrice = parseFloat(formData.salePrice) || 0
    const costPrice = parseFloat(formData.costPrice) || 0
    
    if (salePrice === 0 || costPrice === 0) return 0
    
    return ((salePrice - costPrice) / salePrice * 100).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/produtos" className="flex items-center text-gray-600 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:block">Voltar</span>
              </Link>
              <Package className="w-6 h-6 mr-2 text-purple-600" />
              <h1 className="text-xl font-semibold text-gray-900">Novo Produto</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Coca-Cola 2L"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Barras
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.barcode}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        placeholder="Ex: 7894900011517"
                        className={errors.barcode ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startBarcodeScanner}
                        disabled={isScanning}
                      >
                        <Scan className="w-4 h-4" />
                      </Button>
                    </div>
                    {errors.barcode && (
                      <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição detalhada do produto..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.categoryId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preços e Estoque */}
            <Card>
              <CardHeader>
                <CardTitle>Preços e Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Venda *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.salePrice}
                        onChange={(e) => handleInputChange('salePrice', e.target.value)}
                        placeholder="0,00"
                        className={`pl-10 ${errors.salePrice ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.salePrice && (
                      <p className="text-red-500 text-xs mt-1">{errors.salePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço de Custo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costPrice}
                        onChange={(e) => handleInputChange('costPrice', e.target.value)}
                        placeholder="0,00"
                        className={`pl-10 ${errors.costPrice ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.costPrice && (
                      <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>
                    )}
                    {formData.salePrice && formData.costPrice && (
                      <p className="text-xs text-gray-500 mt-1">
                        Margem: {calculateMargin()}%
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Inicial *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="0"
                      className={errors.stock ? 'border-red-500' : ''}
                    />
                    {errors.stock && (
                      <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value as ProductUnit)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.values(ProductUnit).map(unit => (
                      <option key={unit} value={unit}>
                        {translateUnit(unit)} ({unit})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/produtos')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Produto
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>

      {/* Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <div className="animate-pulse mb-4">
              <Scan className="w-16 h-16 mx-auto text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Escaneando Código de Barras</h3>
            <p className="text-gray-600 mb-4">Aponte a câmera para o código de barras</p>
            <Button variant="outline" onClick={() => setIsScanning(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}