'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Star,
  Award,
  Globe,
  ArrowLeft,
  ExternalLink,
  Heart,
  Share2,
  Eye,
  DollarSign,
  Users,
  Bookmark
} from 'lucide-react'

interface SubmissionInfo {
  id: string
  title: string
  organizer: string
  type: 'EXHIBITION' | 'RESIDENCY' | 'COMPETITION' | 'GRANT' | 'CONFERENCE'
  location: string
  country: string
  deadline: string
  eventDate?: string
  fee?: number
  prize?: string
  yearsRunning: number
  description: string
  website: string
  tags: string[]
  isGold?: boolean
  isFeatured?: boolean
  logo?: string
  rating?: number
  applicants?: number
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionInfo[]>([
    {
      id: '1',
      title: '2025年国际当代艺术展',
      organizer: '国际当代艺术基金会',
      type: 'EXHIBITION',
      location: '北京市朝阳区798艺术区',
      country: '中国',
      deadline: '2025-03-15',
      eventDate: '2025-05-01',
      fee: 0,
      prize: '最佳作品奖10万元',
      yearsRunning: 8,
      description: '展示全球当代艺术家的最新作品，涵盖绘画、雕塑、装置艺术等多种媒介。',
      website: 'https://example.com/exhibition2025',
      tags: ['当代艺术', '国际展览', '多媒介'],
      isGold: true,
      isFeatured: true,
      rating: 4.8,
      applicants: 1250
    },
    {
      id: '2',
      title: '青年艺术家驻地项目',
      organizer: '上海当代艺术博物馆',
      type: 'RESIDENCY',
      location: '上海市黄浦区',
      country: '中国',
      deadline: '2025-02-28',
      eventDate: '2025-06-01',
      fee: 0,
      prize: '月补贴5000元',
      yearsRunning: 5,
      description: '为期3个月的艺术家驻地项目，提供工作室、材料费和生活补贴。',
      website: 'https://example.com/residency',
      tags: ['驻地项目', '青年艺术家', '当代艺术'],
      isGold: false,
      isFeatured: true,
      rating: 4.6,
      applicants: 890
    },
    {
      id: '3',
      title: '全国大学生艺术设计大赛',
      organizer: '中国美术家协会',
      type: 'COMPETITION',
      location: '全国',
      country: '中国',
      deadline: '2025-04-30',
      eventDate: '2025-07-15',
      fee: 100,
      prize: '一等奖5万元',
      yearsRunning: 12,
      description: '面向全国高校学生的艺术设计竞赛，包括平面设计、产品设计、环境设计等类别。',
      website: 'https://example.com/competition',
      tags: ['学生竞赛', '艺术设计', '全国性'],
      isGold: true,
      isFeatured: false,
      rating: 4.7,
      applicants: 2340
    },
    {
      id: '4',
      title: '艺术创新基金资助项目',
      organizer: '文化部艺术发展中心',
      type: 'GRANT',
      location: '北京市',
      country: '中国',
      deadline: '2025-03-31',
      fee: 0,
      prize: '资助金额10-50万元',
      yearsRunning: 15,
      description: '支持具有创新性的艺术项目，资助金额10-50万元不等。',
      website: 'https://example.com/grant',
      tags: ['政府资助', '艺术创新', '项目资助'],
      isGold: false,
      isFeatured: true,
      rating: 4.9,
      applicants: 567
    },
    {
      id: '5',
      title: '数字艺术与科技国际研讨会',
      organizer: '中央美术学院',
      type: 'CONFERENCE',
      location: '北京市朝阳区',
      country: '中国',
      deadline: '2025-02-15',
      eventDate: '2025-04-20',
      fee: 500,
      yearsRunning: 6,
      description: '探讨数字艺术与科技融合的最新趋势，邀请国内外专家学者参与。',
      website: 'https://example.com/conference',
      tags: ['学术会议', '数字艺术', '国际交流'],
      isGold: false,
      isFeatured: false,
      rating: 4.4,
      applicants: 234
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('deadline')

  const getTypeLabel = (type: string) => {
    const labels = {
      'EXHIBITION': '艺术展览',
      'RESIDENCY': '驻地项目',
      'COMPETITION': '比赛征集',
      'GRANT': '资助项目',
      'CONFERENCE': '学术会议'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'EXHIBITION': 'bg-blue-100 text-blue-800',
      'RESIDENCY': 'bg-green-100 text-green-800',
      'COMPETITION': 'bg-orange-100 text-orange-800',
      'GRANT': 'bg-purple-100 text-purple-800',
      'CONFERENCE': 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return '已截止'
    if (diffDays === 0) return '今天截止'
    if (diffDays === 1) return '明天截止'
    if (diffDays <= 7) return `${diffDays}天后截止`
    
    return date.toLocaleDateString('zh-CN', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'all' || submission.type === selectedType
    const matchesCountry = selectedCountry === 'all' || submission.country === selectedCountry
    
    return matchesSearch && matchesType && matchesCountry
  })

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
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">投稿信息展示</h1>
                  <p className="text-sm text-gray-600">发现适合您的艺术机会</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                <Heart className="w-4 h-4 mr-2" />
                收藏夹
              </Button>
              <Button variant="outline" className="rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Categories */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2 cursor-pointer hover:shadow-lg transition-all duration-200">
              <Award className="w-5 h-5" />
              <span>金牌推荐</span>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2 cursor-pointer hover:shadow-lg transition-all duration-200">
              <Star className="w-5 h-5" />
              <span>热门推荐</span>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2 cursor-pointer hover:shadow-lg transition-all duration-200">
              <Clock className="w-5 h-5" />
              <span>即将截止</span>
            </div>
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2 cursor-pointer hover:shadow-lg transition-all duration-200">
              <Globe className="w-5 h-5" />
              <span>国际机会</span>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2 cursor-pointer hover:shadow-lg transition-all duration-200">
              <DollarSign className="w-5 h-5" />
              <span>免费申请</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl border-2 border-black p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">筛选条件</h3>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索标题、机构或标签..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                >
                  <option value="all">所有类型</option>
                  <option value="EXHIBITION">艺术展览</option>
                  <option value="RESIDENCY">驻地项目</option>
                  <option value="COMPETITION">比赛征集</option>
                  <option value="GRANT">资助项目</option>
                  <option value="CONFERENCE">学术会议</option>
                </select>
              </div>

              {/* Country Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">国家/地区</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                >
                  <option value="all">所有国家</option>
                  <option value="中国">中国</option>
                  <option value="美国">美国</option>
                  <option value="英国">英国</option>
                  <option value="法国">法国</option>
                  <option value="德国">德国</option>
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                >
                  <option value="deadline">截止日期</option>
                  <option value="rating">评分最高</option>
                  <option value="popular">最受欢迎</option>
                  <option value="newest">最新发布</option>
                  <option value="fee_low">费用最低</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">快速筛选</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-600">免费申请</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-600">有奖金</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-600">国际认可</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded mr-2" />
                    <span className="text-sm text-gray-600">新手友好</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold text-gray-900">
                  找到 {filteredSubmissions.length} 个机会
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    更多筛选
                  </Button>
                </div>
              </div>
            </div>

            {/* Submissions Grid */}
            <div className="space-y-6">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="bg-white rounded-3xl border-2 border-black p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex gap-6">
                    {/* Logo/Image */}
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <div className="text-white text-2xl font-bold">
                        {submission.title.charAt(0)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer">
                              {submission.title}
                            </h3>
                            {submission.isGold && (
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                                GOLD
                              </div>
                            )}
                            {submission.isFeatured && (
                              <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                                推荐
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 mb-2">{submission.organizer}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{submission.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{submission.yearsRunning} 年</span>
                            </div>
                            {submission.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span>{submission.rating}</span>
                              </div>
                            )}
                            {submission.applicants && (
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{submission.applicants} 申请者</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Type and Tags */}
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(submission.type)}`}>
                          {getTypeLabel(submission.type)}
                        </span>
                        {submission.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {submission.description}
                      </p>

                      {/* Bottom Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-1 text-red-600 font-medium">
                            <Clock className="w-4 h-4" />
                            <span>{formatDeadline(submission.deadline)}</span>
                          </div>
                          {submission.fee !== undefined && (
                            <div className="flex items-center space-x-1 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>{submission.fee === 0 ? '免费' : `¥${submission.fee}`}</span>
                            </div>
                          )}
                          {submission.prize && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <Award className="w-4 h-4" />
                              <span>{submission.prize}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            className="rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            查看详情
                          </Button>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 transition-all duration-200 hover:shadow-lg">
                            立即申请
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center mt-12 space-x-2">
              <Button variant="outline" className="rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                上一页
              </Button>
              <Button className="bg-blue-600 text-white rounded-xl px-4">1</Button>
              <Button variant="outline" className="rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">2</Button>
              <Button variant="outline" className="rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">3</Button>
              <Button variant="outline" className="rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                下一页
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
