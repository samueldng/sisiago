'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
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
import { useSearchParams } from 'next/navigation'
import ZXingReliableScanner from '@/components/ZXingReliableScanner'

function PDVPageContent() {
  const searchParams = useSearchParams()
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanningBarcode, setScanningBarcode] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [pdvOpenTime, setPdvOpenTime] = useState<Date | null>(null)

  // Inicializar data de abertura no cliente
  useEffect(() => {
    setPdvOpenTime(new Date())
  }, [])

  // Detectar parâmetro scanner=true na URL
  useEffect(() => {
    const scannerParam = searchParams.get('scanner')
    if (scannerParam === 'true') {
      setShowScanner(true)
    }
  }, [searchParams])

  // Formatar data e hora
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Carregar produtos
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products?isActive=true')
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos')
      }
      const data = await response.json()
      setProducts(data.data || []) // Corrigido: usar 'data' em vez de 'products'
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Busca de produtos com debounce
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length >= 1) { // Reduzir para 1 caractere para códigos de barras
        try {
          const response = await fetch(`/api/products?search=${encodeURIComponent(term)}&isActive=true&limit=20`)
          if (response.ok) {
            const data = await response.json()
            setSearchResults(data.data || []) // Corrigido: usar 'data' em vez de 'products'
            setShowSuggestions(true)
          } else {
            console.error('Erro na resposta da API:', response.status)
            setSearchResults([])
            setShowSuggestions(false)
          }
        } catch (error) {
          console.error('Erro na busca:', error)
          setSearchResults([])
          setShowSuggestions(false)
        }
      } else {
        setSearchResults([])
        setShowSuggestions(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm)
    } else {
      setSearchResults([])
      setShowSuggestions(false)
    }
  }, [searchTerm, debouncedSearch])

  // Filtrar produtos localmente quando não há termo de busca ou termo muito curto
  const filteredProducts = searchTerm.length < 2 ? 
    products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20) : // Limitar a 20 produtos para performance
    []

  // Selecionar produto da sugestão
  const selectProductFromSuggestion = (product: Product) => {
    addToCart(product, 1)
    setSearchTerm('')
    setShowSuggestions(false)
    setSearchResults([])
  }

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

  const handleBarcodeScanned = async (barcode: string) => {
    // Evitar múltiplas execuções simultâneas do mesmo código
    if (scanningBarcode === barcode || loading) {
      return
    }
    
    try {
      setScanningBarcode(barcode)
      setLoading(true)
      const response = await fetch(`/api/products/barcode/${barcode}`)
      const data = await response.json()
      
      if (data.success) {
        addToCart(data.data)
      } else {
        alert(`Produto com código ${barcode} não encontrado`)
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      alert('Erro ao buscar produto')
    } finally {
      setLoading(false)
      setScanningBarcode(null)
    }
  }

  // Iniciar scanner
  const startScanner = () => {
    setShowScanner(true)
  }

  // Callback do scanner
  const handleScanResult = (barcode: string) => {
    handleBarcodeScanned(barcode)
    setShowScanner(false)
  }

  // Fechar scanner
  const closeScanner = () => {
    setShowScanner(false)
  }

  // Finalizar venda
  const finalizeSale = async () => {
    if (!selectedPaymentMethod || cart.length === 0) return
    
    try {
      setLoading(true)
      
      // Gerar UUID temporário para usuário (desenvolvimento)
      const tempUserId = crypto.randomUUID()
      
      // Preparar dados da venda
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.salePrice
        })),
        discount: discount,
        paymentMethod: selectedPaymentMethod,
        notes: '',
        userId: tempUserId // Usar UUID temporário
      }
      
      console.log('Dados da venda:', saleData)
      
      // Enviar para API
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      })
      
      const result = await response.json()
      console.log('Resposta da API:', result)
      
      if (result.success) {
        // Limpar carrinho após venda
        clearCart()
        alert(`Venda realizada com sucesso! Total: ${formatCurrency(total)}`)
      } else {
        console.error('Erro da API:', result)
        throw new Error(result.error || 'Erro ao processar venda')
      }
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      alert('Erro ao finalizar venda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile */}
      <header className="mobile-header">
        <div className="flex items-center justify-between p-3">
          <Link href="/" className="flex items-center text-gray-600 touch-friendly">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="mobile-optimized">Voltar</span>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold mobile-optimized">Sis IA Go - PDV</h1>
            <p className="text-xs text-gray-500 mobile-optimized">
              Aberto em: {pdvOpenTime ? formatDateTime(pdvOpenTime) : 'Carregando...'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={startScanner}
            className="touch-friendly"
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
                      onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="pl-10"
                    />
                    
                    {/* Sugestões de Produtos */}
                     {showSuggestions && searchResults.length > 0 && (
                       <div className="search-suggestions">
                         {searchResults.map((product) => (
                           <div
                             key={product.id}
                             onClick={() => selectProductFromSuggestion(product)}
                             className="search-suggestion-item"
                           >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{product.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {product.barcode && (
                                  <span className="font-mono">{product.barcode}</span>
                                )}
                                <span>•</span>
                                <span>Estoque: {product.stock}</span>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-bold text-green-600">{formatCurrency(product.salePrice)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  className="hidden lg:flex ml-4"
                  onClick={startScanner}
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Scanner
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
                        <div className="flex items-center space-x-1 lg:space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 lg:h-8 lg:w-8 touch-friendly"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4 lg:w-3 lg:h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 lg:h-8 lg:w-8 touch-friendly"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4 lg:w-3 lg:h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 lg:h-8 lg:w-8 text-red-600 hover:text-red-700 touch-friendly"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="w-4 h-4 lg:w-3 lg:h-3" />
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
                            className="w-full h-12 lg:h-10 touch-friendly text-sm lg:text-base font-medium"
                            onClick={() => setShowPayment(true)}
                            disabled={cart.length === 0}
                          >
                            Finalizar Venda
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full h-12 lg:h-10 touch-friendly text-sm lg:text-base"
                            onClick={clearCart}
                            disabled={cart.length === 0}
                          >
                            Limpar Carrinho
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <p className="text-sm font-medium mobile-optimized">Forma de Pagamento:</p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.CASH ? 'default' : 'outline'}
                                className="text-xs lg:text-sm h-12 lg:h-10 touch-friendly"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.CASH)}
                              >
                                <Banknote className="w-4 h-4 mr-1" />
                                Dinheiro
                              </Button>
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.PIX ? 'default' : 'outline'}
                                className="text-xs lg:text-sm h-12 lg:h-10 touch-friendly"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.PIX)}
                              >
                                <Smartphone className="w-4 h-4 mr-1" />
                                PIX
                              </Button>
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.CREDIT_CARD ? 'default' : 'outline'}
                                className="text-xs lg:text-sm h-12 lg:h-10 touch-friendly"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.CREDIT_CARD)}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Crédito
                              </Button>
                              <Button
                                variant={selectedPaymentMethod === PaymentMethod.DEBIT_CARD ? 'default' : 'outline'}
                                className="text-xs lg:text-sm h-12 lg:h-10 touch-friendly"
                                onClick={() => setSelectedPaymentMethod(PaymentMethod.DEBIT_CARD)}
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Débito
                              </Button>
                            </div>
                          </div>
                          <Button
                            className="w-full h-12 lg:h-10 touch-friendly text-sm lg:text-base font-medium"
                            onClick={finalizeSale}
                            disabled={!selectedPaymentMethod || loading}
                          >
                            {loading ? 'Processando...' : 'Confirmar Pagamento'}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full h-12 lg:h-10 touch-friendly text-sm lg:text-base"
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

      {/* Scanner de Código de Barras */}
      <ZXingReliableScanner
          isOpen={showScanner}
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
    </div>
  )
}

export default function PDVPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PDVPageContent />
    </Suspense>
  )
}