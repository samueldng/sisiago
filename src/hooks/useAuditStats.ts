import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface AuditStats {
  totalLogs: number
  operationStats: {
    INSERT: number
    UPDATE: number
    DELETE: number
  }
  tableStats: Array<{
    table_name: string
    count: number
  }>
  userStats: Array<{
    user_id: string
    user_email: string
    count: number
  }>
  hourlyStats?: Array<{
    hour: string
    count: number
  }>
  dailyStats?: Array<{
    date: string
    count: number
  }>
  riskMetrics?: {
    suspiciousActivities: number
    failedLogins: number
    unusualPatterns: number
    riskScore: number
  }
}

export interface StatsFilters {
  startDate?: string
  endDate?: string
  tableName?: string
  userId?: string
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'custom'
}

export interface UseAuditStatsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  includeHourlyStats?: boolean
  includeDailyStats?: boolean
  includeRiskMetrics?: boolean
}

export interface UseAuditStatsReturn {
  stats: AuditStats | null
  loading: boolean
  error: string | null
  filters: StatsFilters
  setFilters: (filters: StatsFilters) => void
  refresh: () => void
  getTimeRangeStats: (range: '1h' | '24h' | '7d' | '30d') => void
  compareWithPrevious: () => Promise<{ current: AuditStats; previous: AuditStats } | null>
}

const DEFAULT_REFRESH_INTERVAL = 60000 // 1 minute

