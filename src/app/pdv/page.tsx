'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ShoppingCart,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  ArrowLeft
} from 'lucide-react'
import { formatCurrency, debounce } from '@/utils'
import { Product, CartItem, PaymentMethod } from '@/types'
import Link from 'next/link'

export default function PDVPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)

  // Carregar produtos
  useEffect(() => {
    loadProducts()
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

  // Busca de produtos com debounce
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      // TODO: Implementar busca na API
      console.log('Buscando:', term)
    }, 300),
    []
  )

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm)
    }
  }, [searchTerm, debouncedSearch])

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  )

  // Adicionar produto ao carrinho
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * product.salePrice }
            : item
        )
      } else {
        return [...prevCart, {
          product,
          quantity,
          total: quantity * product.salePrice
        }]
      }
    })
  }

  // Remover produto do carrinho
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  // Atualizar quantidade no carrinho
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.product.salePrice }
          : item
      )
    )
  }

  // Calcular totais
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const discount = 0 // TODO: Implementar sistema de desconto
  const total = subtotal - discount

  // Limpar carrinho
  const clearCart = () => {
    setCart([])
    setShowPayment(false)
    setSelectedPaymentMethod(null)
  }

  // Iniciar scanner
  const startScanner = () => {
    setIsScanning(true)
    // TODO: Implementar scanner de código de barras
    // Simulação de scan
    setTimeout(() => {
      const mockBarcode = '7894900011517'
      const product = products.find(p => p.barcode === mockBarcode)
      if (product) {
        addToCart(product)
      }
      setIsScanning(false)
    }, 2000)
  }

  // Finalizar venda
  const finalizeSale = async () => {
    if (!selectedPaymentMethod || cart.length === 0) return
    
    try {
      setLoading(true)
      // TODO: Implementar finalização da venda
      console.log('Finalizando venda:', {
        items: cart,
        total,
        paymentMethod: selectedPaymentMethod
      })
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Limpar carrinho após venda
      clearCart()
      alert('Venda realizada com sucesso!')
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      alert('Erro ao finalizar venda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <header className="bg-white shadow-sm border-b lg:hidden">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center text-gray-600">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <h1 className="text-lg font-semibold">Ponto de Venda</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={startScanner}
            disabled={isScanning}
          >
            <Scan className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="pdv-grid">
        {/* Área de Produtos */}
        <div className="pdv-products">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="hidden lg:block">Produtos</CardTitle>
                <div className="flex-1 lg:flex-none">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar produto ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  className="hidden lg:flex ml-4"
                  onClick={startScanner}
                  disabled={isScanning}
                >
                  <Scan className="w-4 h-4 mr-2" />
                  {isScanning ? 'Escaneando...' : 'Scanner'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando produtos...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="product-card"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(product.salePrice)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{product.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Estoque: {product.stock}</span>
                        <span>{product.barcode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div className="pdv-cart">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Carrinho ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos para começar</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="cart-item">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.product.salePrice)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totais */}
                  <div className="border-t pt-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="mt-4 space-y-2">
                      {!showPayment ? (
                        <>
                          <Button
                            className="w-full"
                            onClick={() => setShowPayment(true)}
                            disabled={cart.length === 0}
                          >
                            Finalizar Venda
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={clearCart}
                            disabled={cart.length === 0}
                          >
                            Limpar Carrinho
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Forma de Pagamento:</p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.CASH ? 'default' : 'outline'}
                                className="text-xs"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.CASH)}
                              >
                                <Banknote className="w-4 h-4 mr-1" />
                                Dinheiro
                              </Button>
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.PIX ? 'default' : 'outline'}
                                className="text-xs"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.PIX)}
                              >
                                <Smartphone className="w-4 h-4 mr-1" />
                                PIX
                              </Button>
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.CREDIT_CARD ? 'default' : 'outline'}
                                className="text-xs"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.CREDIT_CARD)}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Crédito
                              </Button>
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.DEBIT_CARD ? 'default' : 'outline'}
                                className="text-xs"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.DEBIT_CARD)}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Débito
                              </Button>
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            onClick={finalizeSale}
                            disabled={!selectedPaymentMethod || loading}
                          >
                            {loading ? 'Processando...' : 'Confirmar Pagamento'}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowPayment(false)}
                          >
                            Voltar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scanner Overlay */}
      {isScanning && (
        <div className="scanner-overlay">
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