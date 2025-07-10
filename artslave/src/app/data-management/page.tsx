'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Database, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import ThemeSelector from '@/components/ThemeSelector'
import SubmissionForm from '@/components/SubmissionForm'
import { getDatabaseAPI } from '@/lib/database'
import type { SubmissionData } from '@/lib/database'

export default function DataManagementPage() {
  const { getThemeClasses } = useTheme()
  const themeClasses = getThemeClasses()
  const [submissions, setSubmissions] = useState<SubmissionData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubmission, setEditingSubmission] = useState<SubmissionData | null>(null)

  const db = getDatabaseAPI()

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const data = await db.getAllSubmissions()
      setSubmissions(data)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSubmissions()
      return
    }
    
    setLoading(true)
    try {
      const data = await db.searchSubmissions(searchQuery)
      setSubmissions(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = async () => {
    if (!selectedType) {
      loadSubmissions()
      return
    }
    
    setLoading(true)
    try {
      const data = await db.getSubmissionsByType(selectedType)
      setSubmissions(data)
    } catch (error) {
      console.error('Filter failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条投稿信息吗？')) return

    try {
      const success = await db.deleteSubmission(id)
      if (success) {
        setSubmissions(submissions.filter(s => s.id !== id))
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('删除失败')
    }
  }

  const handleSaveSubmission = (savedSubmission: SubmissionData) => {
    if (editingSubmission) {
      // Update existing submission
      setSubmissions(submissions.map(s =>
        s.id === savedSubmission.id ? savedSubmission : s
      ))
    } else {
      // Add new submission
      setSubmissions([savedSubmission, ...submissions])
    }
    setEditingSubmission(null)
    setShowAddForm(false)
  }

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'EXHIBITION': '艺术展览',
      'RESIDENCY': '驻地项目',
      'COMPETITION': '比赛征集',
      'GRANT': '资助项目',
      'CONFERENCE': '学术会议'
    }
    return typeMap[type] || type
  }

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'EXHIBITION': 'bg-blue-100 text-blue-800',
      'RESIDENCY': 'bg-green-100 text-green-800',
      'COMPETITION': 'bg-purple-100 text-purple-800',
      'GRANT': 'bg-orange-100 text-orange-800',
      'CONFERENCE': 'bg-gray-100 text-gray-800'
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Header */}
      <div className={`${themeClasses.cardBackground} border-b-2 ${themeClasses.border} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>数据库管理</h1>
                <p className={`text-sm ${themeClasses.textSecondary}`}>管理投稿信息数据</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeSelector />
              <Button 
                variant="outline" 
                className={`rounded-2xl border-2 ${themeClasses.border} ${themeClasses.buttonHover} transition-all duration-200`}
                onClick={() => window.location.href = '/'}
                title="返回主页"
              >
                返回主页
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className={`${themeClasses.cardBackground} rounded-3xl border-2 ${themeClasses.border} p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="搜索投稿信息..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${themeClasses.input} ${themeClasses.inputFocus} rounded-2xl`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  className={`${themeClasses.button} rounded-2xl px-4`}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full ${themeClasses.input} ${themeClasses.inputFocus} rounded-2xl px-3 py-2`}
              >
                <option value="">所有类型</option>
                <option value="EXHIBITION">艺术展览</option>
                <option value="RESIDENCY">驻地项目</option>
                <option value="COMPETITION">比赛征集</option>
                <option value="GRANT">资助项目</option>
                <option value="CONFERENCE">学术会议</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                onClick={handleFilter}
                className={`${themeClasses.button} rounded-2xl px-4`}
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                onClick={loadSubmissions}
                className={`${themeClasses.button} rounded-2xl px-4`}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowAddForm(true)}
              className={`${themeClasses.button} rounded-2xl`}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加投稿信息
            </Button>
            <Button
              variant="outline"
              className={`rounded-2xl border-2 ${themeClasses.border} ${themeClasses.buttonHover}`}
            >
              <Upload className="w-4 h-4 mr-2" />
              导入数据
            </Button>
            <Button
              variant="outline"
              className={`rounded-2xl border-2 ${themeClasses.border} ${themeClasses.buttonHover}`}
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className={`${themeClasses.cardBackground} rounded-3xl border-2 ${themeClasses.border} overflow-hidden`}>
          <div className="p-6">
            <h2 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>
              投稿信息列表 ({submissions.length} 条)
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className={themeClasses.textSecondary}>加载中...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className={themeClasses.textSecondary}>暂无数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${themeClasses.border}`}>
                      <th className={`text-left py-3 px-4 font-medium ${themeClasses.textPrimary}`}>标题</th>
                      <th className={`text-left py-3 px-4 font-medium ${themeClasses.textPrimary}`}>类型</th>
                      <th className={`text-left py-3 px-4 font-medium ${themeClasses.textPrimary}`}>主办方</th>
                      <th className={`text-left py-3 px-4 font-medium ${themeClasses.textPrimary}`}>地点</th>
                      <th className={`text-left py-3 px-4 font-medium ${themeClasses.textPrimary}`}>截止日期</th>
                      <th className={`text-left py-3 px-4 font-medium ${themeClasses.textPrimary}`}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className={`border-b ${themeClasses.border} hover:bg-gray-50`}>
                        <td className={`py-3 px-4 ${themeClasses.textPrimary}`}>
                          <div className="font-medium">{submission.title}</div>
                          {submission.isGold && (
                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                              金牌推荐
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getTypeColor(submission.type)}`}>
                            {getTypeLabel(submission.type)}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${themeClasses.textSecondary}`}>{submission.organizer}</td>
                        <td className={`py-3 px-4 ${themeClasses.textSecondary}`}>{submission.location}</td>
                        <td className={`py-3 px-4 ${themeClasses.textSecondary}`}>{submission.deadline}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => {/* View details */}}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => setEditingSubmission(submission)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(submission.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingSubmission) && (
        <SubmissionForm
          submission={editingSubmission}
          onClose={() => {
            setShowAddForm(false)
            setEditingSubmission(null)
          }}
          onSave={handleSaveSubmission}
        />
      )}
    </div>
  )
}
