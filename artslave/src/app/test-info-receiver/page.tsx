'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/contexts/ThemeContext'
import { MessageSource } from '@/lib/infoReceiver/types'
import { 
  Play, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  FileText,
  Activity
} from 'lucide-react'

export default function TestInfoReceiverPage() {
  // 强制使用黑暗模式样式
  const darkThemeClasses = {
    background: 'bg-gray-900',
    cardBackground: 'bg-gray-800',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonHover: 'hover:bg-gray-700',
    input: 'bg-gray-700 text-white placeholder-gray-400',
    inputFocus: 'focus:ring-blue-500 focus:border-blue-500'
  }
  
  const [testContent, setTestContent] = useState('')
  const [testSource, setTestSource] = useState<MessageSource>(MessageSource.WEB)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [functionalTestResult, setFunctionalTestResult] = useState<any>(null)
  const [performanceTestResult, setPerformanceTestResult] = useState<any>(null)

  const handleQuickTest = async () => {
    if (!testContent.trim()) {
      alert('请输入测试内容')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/info-receiver/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: testSource,
          content: testContent,
          links: [],
          metadata: {
            testMode: true
          }
        })
      })

      const result = await response.json()
      setTestResult(result)

    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '测试失败'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleFunctionalTest = async () => {
    setTesting(true)
    setFunctionalTestResult(null)

    try {
      const response = await fetch('/api/info-receiver/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'functional'
        })
      })

      const result = await response.json()
      setFunctionalTestResult(result)

    } catch (error) {
      setFunctionalTestResult({
        success: false,
        error: error instanceof Error ? error.message : '功能测试失败'
      })
    } finally {
      setTesting(false)
    }
  }

  const handlePerformanceTest = async () => {
    setTesting(true)
    setPerformanceTestResult(null)

    try {
      const response = await fetch('/api/info-receiver/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType: 'performance',
          options: {
            concurrency: 3,
            messageCount: 10
          }
        })
      })

      const result = await response.json()
      setPerformanceTestResult(result)

    } catch (error) {
      setPerformanceTestResult({
        success: false,
        error: error instanceof Error ? error.message : '性能测试失败'
      })
    } finally {
      setTesting(false)
    }
  }

  const sampleTexts = [
    {
      name: '艺术展览',
      content: `【征集通知】2024年国际当代艺术展

主办方：北京当代艺术馆
展览时间：2024年8月15日-10月15日
申请截止：2024年6月30日
地点：北京市朝阳区798艺术区

征集要求：
- 当代艺术作品
- 作品尺寸不超过2x2米
- 提交作品图片和艺术家简历

联系方式：curator@bjcam.org
官网：https://www.bjcam.org/exhibition2024`
    },
    {
      name: '驻地项目',
      content: `Artist Residency Program 2024

Location: Banff Centre for Arts and Creativity, Canada
Duration: 3 months (September - November 2024)
Application Deadline: March 15, 2024

We provide:
- Studio space
- Accommodation
- Monthly stipend of $2000 CAD

Requirements:
- Portfolio of recent work
- Project proposal
- Two references

Apply at: https://banffcentre.ca/residency
Contact: residency@banffcentre.ca`
    },
    {
      name: '比赛征集',
      content: `🎨 第五届青年艺术家大赛开始征集！

奖金：一等奖10万元，二等奖5万元，三等奖2万元
主题：未来城市
截止时间：2024年7月20日
参赛要求：35岁以下艺术家

作品形式：绘画、雕塑、装置、影像均可
提交方式：线上提交 + 邮寄原作

详情查看：www.youngartist.com
咨询电话：010-12345678`
    }
  ]

  return (
    <div className={`min-h-screen ${darkThemeClasses.background} p-6`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className={`text-3xl font-bold ${darkThemeClasses.textPrimary} mb-2`}>
            信息接收器测试
          </h1>
          <p className={`${darkThemeClasses.textSecondary}`}>
            测试信息接收器的解析能力和系统性能
          </p>
        </div>

        {/* 快速测试 */}
        <Card className={`${darkThemeClasses.cardBackground} border-2 ${darkThemeClasses.border}`}>
          <CardHeader>
            <CardTitle className={`${darkThemeClasses.textPrimary} flex items-center`}>
              <TestTube className="w-5 h-5 mr-2" />
              快速测试
            </CardTitle>
            <CardDescription className={darkThemeClasses.textSecondary}>
              输入自定义内容测试解析效果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 示例文本 */}
            <div>
              <label className={`block text-sm font-medium ${darkThemeClasses.textPrimary} mb-2`}>
                示例文本
              </label>
              <div className="flex flex-wrap gap-2">
                {sampleTexts.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setTestContent(sample.content)}
                    className={`border-2 ${darkThemeClasses.border} ${darkThemeClasses.buttonHover} text-gray-300 hover:text-white`}
                  >
                    {sample.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 消息来源 */}
            <div>
              <label className={`block text-sm font-medium ${darkThemeClasses.textPrimary} mb-2`}>
                消息来源
              </label>
              <select
                value={testSource}
                onChange={(e) => setTestSource(e.target.value as MessageSource)}
                className={`${darkThemeClasses.input} border-2 ${darkThemeClasses.border} w-full p-2 rounded-md`}
              >
                <option value={MessageSource.WEB}>网页</option>
                <option value={MessageSource.EMAIL}>邮箱</option>
                <option value={MessageSource.WECHAT}>微信</option>
                <option value={MessageSource.SOCIAL}>社交媒体</option>
                <option value={MessageSource.API}>API</option>
              </select>
            </div>

            {/* 测试内容 */}
            <div>
              <label className={`block text-sm font-medium ${darkThemeClasses.textPrimary} mb-2`}>
                测试内容
              </label>
              <Textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="输入要测试的投稿信息内容..."
                className={`${darkThemeClasses.input} border-2 ${darkThemeClasses.border} min-h-32`}
              />
            </div>

            {/* 测试按钮 */}
            <Button
              onClick={handleQuickTest}
              disabled={testing || !testContent.trim()}
              className={darkThemeClasses.button}
            >
              <Play className="w-4 h-4 mr-2" />
              {testing ? '测试中...' : '开始测试'}
            </Button>

            {/* 测试结果 */}
            {testResult && (
              <div className={`p-4 rounded-lg border-2 ${darkThemeClasses.border} ${darkThemeClasses.cardBackground}`}>
                <div className="flex items-center mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mr-2" />
                  )}
                  <span className={`font-medium ${darkThemeClasses.textPrimary}`}>
                    {testResult.success ? '测试成功' : '测试失败'}
                  </span>
                </div>
                <pre className={`text-sm ${darkThemeClasses.textSecondary} whitespace-pre-wrap bg-gray-900 p-3 rounded border`}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 系统测试 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 功能测试 */}
          <Card className={`${darkThemeClasses.cardBackground} border-2 ${darkThemeClasses.border}`}>
            <CardHeader>
              <CardTitle className={`${darkThemeClasses.textPrimary} flex items-center`}>
                <FileText className="w-5 h-5 mr-2" />
                功能测试
              </CardTitle>
              <CardDescription className={darkThemeClasses.textSecondary}>
                运行预定义的测试用例验证解析准确性
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleFunctionalTest}
                disabled={testing}
                className={darkThemeClasses.button}
                size="sm"
              >
                <TestTube className="w-4 h-4 mr-2" />
                运行功能测试
              </Button>

              {functionalTestResult && (
                <div className={`p-3 rounded-lg border ${darkThemeClasses.border} bg-gray-900`}>
                  {functionalTestResult.success ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        <span className={`text-sm font-medium ${darkThemeClasses.textPrimary}`}>
                          功能测试完成
                        </span>
                      </div>
                      <div className={`text-sm ${darkThemeClasses.textSecondary} space-y-1`}>
                        <div>总计: {functionalTestResult.report.summary.total}</div>
                        <div>通过: {functionalTestResult.report.summary.passed}</div>
                        <div>失败: {functionalTestResult.report.summary.failed}</div>
                        <div>成功率: {(functionalTestResult.report.summary.successRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-400 mr-2" />
                      <span className={`text-sm ${darkThemeClasses.textPrimary}`}>
                        {functionalTestResult.error}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 性能测试 */}
          <Card className={`${darkThemeClasses.cardBackground} border-2 ${darkThemeClasses.border}`}>
            <CardHeader>
              <CardTitle className={`${darkThemeClasses.textPrimary} flex items-center`}>
                <Activity className="w-5 h-5 mr-2" />
                性能测试
              </CardTitle>
              <CardDescription className={darkThemeClasses.textSecondary}>
                测试系统处理能力和响应时间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handlePerformanceTest}
                disabled={testing}
                className={darkThemeClasses.button}
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                运行性能测试
              </Button>

              {performanceTestResult && (
                <div className={`p-3 rounded-lg border ${darkThemeClasses.border} bg-gray-900`}>
                  {performanceTestResult.success ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        <span className={`text-sm font-medium ${darkThemeClasses.textPrimary}`}>
                          性能测试完成
                        </span>
                      </div>
                      <div className={`text-sm ${darkThemeClasses.textSecondary} space-y-1`}>
                        <div>平均响应: {performanceTestResult.result.avgResponseTime.toFixed(1)}ms</div>
                        <div>最大响应: {performanceTestResult.result.maxResponseTime}ms</div>
                        <div>成功率: {(performanceTestResult.result.successRate * 100).toFixed(1)}%</div>
                        <div>吞吐量: {performanceTestResult.result.throughput.toFixed(2)} 消息/秒</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-400 mr-2" />
                      <span className={`text-sm ${darkThemeClasses.textPrimary}`}>
                        {performanceTestResult.error}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 返回按钮 */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/data-management'}
            className={`border-2 ${darkThemeClasses.border} ${darkThemeClasses.buttonHover} text-gray-300 hover:text-white`}
          >
            返回数据管理
          </Button>
        </div>
      </div>
    </div>
  )
}
