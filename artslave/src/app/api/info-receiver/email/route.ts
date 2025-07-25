// InfoReceiver 邮箱接收 API

import { NextRequest, NextResponse } from 'next/server'
import { createInfoReceiverService } from '@/lib/infoReceiver/infoReceiverService'
import { MessageSource } from '@/lib/infoReceiver/types'

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

interface EmailWebhookPayload {
  from: string
  to: string
  subject: string
  text: string
  html?: string
  attachments?: Array<{
    filename: string
    contentType: string
    size: number
    url: string
  }>
  headers?: Record<string, string>
  timestamp: string
}

// POST 方法：接收邮件Webhook
export async function POST(request: NextRequest) {
  try {
    // 验证Webhook签名（如果配置了）
    const signature = request.headers.get('x-webhook-signature')
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET
    
    if (webhookSecret && signature) {
      // TODO: 验证签名
      // const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      // }
    }

    const body = await request.json() as EmailWebhookPayload

    // 验证必要字段
    if (!body.from || !body.subject || !body.text) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的邮件字段'
      }, { status: 400 })
    }

    // 检查是否是目标邮箱
    const targetEmails = (process.env.INTAKE_EMAILS || 'intake@artslave.com').split(',')
    const isTargetEmail = targetEmails.some(email => 
      body.to.toLowerCase().includes(email.toLowerCase())
    )

    if (!isTargetEmail) {
      return NextResponse.json({
        success: false,
        error: '邮件不是发送到指定的接收邮箱'
      }, { status: 400 })
    }

    // 提取链接
    const links = extractLinksFromEmail(body.text, body.html)

    // 处理附件
    const attachments = body.attachments?.map(att => att.url) || []

    // 构建提交请求
    const submitRequest = {
      source: MessageSource.EMAIL,
      content: `主题: ${body.subject}\n\n${body.text}`,
      links,
      attachments,
      metadata: {
        sender: body.from,
        subject: body.subject,
        timestamp: new Date(body.timestamp),
        emailHeaders: body.headers,
        hasHtml: !!body.html,
        attachmentCount: body.attachments?.length || 0
      }
    }

    // 提交到服务
    const result = await infoReceiverService.submitMessage(submitRequest)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: '邮件已接收并开始处理'
    })

  } catch (error) {
    console.error('Email webhook API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// GET 方法：获取邮箱配置信息
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      intakeEmails: (process.env.INTAKE_EMAILS || 'intake@artslave.com').split(','),
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/info-receiver/email`,
      supportedFormats: ['text/plain', 'text/html'],
      maxAttachmentSize: '10MB',
      instructions: [
        '将投稿信息邮件转发到指定的接收邮箱',
        '邮件主题和正文将被自动解析',
        '支持附件和内嵌链接',
        '处理结果将通过系统通知'
      ]
    }
  })
}

/**
 * 从邮件内容中提取链接
 */
function extractLinksFromEmail(text: string, html?: string): string[] {
  const links: Set<string> = new Set()

  // 从纯文本中提取链接
  const textUrlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
  const textMatches = text.match(textUrlRegex)
  if (textMatches) {
    textMatches.forEach(link => links.add(link))
  }

  // 从HTML中提取链接
  if (html) {
    const htmlUrlRegex = /href=["']([^"']+)["']/gi
    let match
    while ((match = htmlUrlRegex.exec(html)) !== null) {
      const url = match[1]
      if (url.startsWith('http')) {
        links.add(url)
      }
    }
  }

  return Array.from(links)
}

/**
 * 验证Webhook签名
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  // TODO: 实现签名验证逻辑
  // 通常使用HMAC-SHA256
  return true
}
