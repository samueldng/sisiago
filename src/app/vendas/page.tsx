'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Eye,
  ArrowLeft,
  Calendar,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDateTime, translatePaymentMethod, translateSaleStatus } from '@/utils'
import { Sale, SaleStatus, PaymentMethod } from '@/types'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadSales()
  }, [dateFilter])

  const loadSales = async () => {
    try {
      setLoading(true)
      // TODO: Implementar chamada para API
      // const response = await fetch(`/api/sales?date=${dateFilter}`)
      // const data = await response.json()
      // setSales(data)
      
      // Dados mockados para demonstração
      const mockSales: Sale[] = [
        {
          id: '1',
          total: 25.50,
          discount: 0,
          finalTotal: 25.50,
          paymentMethod: PaymentMethod.PIX,
          status: SaleStatus.PAID,
          notes: '',
          userId: '1',
          items: [
            {
              id: '1',
              quantity: 3,
              unitPrice: 8.50,
              total: 25.50,
              saleId: '1',
              productId: '1',
              product: {
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
              createdAt: new Date()
            }
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
          updatedAt: new Date()
        },
        {
          id: '2',
          total: 15.70,
          discount: 2.00,
          finalTotal: 13.70,
          paymentMethod: PaymentMethod.CASH,
          status: SaleStatus.PAID,
          notes: 'Cliente pagou com R$ 20,00',
          userId: '1',
          items: [
            {
              id: '2',
              quantity: 2,
              unitPrice: 4.50,
              total: 9.00,
              saleId: '2',
              productId: '2',
              product: {
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
              createdAt: new Date()
            },
            {
              id: '3',
              quantity: 1,
              unitPrice: 5.20,
              total: 5.20,
              saleId: '2',
              productId: '3',
              product: {
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
              },
              createdAt: new Date()
            }
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
          updatedAt: new Date()
        },
        {
          id: '3',
          total: 22.90,
          discount: 0,
          finalTotal: 22.90,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          status: SaleStatus.PENDING,
          notes: '',
          userId: '1',
          items: [
            {
              id: '4',
              quantity: 1,
              unitPrice: 22.90,
              total: 22.90,
              saleId: '3',
              productId: '4',
              product: {
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
                createdAt: new Date(),
                updatedAt: new Date()
              },
              createdAt: new Date()
            }
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutos atrás
          updatedAt: new Date()
        }
      ]
      setSales(mockSales)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id.includes(searchTerm) ||
                         sale.items.some(item => 
                           item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesStatus = !selectedStatus || sale.status === selectedStatus
    const matchesPaymentMethod = !selectedPaymentMethod || sale.paymentMethod === selectedPaymentMethod
    
    return matchesSearch && matchesStatus && matchesPaymentMethod
  })

  // Calcular estatísticas
  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.finalTotal, 0)
  const paidSales = filteredSales.filter(sale => sale.status === SaleStatus.PAID).length
  const pendingSales = filteredSales.filter(sale => sale.status === SaleStatus.PENDING).length

  const getStatusIcon = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.PAID:
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case SaleStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-600" />
      case SaleStatus.CANCELLED:
        return <XCircle className="w-4 h-4 text-red-600" />
      case SaleStatus.REFUNDED:
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.PAID:
        return 'bg-green-100 text-green-800'
      case SaleStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case SaleStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      case SaleStatus.REFUNDED:
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
              <BarChart3 className="w-6 h-6 mr-2 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">Vendas</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" asChild>
                <Link href="/pdv">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Nova Venda
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalSales}</div>
                  <div className="text-sm text-gray-600">Total de Vendas</div>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Faturamento</div>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{paidSales}</div>
                  <div className="text-sm text-gray-600">Vendas Pagas</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingSales}</div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por ID da venda ou produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="today">Hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="all">Todas</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value={SaleStatus.PAID}>Pago</option>
                  <option value={SaleStatus.PENDING}>Pendente</option>
                  <option value={SaleStatus.CANCELLED}>Cancelado</option>
                  <option value={SaleStatus.REFUNDED}>Estornado</option>
                </select>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas as formas</option>
                  <option value={PaymentMethod.CASH}>Dinheiro</option>
                  <option value={PaymentMethod.PIX}>PIX</option>
                  <option value={PaymentMethod.CREDIT_CARD}>Cartão de Crédito</option>
                  <option value={PaymentMethod.DEBIT_CARD}>Cartão de Débito</option>
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
          </CardContent>
        </Card>

        {/* Lista de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas ({filteredSales.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando vendas...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhuma venda encontrada</p>
                <Button className="mt-4" asChild>
                  <Link href="/pdv">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Fazer Primeira Venda
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSales.map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-gray-600">#{sale.id}</span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(sale.status)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                              {translateSaleStatus(sale.status)}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {translatePaymentMethod(sale.paymentMethod)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          {formatDateTime(sale.createdAt)}
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          <strong>Itens:</strong> {sale.items.map(item => 
                            `${item.product?.name} (${item.quantity}x)`
                          ).join(', ')}
                        </div>
                        
                        {sale.notes && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Observações:</strong> {sale.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between lg:justify-end gap-4 mt-4 lg:mt-0">
                        <div className="text-right">
                          {sale.discount > 0 && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatCurrency(sale.total)}
                            </div>
                          )}
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(sale.finalTotal)}
                          </div>
                          {sale.discount > 0 && (
                            <div className="text-sm text-green-600">
                              Desconto: {formatCurrency(sale.discount)}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/vendas/${sale.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}