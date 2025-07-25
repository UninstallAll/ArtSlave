// InfoReceiver 消息提交 API

import { NextRequest, NextResponse } from 'next/server'
import { createInfoReceiverService } from '@/lib/infoReceiver/infoReceiverService'
import { MessageSource, SubmitMessageRequest } from '@/lib/infoReceiver/types'

// 创建服务实例
const infoReceiverService = createInfoReceiverService({
  llm: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL,
    maxTokens: 2000,
    temperature: 0.1,
    timeout: 30000,
    fallbackModels: ['gpt-3.5-turbo']
  },
  crawler: {
    timeout: 15000,
    maxRetries: 3,
    delay: 1000,
    userAgent: 'ArtSlave InfoReceiver Bot 1.0',
    enableJavaScript: false
  },
  deduplication: {
    threshold: 0.8,
    enableSimilarityCheck: true,
    hashAlgorithm: 'sha256'
  },
  processing: {
    batchSize: 10,
    maxConcurrency: 3,
    confidenceThreshold: 0.6,
    manualReviewThreshold: 0.4,
    enableRuleEngine: true,
    enableGeocoding: false,
    enableOCR: false
  },
  queue: {
    maxRetries: 3,
    retryDelay: 5000,
    priorityLevels: 5
  },
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60000,
    enableNotifications: false,
    alertThresholds: {
      errorRate: 0.1,
      queueLength: 100,
      processingLatency: 30000,
      diskUsage: 0.8,
      memoryUsage: 0.8
    }
  },
  storage: {
    provider: 'prisma',
    enableBackup: false,
    backupInterval: 86400000
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证请求数据
    const validation = validateSubmitRequest(body)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }

    const submitRequest: SubmitMessageRequest = {
      source: body.source || MessageSource.WEB,
      content: body.content,
      links: body.links || [],
      images: body.images || [],
      attachments: body.attachments || [],
      metadata: {
        ...body.metadata,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        timestamp: new Date()
      }
    }

    // 提交消息
    const result = await infoReceiverService.submitMessage(submitRequest)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Submit message API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// 验证提交请求
function validateSubmitRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: '请求体不能为空' }
  }

  if (!body.content || typeof body.content !== 'string') {
    return { valid: false, error: '内容不能为空' }
  }

  if (body.content.length < 10) {
    return { valid: false, error: '内容长度至少需要10个字符' }
  }

  if (body.content.length > 50000) {
    return { valid: false, error: '内容长度不能超过50000个字符' }
  }

  if (body.source && !Object.values(MessageSource).includes(body.source)) {
    return { valid: false, error: '无效的消息来源' }
  }

  if (body.links && !Array.isArray(body.links)) {
    return { valid: false, error: '链接必须是数组格式' }
  }

  if (body.images && !Array.isArray(body.images)) {
    return { valid: false, error: '图片必须是数组格式' }
  }

  if (body.attachments && !Array.isArray(body.attachments)) {
    return { valid: false, error: '附件必须是数组格式' }
  }

  // 验证链接格式
  if (body.links) {
    for (const link of body.links) {
      if (typeof link !== 'string' || !isValidUrl(link)) {
        return { valid: false, error: `无效的链接格式: ${link}` }
      }
    }
  }

  return { valid: true }
}

// 验证URL格式
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

// GET 方法：获取提交表单页面信息
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedSources: Object.values(MessageSource),
      maxContentLength: 50000,
      supportedFileTypes: ['txt', 'pdf', 'doc', 'docx'],
      examples: [
        {
          title: '邮件内容提交',
          source: MessageSource.EMAIL,
          content: '转发的投稿信息邮件内容...',
          links: ['https://example.com/call-for-submissions']
        },
        {
          title: '网页链接提交',
          source: MessageSource.WEB,
          content: '发现了一个有趣的艺术展览征集',
          links: ['https://gallery.com/open-call']
        },
        {
          title: '社交媒体分享',
          source: MessageSource.SOCIAL,
          content: '小红书上看到的驻地项目信息',
          links: ['https://xiaohongshu.com/discovery/item/123456']
        }
      ]
    }
  })
}
