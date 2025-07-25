// InfoReceiver 微信接收 API

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

interface WeChatMessage {
  messageType: 'text' | 'link' | 'image' | 'miniprogram' | 'file'
  content: string
  sender: {
    name: string
    id: string
    avatar?: string
  }
  room?: {
    name: string
    id: string
  }
  timestamp: string
  links?: string[]
  images?: string[]
  files?: Array<{
    name: string
    url: string
    size: number
  }>
  miniprogram?: {
    title: string
    description: string
    url: string
    thumbUrl?: string
  }
}

// POST 方法：接收微信消息
export async function POST(request: NextRequest) {
  try {
    // 验证API密钥
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.WECHAT_API_KEY
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json({
        success: false,
        error: '无效的API密钥'
      }, { status: 401 })
    }

    const body = await request.json() as WeChatMessage

    // 验证必要字段
    if (!body.messageType || !body.content || !body.sender) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的消息字段'
      }, { status: 400 })
    }

    // 检查消息类型
    if (!['text', 'link', 'image', 'miniprogram', 'file'].includes(body.messageType)) {
      return NextResponse.json({
        success: false,
        error: '不支持的消息类型'
      }, { status: 400 })
    }

    // 过滤无关消息
    if (body.messageType === 'text' && !isRelevantMessage(body.content)) {
      return NextResponse.json({
        success: true,
        message: '消息已忽略（不相关）'
      })
    }

    // 构建内容
    let content = body.content
    
    // 处理小程序分享
    if (body.messageType === 'miniprogram' && body.miniprogram) {
      content = `小程序分享: ${body.miniprogram.title}\n描述: ${body.miniprogram.description}\n链接: ${body.miniprogram.url}`
    }

    // 添加发送者信息
    const senderInfo = body.room 
      ? `群聊: ${body.room.name} | 发送者: ${body.sender.name}`
      : `私聊发送者: ${body.sender.name}`
    
    content = `[微信消息]\n${senderInfo}\n\n${content}`

    // 收集链接
    const links: string[] = []
    if (body.links) links.push(...body.links)
    if (body.miniprogram?.url) links.push(body.miniprogram.url)

    // 收集图片
    const images = body.images || []

    // 收集附件
    const attachments = body.files?.map(file => file.url) || []

    // 构建提交请求
    const submitRequest = {
      source: MessageSource.WECHAT,
      content,
      links,
      images,
      attachments,
      metadata: {
        messageType: body.messageType,
        sender: body.sender,
        room: body.room,
        timestamp: new Date(body.timestamp),
        platform: 'wechat',
        hasImages: images.length > 0,
        hasFiles: attachments.length > 0,
        miniprogram: body.miniprogram
      }
    }

    // 提交到服务
    const result = await infoReceiverService.submitMessage(submitRequest)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: '微信消息已接收并开始处理',
      autoReply: generateAutoReply(body.messageType)
    })

  } catch (error) {
    console.error('WeChat webhook API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// GET 方法：获取微信配置信息
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/info-receiver/wechat`,
      supportedMessageTypes: ['text', 'link', 'image', 'miniprogram', 'file'],
      apiKeyRequired: !!process.env.WECHAT_API_KEY,
      autoReplyEnabled: true,
      instructions: [
        '配置WeChaty机器人监听指定群聊或私聊',
        '发送包含投稿信息的消息到机器人',
        '支持文本、链接、图片、小程序分享',
        '机器人会自动回复确认消息'
      ]
    }
  })
}

/**
 * 判断消息是否相关
 */
function isRelevantMessage(content: string): boolean {
  const keywords = [
    '投稿', '征集', '展览', '比赛', '驻地', '申请', '截止', 'deadline',
    '艺术', '创作', '作品', '画廊', '美术馆', '基金', '奖学金',
    'exhibition', 'residency', 'competition', 'grant', 'call for',
    'submission', 'application', 'gallery', 'museum', 'art'
  ]

  const lowerContent = content.toLowerCase()
  return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))
}

/**
 * 生成自动回复消息
 */
function generateAutoReply(messageType: string): string {
  const replies = {
    text: '✅ 已收到您的投稿信息，正在智能解析中...',
    link: '🔗 已收到链接分享，正在抓取和解析内容...',
    image: '📷 已收到图片，正在进行文字识别和解析...',
    miniprogram: '📱 已收到小程序分享，正在解析相关信息...',
    file: '📎 已收到文件，正在处理和解析内容...'
  }

  return replies[messageType as keyof typeof replies] || '✅ 消息已收到，正在处理中...'
}

/**
 * 验证微信消息签名
 */
function verifyWeChatSignature(body: string, signature: string, token: string): boolean {
  // TODO: 实现微信签名验证逻辑
  return true
}
