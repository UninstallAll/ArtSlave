'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/contexts/ThemeContext'
import { MessageSource } from '@/lib/infoReceiver/types'
import { 
  Send, 
  Link, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Plus,
  X
} from 'lucide-react'

interface SubmitFormProps {
  onSubmitSuccess?: (messageId: string) => void
}

export default function SubmitForm({ onSubmitSuccess }: SubmitFormProps) {
  const { getThemeClasses } = useTheme()
  const themeClasses = getThemeClasses()
  
  const [formData, setFormData] = useState({
    source: MessageSource.WEB,
    content: '',
    links: [''],
    metadata: {
      title: '',
      description: ''
    }
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
    messageId?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.content.trim()) {
      setSubmitResult({
        success: false,
        message: '请输入内容'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/info-receiver/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: formData.source,
          content: formData.content,
          links: formData.links.filter(link => link.trim()),
          metadata: formData.metadata
        })
      })

      const result = await response.json()

      if (result.success) {
        setSubmitResult({
          success: true,
          message: result.message,
          messageId: result.messageId
        })
        
        // 重置表单
        setFormData({
          source: MessageSource.WEB,
          content: '',
          links: [''],
          metadata: {
            title: '',
            description: ''
          }
        })

        onSubmitSuccess?.(result.messageId)
      } else {
        setSubmitResult({
          success: false,
          message: result.error || '提交失败'
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: '网络错误，请重试'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLinkField = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, '']
    }))
  }

  const removeLinkField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }))
  }

  const updateLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link)
    }))
  }

  return (
    <Card className={`${themeClasses.cardBackground} border-2 ${themeClasses.border}`}>
      <CardHeader>
        <CardTitle className={`${themeClasses.textPrimary} flex items-center gap-2`}>
          <Send className="w-5 h-5" />
          提交信息
        </CardTitle>
        <CardDescription className={themeClasses.textSecondary}>
          提交投稿信息、链接或文本内容，系统将自动解析并分类
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 来源选择 */}
          <div className="space-y-2">
            <Label className={themeClasses.textPrimary}>信息来源</Label>
            <select
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as MessageSource }))}
              className={`${themeClasses.cardBackground} border-2 ${themeClasses.border} w-full p-2 rounded-md`}
            >
              <option value="">选择信息来源</option>
              <option value={MessageSource.WEB}>网页表单</option>
              <option value={MessageSource.EMAIL}>邮件转发</option>
              <option value={MessageSource.WECHAT}>微信分享</option>
              <option value={MessageSource.SOCIAL}>社交媒体</option>
            </select>
          </div>

          {/* 标题 */}
          <div className="space-y-2">
            <Label className={themeClasses.textPrimary}>标题 (可选)</Label>
            <Input
              placeholder="为这条信息添加一个标题..."
              value={formData.metadata.title}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, title: e.target.value }
              }))}
              className={`${themeClasses.cardBackground} border-2 ${themeClasses.border}`}
            />
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label className={themeClasses.textPrimary}>
              内容 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="请粘贴投稿信息、邮件内容或相关文本..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className={`${themeClasses.cardBackground} border-2 ${themeClasses.border} min-h-[200px]`}
              required
            />
            <div className={`text-sm ${themeClasses.textSecondary} flex justify-between`}>
              <span>支持中英文，最少10个字符</span>
              <span>{formData.content.length}/50000</span>
            </div>
          </div>

          {/* 链接 */}
          <div className="space-y-2">
            <Label className={`${themeClasses.textPrimary} flex items-center gap-2`}>
              <Link className="w-4 h-4" />
              相关链接 (可选)
            </Label>
            {formData.links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://example.com/call-for-submissions"
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  className={`${themeClasses.cardBackground} border-2 ${themeClasses.border} flex-1`}
                />
                {formData.links.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeLinkField(index)}
                    className={`border-2 ${themeClasses.border}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addLinkField}
              className={`border-2 ${themeClasses.border} ${themeClasses.buttonHover}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加链接
            </Button>
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label className={themeClasses.textPrimary}>备注 (可选)</Label>
            <Textarea
              placeholder="添加一些备注信息..."
              value={formData.metadata.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                metadata: { ...prev.metadata, description: e.target.value }
              }))}
              className={`${themeClasses.cardBackground} border-2 ${themeClasses.border} h-20`}
            />
          </div>

          {/* 提交结果 */}
          {submitResult && (
            <div className={`p-4 rounded-lg border-2 ${
              submitResult.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {submitResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={submitResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                  {submitResult.message}
                </span>
              </div>
              {submitResult.messageId && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    消息ID: {submitResult.messageId}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.content.trim()}
            className={`w-full ${themeClasses.button} rounded-2xl py-3`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                提交信息
              </>
            )}
          </Button>
        </form>

        {/* 使用提示 */}
        <div className={`mt-6 p-4 rounded-lg ${themeClasses.cardBackground} border-2 ${themeClasses.border}`}>
          <h4 className={`${themeClasses.textPrimary} font-medium mb-2 flex items-center gap-2`}>
            <FileText className="w-4 h-4" />
            使用提示
          </h4>
          <ul className={`${themeClasses.textSecondary} text-sm space-y-1`}>
            <li>• 支持粘贴邮件内容、网页文本、社交媒体分享等</li>
            <li>• 系统会自动识别投稿信息并分类（展览、驻地、比赛等）</li>
            <li>• 提供相关链接可以提高解析准确度</li>
            <li>• 处理完成后会在数据管理页面显示结果</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
