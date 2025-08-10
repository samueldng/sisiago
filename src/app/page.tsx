'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Package,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  Scan,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/utils'

interface DashboardStats {
  todaySales: number
  todayRevenue: number
  totalProducts: number
  lowStockProducts: number
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0
  })
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Definir horário inicial no cliente
    setCurrentTime(new Date())
    
    // Atualizar horário a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Carregar estatísticas do dashboard
    loadDashboardStats()

    return () => clearInterval(timer)
  }, [])

  const loadDashboardStats = async () => {
    try {
      // TODO: Implementar chamada para API
      // const response = await fetch('/api/dashboard/stats')
      // const data = await response.json()
      // setStats(data)
      
      // Dados mockados para demonstração
      setStats({
        todaySales: 15,
        todayRevenue: 1250.50,
        totalProducts: 150,
        lowStockProducts: 5
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const quickActions = [
    {
      title: 'Nova Venda',
      description: 'Iniciar processo de venda',
      icon: ShoppingCart,
      href: '/pdv',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Escanear Produto',
      description: 'Ler código de barras',
      icon: Scan,
      href: '/pdv?scanner=true',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Produtos',
      description: 'Gerenciar inventário',
      icon: Package,
      href: '/produtos',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Vendas',
      description: 'Histórico de vendas',
      icon: BarChart3,
      href: '/vendas',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  const statsCards = [
    {
      title: 'Vendas Hoje',
      value: stats.todaySales.toString(),
      description: 'Transações realizadas',
      icon: ShoppingCart,
      color: 'text-green-600'
    },
    {
      title: 'Faturamento Hoje',
      value: formatCurrency(stats.todayRevenue),
      description: 'Receita do dia',
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'Total de Produtos',
      value: stats.totalProducts.toString(),
      description: 'Itens cadastrados',
      icon: Package,
      color: 'text-purple-600'
    },
    {
      title: 'Estoque Baixo',
      value: stats.lowStockProducts.toString(),
      description: 'Produtos em falta',
      icon: TrendingUp,
      color: 'text-red-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sis IA Go</h1>
              <span className="ml-2 text-xs sm:text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded-full">PDV</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                <Calendar className="inline w-4 h-4 mr-1" />
                {currentTime ? formatDateTime(currentTime) : '--:--'}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/configuracoes">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Configurações</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ações Rápidas */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Estatísticas */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Dia</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.description}</p>
                      </div>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Navegação Principal */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/pdv">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
                    Ponto de Venda
                  </CardTitle>
                  <CardDescription>
                    Interface principal para realizar vendas com leitor de código de barras
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/produtos">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-purple-600" />
                    Produtos
                  </CardTitle>
                  <CardDescription>
                    Cadastro e gerenciamento de produtos e estoque
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/categorias">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-indigo-600" />
                    Categorias
                  </CardTitle>
                  <CardDescription>
                    Gerenciamento de categorias de produtos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/vendas">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                    Vendas
                  </CardTitle>
                  <CardDescription>
                    Histórico de vendas, relatórios e acompanhamento de pagamentos
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/pagamentos">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    Pagamentos
                  </CardTitle>
                  <CardDescription>
                    Gestão de pagamentos PIX, cartão e dinheiro
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/clientes">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600" />
                    Clientes
                  </CardTitle>
                  <CardDescription>
                    Cadastro de clientes e histórico de compras
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/relatorios">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-red-600" />
                    Relatórios
                  </CardTitle>
                  <CardDescription>
                    Análises de vendas, produtos mais vendidos e performance
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}