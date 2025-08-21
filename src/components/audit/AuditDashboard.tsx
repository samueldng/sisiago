'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuditStats } from '@/hooks/useAuditStats'
import { useAuditAlerts } from '@/hooks/useAuditAlerts'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Users, 
  Database,
  Clock,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditDashboardProps {
  className?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const SEVERITY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B', 
  high: '#EF4444',
  critical: '#DC2626'
}

export function AuditDashboard({ className }: AuditDashboardProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [activeTab, setActiveTab] = useState('overview')
  
  const { 
    stats, 
    loading: statsLoading, 
    error: statsError,
    getTimeRangeStats,
    compareWithPrevious,
    refresh: refreshStats
  } = useAuditStats({
    autoRefresh: true,
    refreshInterval: 60000,
    includeHourlyStats: true,
    includeDailyStats: true,
    includeRiskMetrics: true
  })

  const {
    alerts,
    unacknowledgedCount,
    loading: alertsLoading,
    refresh: refreshAlerts
  } = useAuditAlerts({
    autoRefresh: true,
    enableRealTime: true
  })

  const handleTimeRangeChange = (range: '1h' | '24h' | '7d' | '30d') => {
    setTimeRange(range)
    getTimeRangeStats(range)
  }

  const handleRefresh = () => {
    refreshStats()
    refreshAlerts()
    toast.success('Dashboard atualizado')
  }

  const handleCompareWithPrevious = async () => {
    const comparison = await compareWithPrevious()
    if (comparison) {
      const change = ((comparison.current.totalLogs - comparison.previous.totalLogs) / comparison.previous.totalLogs) * 100
      toast.info(`Variação: ${change > 0 ? '+' : ''}${change.toFixed(1)}% em relação ao período anterior`)
    }
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Erro ao carregar dashboard: {statsError}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  const operationData = stats?.operationStats ? [
    { name: 'Inserções', value: stats.operationStats.INSERT || 0, color: COLORS[0] },
    { name: 'Atualizações', value: stats.operationStats.UPDATE || 0, color: COLORS[1] },
    { name: 'Exclusões', value: stats.operationStats.DELETE || 0, color: COLORS[2] }
  ] : []

  const riskLevel = stats?.riskMetrics?.riskScore || 0
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'Crítico'
    if (score >= 60) return 'Alto'
    if (score >= 40) return 'Médio'
    return 'Baixo'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Auditoria</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real das atividades do sistema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Última hora</SelectItem>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCompareWithPrevious} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Comparar
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {unacknowledgedCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">
                  {unacknowledgedCount} alerta{unacknowledgedCount > 1 ? 's' : ''} de segurança não reconhecido{unacknowledgedCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-600">
                  Clique na aba "Alertas" para revisar
                </p>
              </div>
              <Button 
                onClick={() => setActiveTab('alerts')} 
                variant="destructive" 
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Revisar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalLogs?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas {timeRange === '1h' ? '1 hora' : timeRange === '24h' ? '24 horas' : timeRange === '7d' ? '7 dias' : '30 dias'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.userStats?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários com atividade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tabelas Afetadas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.tableStats?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Tabelas com modificações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível de Risco</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(riskLevel)}`}>
              {statsLoading ? '...' : getRiskLabel(riskLevel)}
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {riskLevel}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Operations Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Operações</CardTitle>
                <CardDescription>
                  Tipos de operações realizadas no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={operationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {operationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Tables */}
            <Card>
              <CardHeader>
                <CardTitle>Tabelas Mais Ativas</CardTitle>
                <CardDescription>
                  Tabelas com maior número de modificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.tableStats?.slice(0, 5).map((table, index) => (
                    <div key={table.table_name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium">{table.table_name}</span>
                      </div>
                      <Badge variant="secondary">{table.count}</Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum dado disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade por Operação</CardTitle>
              <CardDescription>
                Comparação entre tipos de operações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={operationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            {/* Hourly Trends */}
            {stats?.hourlyStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Atividade por Hora</CardTitle>
                  <CardDescription>
                    Distribuição de atividades nas últimas 24 horas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.hourlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour" 
                        tickFormatter={(value) => new Date(value).getHours() + 'h'}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Daily Trends */}
            {stats?.dailyStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Diária</CardTitle>
                  <CardDescription>
                    Tendência de atividades nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {/* Risk Metrics */}
            {stats?.riskMetrics && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Atividades Suspeitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.riskMetrics.suspiciousActivities}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Logins Falhados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {stats.riskMetrics.failedLogins}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Padrões Incomuns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.riskMetrics.unusualPatterns}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Score de Risco</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getRiskColor(stats.riskMetrics.riskScore)}`}>
                      {stats.riskMetrics.riskScore}/100
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recentes</CardTitle>
                <CardDescription>
                  Últimos alertas de segurança detectados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {alert.severity === 'critical' && <XCircle className="h-5 w-5 text-red-600" />}
                        {alert.severity === 'high' && <AlertCircle className="h-5 w-5 text-orange-600" />}
                        {alert.severity === 'medium' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {alert.severity === 'low' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge 
                            variant={alert.acknowledged ? 'secondary' : 'destructive'}
                            style={{ 
                              backgroundColor: alert.acknowledged ? undefined : SEVERITY_COLORS[alert.severity] 
                            }}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          {alert.userEmail && (
                            <span>Usuário: {alert.userEmail}</span>
                          )}
                          {alert.ipAddress && (
                            <span>IP: {alert.ipAddress}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum alerta recente
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}