export function useAuditStats(options: UseAuditStatsOptions = {}): UseAuditStatsReturn {
  const {
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    includeHourlyStats = false,
    includeDailyStats = false,
    includeRiskMetrics = false
  } = options

  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<StatsFilters>({
    timeRange: '24h'
  })

  const calculateTimeRange = useCallback((range: '1h' | '24h' | '7d' | '30d') => {
    const now = new Date()
    const start = new Date()
    
    switch (range) {
      case '1h':
        start.setHours(now.getHours() - 1)
        break
      case '24h':
        start.setDate(now.getDate() - 1)
        break
      case '7d':
        start.setDate(now.getDate() - 7)
        break
      case '30d':
        start.setDate(now.getDate() - 30)
        break
    }
    
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString()
    }
  }, [])

  const fetchStats = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      let dateRange = {}
      if (currentFilters.timeRange && currentFilters.timeRange !== 'custom') {
        dateRange = calculateTimeRange(currentFilters.timeRange)
      } else if (currentFilters.startDate && currentFilters.endDate) {
        dateRange = {
          startDate: currentFilters.startDate,
          endDate: currentFilters.endDate
        }
      }

      // Fazer chamada para a API route
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('start_date', dateRange.startDate)
      if (dateRange.endDate) params.append('end_date', dateRange.endDate)
      if (currentFilters.tableName) params.append('table_name', currentFilters.tableName)
      if (currentFilters.userId) params.append('user_id', currentFilters.userId)

      const response = await fetch(`/api/audit-logs/stats?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Erro ao buscar estatísticas: ${response.statusText}`)
      }
      const baseStats = await response.json()

      // Mapear byOperation para operationStats com verificações de segurança
      const operationStats = {
        INSERT: baseStats.byOperation?.INSERT || 0,
        UPDATE: baseStats.byOperation?.UPDATE || 0,
        DELETE: baseStats.byOperation?.DELETE || 0
      }

      // Mapear byTable para tableStats
      const tableStats = Object.entries(baseStats.byTable || {}).map(([table_name, count]) => ({
        table_name,
        count: count as number
      }))

      // Mapear byUser para userStats
      const userStats = Object.entries(baseStats.byUser || {}).map(([user_email, count]) => ({
        user_id: user_email, // Usando email como ID temporariamente
        user_email,
        count: count as number
      }))

      let enhancedStats: AuditStats = {
        totalLogs: baseStats.totalLogs || 0,
        operationStats,
        tableStats,
        userStats,
        hourlyStats: [],
        dailyStats: [],
        riskMetrics: {
          suspiciousActivities: 0,
          failedLogins: 0,
          unusualPatterns: 0,
          riskScore: 0
        }
      }

      // Add hourly stats if requested
      if (includeHourlyStats) {
        enhancedStats.hourlyStats = await fetchHourlyStats(dateRange)
      }

      // Add daily stats if requested
      if (includeDailyStats) {
        enhancedStats.dailyStats = await fetchDailyStats(dateRange)
      }

      // Add risk metrics if requested
      if (includeRiskMetrics) {
        enhancedStats.riskMetrics = await calculateRiskMetrics(dateRange)
      }

      setStats(enhancedStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas de auditoria'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters, calculateTimeRange, includeHourlyStats, includeDailyStats, includeRiskMetrics])

  const fetchHourlyStats = async (dateRange: { startDate?: string; endDate?: string }) => {
    // Simulate hourly stats - in real implementation, this would be an API call
    const hours = []
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
      hours.push({
        hour: hour.toISOString().slice(0, 13) + ':00:00',
        count: Math.floor(Math.random() * 50)
      })
    }
    return hours
  }

  const fetchDailyStats = async (dateRange: { startDate?: string; endDate?: string }) => {
    // Simulate daily stats - in real implementation, this would be an API call
    const days = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      days.push({
        date: day.toISOString().slice(0, 10),
        count: Math.floor(Math.random() * 200)
      })
    }
    return days
  }

  const calculateRiskMetrics = async (dateRange: { startDate?: string; endDate?: string }) => {
    // Simulate risk metrics calculation - in real implementation, this would analyze patterns
    const suspiciousActivities = Math.floor(Math.random() * 10)
    const failedLogins = Math.floor(Math.random() * 20)
    const unusualPatterns = Math.floor(Math.random() * 5)
    
    // Calculate risk score based on various factors
    const riskScore = Math.min(100, (suspiciousActivities * 10) + (failedLogins * 2) + (unusualPatterns * 15))
    
    return {
      suspiciousActivities,
      failedLogins,
      unusualPatterns,
      riskScore
    }
  }

  const setFilters = useCallback((newFilters: StatsFilters) => {
    setFiltersState(newFilters)
    fetchStats(newFilters)
  }, [fetchStats])

  const refresh = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  const getTimeRangeStats = useCallback((range: '1h' | '24h' | '7d' | '30d') => {
    const newFilters = { ...filters, timeRange: range }
    setFilters(newFilters)
  }, [filters, setFilters])

  const compareWithPrevious = useCallback(async () => {
    if (!stats) return null
    
    try {
      setLoading(true)
      
      // Calculate previous period dates
      const timeRange = filters.timeRange === 'custom' ? '24h' : (filters.timeRange || '24h')
      const currentStart = new Date(filters.startDate || calculateTimeRange(timeRange).startDate)
      const currentEnd = new Date(filters.endDate || calculateTimeRange(timeRange).endDate)
      const duration = currentEnd.getTime() - currentStart.getTime()
      
      const previousStart = new Date(currentStart.getTime() - duration)
      const previousEnd = new Date(currentStart.getTime())
      
      // Fazer chamada para a API route para estatísticas anteriores
      const params = new URLSearchParams()
      params.append('start_date', previousStart.toISOString())
      params.append('end_date', previousEnd.toISOString())
      if (filters.tableName) params.append('table_name', filters.tableName)
      if (filters.userId) params.append('user_id', filters.userId)

      const response = await fetch(`/api/audit-logs/stats?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Erro ao buscar estatísticas anteriores: ${response.statusText}`)
      }
      const previousStats = await response.json()
      
      return {
        current: stats,
        previous: previousStats
      }
    } catch (err) {
      toast.error('Erro ao comparar com período anterior')
      return null
    } finally {
      setLoading(false)
    }
  }, [stats, filters, calculateTimeRange])

  // Initial load
  useEffect(() => {
    fetchStats()
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchStats()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchStats])

  return {
    stats,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    getTimeRangeStats,
    compareWithPrevious
  }
}