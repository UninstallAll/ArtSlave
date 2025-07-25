'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  MessageSquare,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Settings,
  Eye,
  Filter,
  TestTube
} from 'lucide-react'

interface InfoReceiverStats {
  totalMessages: number
  pendingMessages: number
  processingMessages: number
  completedMessages: number
  failedMessages: number
  manualReviewMessages: number
  totalResources: number
  verifiedResources: number
  duplicateResources: number
  averageConfidence: number
  processingRate: number
  successRate: number
}

interface RawMessage {
  id: string
  content: string
  source: string
  status: string
  createdAt: string
  processedAt?: string
  errorMessage?: string
}

export default function InfoReceiverDashboard() {
  const { getThemeClasses } = useTheme()
  const themeClasses = getThemeClasses()

  const [stats, setStats] = useState<InfoReceiverStats | null>(null)
  const [messages, setMessages] = useState<RawMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('messages')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 加载统计信息
      const statsResponse = await fetch('/api/info-receiver/resources?action=stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      // 加载最近消息
      const messagesResponse = await fetch('/api/info-receiver/resources?action=messages&limit=10')
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.data)
      }

    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleProcessPending = async () => {
    try {
      const response = await fetch('/api/info-receiver/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'processPending' })
      })

      if (response.ok) {
        await handleRefresh()
      }
    } catch (error) {
      console.error('Failed to process pending messages:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'EMAIL': return '📧'
      case 'WECHAT': return '💬'
      case 'WEB': return '🌐'
      case 'SOCIAL': return '📱'
      default: return '📄'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>
            信息接收器
          </h1>
          <p className={`${themeClasses.textSecondary} mt-2`}>
            多渠道信息接收、智能解析和质量控制
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className={`${themeClasses.buttonHover} border-2 ${themeClasses.border}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            onClick={handleProcessPending}
            className={themeClasses.button}
          >
            <Activity className="w-4 h-4 mr-2" />
            处理待处理消息
          </Button>
          <Button
            onClick={() => window.open('/test-info-receiver', '_blank')}
            variant="outline"
            className={`${themeClasses.buttonHover} border-2 ${themeClasses.border}`}
          >
            <TestTube className="w-4 h-4 mr-2" />
            系统测试
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`${themeClasses.cardBackground} border-2 ${themeClasses.border}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              总消息数
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
              {stats?.totalMessages || 0}
            </div>
            <p className={`text-xs ${themeClasses.textSecondary}`}>
              +{stats?.pendingMessages || 0} 待处理
            </p>
          </CardContent>
        </Card>

        <Card className={`${themeClasses.cardBackground} border-2 ${themeClasses.border}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              成功率
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
              {stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className={`text-xs ${themeClasses.textSecondary}`}>
              {stats?.completedMessages || 0} 已完成
            </p>
          </CardContent>
        </Card>

        <Card className={`${themeClasses.cardBackground} border-2 ${themeClasses.border}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              资源总数
            </CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
              {stats?.totalResources || 0}
            </div>
            <p className={`text-xs ${themeClasses.textSecondary}`}>
              {stats?.verifiedResources || 0} 已验证
            </p>
          </CardContent>
        </Card>

        <Card className={`${themeClasses.cardBackground} border-2 ${themeClasses.border}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              平均置信度
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
              {stats?.averageConfidence ? `${(stats.averageConfidence * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className={`text-xs ${themeClasses.textSecondary}`}>
              智能解析质量
            </p>
          </CardContent>
        </Card>
      </div>

      <div className={`${themeClasses.cardBackground} rounded-3xl border-2 ${themeClasses.border} p-6`}>
        <h2 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>信息接收器仪表板</h2>
        <p className={`${themeClasses.textSecondary}`}>信息接收器功能正在开发中...</p>
      </div>
    </div>
  )
}