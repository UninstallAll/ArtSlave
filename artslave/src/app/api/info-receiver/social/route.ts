// InfoReceiver 社交媒体接收 API

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
    enableJavaScript: true // 社交媒体通常需要JS
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
    enableOCR: true // 社交媒体图片可能包含文字
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

interface SocialMediaPost {
  platform: 'xiaohongshu' | 'weibo' | 'instagram' | 'facebook' | 'twitter' | 'linkedin'
  postId: string
  url: string
  content: string
  author: {
    name: string
    id: string
    avatar?: string
    verified?: boolean
  }
  images?: string[]
  videos?: string[]
  hashtags?: string[]
  mentions?: string[]
  timestamp: string
  engagement?: {
    likes: number
    comments: number
    shares: number
  }
}

// POST 方法：接收社交媒体分享
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SocialMediaPost

    // 验证必要字段
    if (!body.platform || !body.url || !body.content) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的社交媒体字段'
      }, { status: 400 })
    }

    // 验证平台
    const supportedPlatforms = ['xiaohongshu', 'weibo', 'instagram', 'facebook', 'twitter', 'linkedin']
    if (!supportedPlatforms.includes(body.platform)) {
      return NextResponse.json({
        success: false,
        error: '不支持的社交媒体平台'
      }, { status: 400 })
    }

    // 验证URL格式
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json({
        success: false,
        error: '无效的URL格式'
      }, { status: 400 })
    }

    // 过滤无关内容
    if (!isRelevantSocialContent(body.content, body.hashtags)) {
      return NextResponse.json({
        success: true,
        message: '内容已忽略（不相关）'
      })
    }

    // 构建内容
    let content = `[${getPlatformName(body.platform)}分享]\n`
    content += `作者: ${body.author.name}${body.author.verified ? ' ✓' : ''}\n`
    content += `链接: ${body.url}\n\n`
    content += body.content

    // 添加标签
    if (body.hashtags && body.hashtags.length > 0) {
      content += `\n\n标签: ${body.hashtags.map(tag => `#${tag}`).join(' ')}`
    }

    // 添加提及
    if (body.mentions && body.mentions.length > 0) {
      content += `\n提及: ${body.mentions.map(mention => `@${mention}`).join(' ')}`
    }

    // 构建提交请求
    const submitRequest = {
      source: MessageSource.SOCIAL,
      content,
      links: [body.url],
      images: body.images || [],
      metadata: {
        platform: body.platform,
        postId: body.postId,
        author: body.author,
        hashtags: body.hashtags,
        mentions: body.mentions,
        timestamp: new Date(body.timestamp),
        engagement: body.engagement,
        hasImages: (body.images?.length || 0) > 0,
        hasVideos: (body.videos?.length || 0) > 0
      }
    }

    // 提交到服务
    const result = await infoReceiverService.submitMessage(submitRequest)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: '社交媒体内容已接收并开始处理'
    })

  } catch (error) {
    console.error('Social media API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// GET 方法：获取社交媒体配置信息
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedPlatforms: [
        { id: 'xiaohongshu', name: '小红书', icon: '📱' },
        { id: 'weibo', name: '微博', icon: '🐦' },
        { id: 'instagram', name: 'Instagram', icon: '📷' },
        { id: 'facebook', name: 'Facebook', icon: '👥' },
        { id: 'twitter', name: 'Twitter', icon: '🐦' },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
      ],
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/info-receiver/social`,
      features: [
        '自动识别投稿相关内容',
        '支持图片和视频内容',
        '提取标签和提及信息',
        '记录互动数据'
      ],
      instructions: [
        '通过浏览器扩展或第三方工具分享内容',
        '确保分享的内容包含投稿信息',
        '系统会自动过滤无关内容',
        '支持批量处理多个分享'
      ]
    }
  })
}

/**
 * 判断社交媒体内容是否相关
 */
function isRelevantSocialContent(content: string, hashtags?: string[]): boolean {
  const contentKeywords = [
    '投稿', '征集', '展览', '比赛', '驻地', '申请', '截止',
    '艺术', '创作', '作品', '画廊', '美术馆', '基金', '奖学金',
    'exhibition', 'residency', 'competition', 'grant', 'call',
    'submission', 'application', 'gallery', 'museum', 'art'
  ]

  const hashtagKeywords = [
    '投稿', '征集', '展览', '比赛', '驻地', '艺术', '创作',
    'art', 'exhibition', 'competition', 'callforsubmissions',
    'artistresidency', 'artgrant', 'artcompetition'
  ]

  const lowerContent = content.toLowerCase()
  
  // 检查内容关键词
  const hasContentKeyword = contentKeywords.some(keyword => 
    lowerContent.includes(keyword.toLowerCase())
  )

  // 检查标签关键词
  const hasHashtagKeyword = hashtags ? hashtags.some(tag =>
    hashtagKeywords.some(keyword => 
      tag.toLowerCase().includes(keyword.toLowerCase())
    )
  ) : false

  return hasContentKeyword || hasHashtagKeyword
}

/**
 * 获取平台中文名称
 */
function getPlatformName(platform: string): string {
  const platformNames: Record<string, string> = {
    xiaohongshu: '小红书',
    weibo: '微博',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    linkedin: 'LinkedIn'
  }

  return platformNames[platform] || platform
}

/**
 * 提取社交媒体URL中的内容ID
 */
function extractContentId(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url)
    
    switch (platform) {
      case 'xiaohongshu':
        // 小红书链接格式: https://www.xiaohongshu.com/discovery/item/xxxxx
        const xhsMatch = urlObj.pathname.match(/\/item\/([a-zA-Z0-9]+)/)
        return xhsMatch ? xhsMatch[1] : null
        
      case 'weibo':
        // 微博链接格式: https://weibo.com/xxxxx/xxxxx
        const weiboMatch = urlObj.pathname.match(/\/\d+\/([a-zA-Z0-9]+)/)
        return weiboMatch ? weiboMatch[1] : null
        
      case 'instagram':
        // Instagram链接格式: https://www.instagram.com/p/xxxxx/
        const igMatch = urlObj.pathname.match(/\/p\/([a-zA-Z0-9_-]+)/)
        return igMatch ? igMatch[1] : null
        
      default:
        return null
    }
  } catch {
    return null
  }
}
