'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// import { Progress } from '@/components/ui/progress'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Network, 
  Play, 
  Square, 
  Download,
  Eye,
  Users,
  Building,
  Palette,
  MapPin,
  Calendar,
  Zap
} from 'lucide-react'

interface SearchNode {
  id: string
  type: string
  name: string
  relevanceScore: number
  depth: number
  data: any
}

interface SearchResult {
  nodes: SearchNode[]
  edges: any[]
  metadata: {
    totalNodes: number
    totalEdges: number
    maxDepthReached: number
    searchDuration: number
  }
}

const NODE_TYPE_ICONS = {
  artist: Users,
  exhibition: Eye,
  institution: Building,
  artwork: Palette,
  curator: Users,
  movement: Zap,
  location: MapPin,
  event: Calendar
}

// 简化的进度条组件
const SimpleProgress = ({ value }: { value: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
)

const NODE_TYPE_COLORS = {
  artist: 'bg-blue-100 text-blue-800',
  exhibition: 'bg-green-100 text-green-800',
  institution: 'bg-purple-100 text-purple-800',
  artwork: 'bg-orange-100 text-orange-800',
  curator: 'bg-pink-100 text-pink-800',
  movement: 'bg-yellow-100 text-yellow-800',
  location: 'bg-gray-100 text-gray-800',
  event: 'bg-red-100 text-red-800'
}

export default function DeepSearchPage() {
  const [searchName, setSearchName] = useState('')
  const [searchType, setSearchType] = useState('artist')
  const [preset, setPreset] = useState('quick')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [searchStatus, setSearchStatus] = useState('')

  const handleSearch = useCallback(async () => {
    if (!searchName.trim()) return

    setIsSearching(true)
    setProgress(0)
    setSearchStatus('初始化搜索...')
    setSearchResult(null)

    try {
      const response = await fetch('/api/deep-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coreNode: {
            name: searchName,
            type: searchType,
            data: {}
          },
          preset: preset
        })
      })

      const result = await response.json()

      if (result.success) {
        setSearchResult(result.data)
        setProgress(100)
        setSearchStatus('搜索完成')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchStatus(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSearching(false)
    }
  }, [searchName, searchType, preset])

  const stopSearch = useCallback(() => {
    setIsSearching(false)
    setSearchStatus('搜索已停止')
  }, [])

  const renderNodeCard = (node: SearchNode) => {
    const IconComponent = NODE_TYPE_ICONS[node.type as keyof typeof NODE_TYPE_ICONS] || Network
    const colorClass = NODE_TYPE_COLORS[node.type as keyof typeof NODE_TYPE_COLORS] || 'bg-gray-100 text-gray-800'

    return (
      <Card key={node.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className="w-5 h-5" />
              <CardTitle className="text-lg">{node.name}</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={colorClass}>
                {node.type}
              </Badge>
              <Badge variant="outline">
                深度 {node.depth}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">相关性:</span>
            <SimpleProgress value={node.relevanceScore * 100} />
            <span className="text-sm font-medium">{(node.relevanceScore * 100).toFixed(1)}%</span>
          </div>
        </CardHeader>
        {Object.keys(node.data).length > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(node.data).slice(0, 4).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="ml-1">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const renderSearchStats = () => {
    if (!searchResult) return null

    const nodesByType = searchResult.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const nodesByDepth = searchResult.nodes.reduce((acc, node) => {
      acc[node.depth] = (acc[node.depth] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{searchResult.metadata.totalNodes}</div>
            <div className="text-sm text-gray-600">总节点数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{searchResult.metadata.totalEdges}</div>
            <div className="text-sm text-gray-600">总关系数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{searchResult.metadata.maxDepthReached}</div>
            <div className="text-sm text-gray-600">最大深度</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{(searchResult.metadata.searchDuration / 1000).toFixed(1)}s</div>
            <div className="text-sm text-gray-600">搜索耗时</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Network className="w-8 h-8 mr-3 text-blue-600" />
            深度搜索与知识图谱
          </h1>
          <p className="text-gray-600">
            基于核心对象进行深度扩散搜索，构建艺术领域知识网络
          </p>
        </div>

        {/* 搜索表单 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>开始搜索</CardTitle>
            <CardDescription>
              输入艺术家、展览、机构等名称，系统将自动发现相关内容并构建知识网络
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="searchName">搜索名称</Label>
                <Input
                  id="searchName"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="例如: David Hockney"
                  disabled={isSearching}
                />
              </div>
              <div>
                <Label htmlFor="searchType">类型</Label>
                <Select value={searchType} onValueChange={setSearchType} disabled={isSearching}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artist">艺术家</SelectItem>
                    <SelectItem value="exhibition">展览</SelectItem>
                    <SelectItem value="institution">机构</SelectItem>
                    <SelectItem value="artwork">艺术作品</SelectItem>
                    <SelectItem value="curator">策展人</SelectItem>
                    <SelectItem value="movement">艺术运动</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="preset">搜索模式</Label>
                <Select value={preset} onValueChange={setPreset} disabled={isSearching}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">快速搜索</SelectItem>
                    <SelectItem value="deep">深度搜索</SelectItem>
                    <SelectItem value="broad">广泛搜索</SelectItem>
                    <SelectItem value="precise">精确搜索</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                {!isSearching ? (
                  <Button onClick={handleSearch} className="w-full" disabled={!searchName.trim()}>
                    <Play className="w-4 h-4 mr-2" />
                    开始搜索
                  </Button>
                ) : (
                  <Button onClick={stopSearch} variant="destructive" className="w-full">
                    <Square className="w-4 h-4 mr-2" />
                    停止搜索
                  </Button>
                )}
              </div>
            </div>

            {/* 搜索进度 */}
            {isSearching && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{searchStatus}</span>
                  <span>{progress}%</span>
                </div>
                <SimpleProgress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 搜索结果 */}
        {searchResult && (
          <div>
            {renderSearchStats()}

            {/* 节点列表 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">发现的节点 ({searchResult.nodes.length})</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  导出数据
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResult.nodes
                  .sort((a, b) => b.relevanceScore - a.relevanceScore)
                  .map(renderNodeCard)}
              </div>
            </div>

            {/* 知识图谱预览 */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>知识图谱可视化</CardTitle>
                <CardDescription>
                  交互式图谱展示节点间的关系网络
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>图谱可视化组件开发中...</p>
                    <p className="text-sm">将支持缩放、拖拽、筛选等交互功能</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 分析报告 */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>搜索分析报告</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">节点类型分布</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        searchResult.nodes.reduce((acc, node) => {
                          acc[node.type] = (acc[node.type] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <Badge key={type} className={NODE_TYPE_COLORS[type as keyof typeof NODE_TYPE_COLORS]}>
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">深度分布</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(
                        searchResult.nodes.reduce((acc, node) => {
                          acc[node.depth] = (acc[node.depth] || 0) + 1
                          return acc
                        }, {} as Record<number, number>)
                      ).map(([depth, count]) => (
                        <Badge key={depth} variant="outline">
                          深度 {depth}: {count} 个节点
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
