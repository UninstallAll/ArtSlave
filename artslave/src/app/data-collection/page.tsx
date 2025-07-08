'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Database, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Search,
  Filter,
  Calendar,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react'

interface DataSource {
  id: string
  name: string
  url: string
  type: string
  isActive: boolean
  lastCrawled?: string
  itemsFound: number
  status: 'idle' | 'running' | 'completed' | 'failed'
}

interface CrawlJob {
  id: string
  dataSourceName: string
  status: string
  startedAt: string
  completedAt?: string
  itemsFound: number
  itemsAdded: number
}

export default function DataCollectionPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: '1',
      name: 'FilmFreeway 艺术节',
      url: 'https://filmfreeway.com/festivals',
      type: 'website',
      isActive: true,
      lastCrawled: '2025-01-08 10:30',
      itemsFound: 156,
      status: 'completed'
    },
    {
      id: '2', 
      name: '中国美术馆展览',
      url: 'http://www.namoc.org',
      type: 'website',
      isActive: true,
      lastCrawled: '2025-01-08 09:15',
      itemsFound: 23,
      status: 'completed'
    },
    {
      id: '3',
      name: 'Artsy 展览信息',
      url: 'https://www.artsy.net',
      type: 'api',
      isActive: false,
      itemsFound: 0,
      status: 'idle'
    }
  ])

  const [crawlJobs, setCrawlJobs] = useState<CrawlJob[]>([
    {
      id: '1',
      dataSourceName: 'FilmFreeway 艺术节',
      status: 'completed',
      startedAt: '2025-01-08 10:30',
      completedAt: '2025-01-08 10:45',
      itemsFound: 156,
      itemsAdded: 12
    },
    {
      id: '2',
      dataSourceName: '中国美术馆展览',
      status: 'completed', 
      startedAt: '2025-01-08 09:15',
      completedAt: '2025-01-08 09:25',
      itemsFound: 23,
      itemsAdded: 5
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'running':
        return <Activity className="w-4 h-4 text-blue-600 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStartCrawl = async (sourceId: string) => {
    const source = dataSources.find(s => s.id === sourceId)
    if (!source) return

    // 更新UI状态为运行中
    setDataSources(prev =>
      prev.map(s =>
        s.id === sourceId
          ? { ...s, status: 'running' }
          : s
      )
    )

    try {
      // 调用后端API启动爬虫
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run',
          crawler: 'demo' // 目前只有演示爬虫
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('爬虫启动成功:', result.message)

        // 模拟爬虫完成（实际应该通过WebSocket或轮询获取状态）
        setTimeout(() => {
          setDataSources(prev =>
            prev.map(s =>
              s.id === sourceId
                ? {
                    ...s,
                    status: 'completed',
                    lastCrawled: new Date().toLocaleString('zh-CN'),
                    itemsFound: Math.floor(Math.random() * 200) + 50
                  }
                : s
            )
          )

          // 添加新的任务记录
          const newJob: CrawlJob = {
            id: Date.now().toString(),
            dataSourceName: source.name,
            status: 'completed',
            startedAt: new Date().toLocaleString('zh-CN'),
            completedAt: new Date().toLocaleString('zh-CN'),
            itemsFound: Math.floor(Math.random() * 200) + 50,
            itemsAdded: Math.floor(Math.random() * 20) + 5
          }

          setCrawlJobs(prev => [newJob, ...prev])
        }, 5000)

      } else {
        throw new Error(result.error || '启动爬虫失败')
      }

    } catch (error) {
      console.error('启动爬虫失败:', error)

      // 恢复状态
      setDataSources(prev =>
        prev.map(s =>
          s.id === sourceId
            ? { ...s, status: 'failed' }
            : s
        )
      )

      alert('启动爬虫失败，请检查后端服务')
    }
  }

  const handleRunAllCrawlers = async () => {
    try {
      const response = await fetch('/api/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run-all'
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('所有爬虫启动成功:', result.message)
        alert('所有爬虫已启动')
      } else {
        throw new Error(result.error || '启动所有爬虫失败')
      }

    } catch (error) {
      console.error('启动所有爬虫失败:', error)
      alert('启动所有爬虫失败，请检查后端服务')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="p-3 bg-white border-2 border-black hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="返回主页"
              >
                <ArrowLeft className="w-5 h-5 text-black" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">数据收集管理</h1>
                  <p className="text-sm text-gray-600">管理爬虫数据源和收集任务</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleRunAllCrawlers}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 transition-all duration-200 hover:shadow-lg"
              >
                <Play className="w-4 h-4 mr-2" />
                运行所有爬虫
              </Button>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl px-6 transition-all duration-200 hover:shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                添加数据源
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活跃数据源</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dataSources.filter(s => s.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今日收集</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dataSources.reduce((sum, s) => sum + s.itemsFound, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">运行中任务</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dataSources.filter(s => s.status === 'running').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">成功率</p>
                <p className="text-2xl font-bold text-gray-900">98.5%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-3xl p-6 border-2 border-black mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索数据源..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus:border-cyan-500 focus:outline-none transition-all duration-200"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-cyan-500 focus:outline-none transition-all duration-200"
            >
              <option value="all">所有类型</option>
              <option value="website">网站爬虫</option>
              <option value="api">API接口</option>
              <option value="rss">RSS订阅</option>
            </select>
            <Button variant="outline" className="rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
          </div>
        </div>

        {/* Data Sources Table */}
        <div className="bg-white rounded-3xl border-2 border-black mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">数据源管理</h2>
            <p className="text-sm text-gray-600 mt-1">管理和监控所有数据收集源</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">数据源</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">类型</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">最后运行</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">收集数量</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dataSources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{source.name}</p>
                          <p className="text-sm text-gray-500">{source.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {source.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(source.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                          {source.status === 'completed' ? '已完成' :
                           source.status === 'running' ? '运行中' :
                           source.status === 'failed' ? '失败' : '待运行'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {source.lastCrawled || '从未运行'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {source.itemsFound}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartCrawl(source.id)}
                          disabled={source.status === 'running'}
                          className="rounded-xl border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 disabled:opacity-50"
                          title={source.status === 'running' ? '暂停爬虫' : '启动爬虫'}
                        >
                          {source.status === 'running' ? (
                            <Pause className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Play className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                          title="配置设置"
                        >
                          <Settings className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Crawl Jobs */}
        <div className="bg-white rounded-3xl border-2 border-black">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">最近任务</h2>
            <p className="text-sm text-gray-600 mt-1">查看最近的数据收集任务记录</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {crawlJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                      {getStatusIcon(job.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.dataSourceName}</p>
                      <p className="text-sm text-gray-500">
                        开始时间: {job.startedAt}
                        {job.completedAt && ` • 完成时间: ${job.completedAt}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      发现 {job.itemsFound} 条 • 新增 {job.itemsAdded} 条
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status === 'completed' ? '已完成' :
                       job.status === 'running' ? '运行中' :
                       job.status === 'failed' ? '失败' : '待运行'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
