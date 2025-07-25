// InfoReceiver 资源管理 API

import { NextRequest, NextResponse } from 'next/server'
import { createInfoReceiverService } from '@/lib/infoReceiver/infoReceiverService'
import { ResourceStatus, SubmissionType, MessageStatus } from '@/lib/infoReceiver/types'

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

// GET: 获取资源列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const status = searchParams.get('status') as ResourceStatus
    const category = searchParams.get('category') as SubmissionType
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '50')

    switch (action) {
      case 'search':
        if (query) {
          const results = await infoReceiverService.searchResources(query, category)
          return NextResponse.json({
            success: true,
            data: results,
            count: results.length
          })
        }
        break

      case 'stats':
        const stats = await infoReceiverService.getStats()
        return NextResponse.json({
          success: true,
          data: stats
        })

      default:
        // 获取资源列表
        const resources = await infoReceiverService.getResources(status, category, limit)
        return NextResponse.json({
          success: true,
          data: resources,
          count: resources.length
        })
    }

    return NextResponse.json({
      success: false,
      error: '无效的请求参数'
    }, { status: 400 })

  } catch (error) {
    console.error('Get resources API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// PUT: 更新资源状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { resourceId, status, action } = body

    if (!resourceId) {
      return NextResponse.json({
        success: false,
        error: '资源ID不能为空'
      }, { status: 400 })
    }

    switch (action) {
      case 'updateStatus':
        if (!status || !Object.values(ResourceStatus).includes(status)) {
          return NextResponse.json({
            success: false,
            error: '无效的状态值'
          }, { status: 400 })
        }

        const updatedResource = await infoReceiverService.updateResourceStatus(resourceId, status)
        
        if (!updatedResource) {
          return NextResponse.json({
            success: false,
            error: '资源不存在或更新失败'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: updatedResource,
          message: '资源状态更新成功'
        })

      default:
        return NextResponse.json({
          success: false,
          error: '无效的操作类型'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Update resource API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}

// POST: 批量操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, resourceIds, status } = body

    if (!action) {
      return NextResponse.json({
        success: false,
        error: '操作类型不能为空'
      }, { status: 400 })
    }

    switch (action) {
      case 'batchUpdateStatus':
        if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
          return NextResponse.json({
            success: false,
            error: '资源ID列表不能为空'
          }, { status: 400 })
        }

        if (!status || !Object.values(ResourceStatus).includes(status)) {
          return NextResponse.json({
            success: false,
            error: '无效的状态值'
          }, { status: 400 })
        }

        const updateResults = await Promise.allSettled(
          resourceIds.map((id: string) => infoReceiverService.updateResourceStatus(id, status))
        )

        const successCount = updateResults.filter(result => 
          result.status === 'fulfilled' && result.value !== null
        ).length

        return NextResponse.json({
          success: true,
          data: {
            total: resourceIds.length,
            success: successCount,
            failed: resourceIds.length - successCount
          },
          message: `批量更新完成: ${successCount}/${resourceIds.length} 成功`
        })

      case 'processPending':
        // 处理待处理消息
        await infoReceiverService.processPendingMessages()
        
        return NextResponse.json({
          success: true,
          message: '开始处理待处理消息'
        })

      default:
        return NextResponse.json({
          success: false,
          error: '无效的操作类型'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Batch operation API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 })
  }
}
