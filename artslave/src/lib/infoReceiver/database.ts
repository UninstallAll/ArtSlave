// InfoReceiver 数据库操作

import { PrismaClient } from '@prisma/client'
import {
  RawMessage,
  BaseResource,
  ParseTask,
  ParseRule,
  QualityCheck,
  MessageSource,
  MessageStatus,
  ResourceStatus,
  SubmissionType,
  InfoReceiverStats
} from './types'
import crypto from 'crypto'

const prisma = new PrismaClient()

export class InfoReceiverDatabase {
  // 原始消息操作
  async createRawMessage(data: Omit<RawMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<RawMessage> {
    return await prisma.rawMessage.create({
      data: {
        source: data.source,
        content: data.content,
        links: data.links,
        images: data.images,
        attachments: data.attachments,
        metadata: data.metadata,
        status: data.status,
        processed: data.processed,
        resourceId: data.resourceId,
        errorMessage: data.errorMessage,
        retryCount: data.retryCount,
        priority: data.priority,
        scheduledAt: data.scheduledAt,
        processedAt: data.processedAt
      }
    }) as RawMessage
  }

  async getRawMessage(id: string): Promise<RawMessage | null> {
    return await prisma.rawMessage.findUnique({
      where: { id }
    }) as RawMessage | null
  }

  async updateRawMessage(id: string, data: Partial<RawMessage>): Promise<RawMessage> {
    return await prisma.rawMessage.update({
      where: { id },
      data
    }) as RawMessage
  }

  async getRawMessagesByStatus(status: MessageStatus, limit = 50): Promise<RawMessage[]> {
    return await prisma.rawMessage.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: limit
    }) as RawMessage[]
  }

  // 基础资源操作
  async createBaseResource(data: Omit<BaseResource, 'id' | 'createdAt' | 'updatedAt'>): Promise<BaseResource> {
    return await prisma.baseResource.create({
      data
    }) as BaseResource
  }

  async getBaseResource(id: string): Promise<BaseResource | null> {
    return await prisma.baseResource.findUnique({
      where: { id }
    }) as BaseResource | null
  }

  async findResourceByHash(contentHash: string): Promise<BaseResource | null> {
    return await prisma.baseResource.findUnique({
      where: { contentHash }
    }) as BaseResource | null
  }

  async findResourceByUrl(url: string): Promise<BaseResource | null> {
    return await prisma.baseResource.findFirst({
      where: { originalUrl: url }
    }) as BaseResource | null
  }

  async getResourcesByCategory(category: SubmissionType, limit = 50): Promise<BaseResource[]> {
    return await prisma.baseResource.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      take: limit
    }) as BaseResource[]
  }

  async updateBaseResource(id: string, data: Partial<BaseResource>): Promise<BaseResource> {
    return await prisma.baseResource.update({
      where: { id },
      data
    }) as BaseResource
  }

  async updateResourceStatus(resourceId: string, status: string): Promise<BaseResource | null> {
    try {
      return await prisma.baseResource.update({
        where: { id: resourceId },
        data: { status: status as ResourceStatus }
      }) as BaseResource
    } catch (error) {
      console.error('Failed to update resource status:', error)
      return null
    }
  }

  async getResourcesByStatus(status: ResourceStatus, limit = 50): Promise<BaseResource[]> {
    return await prisma.baseResource.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: limit
    }) as BaseResource[]
  }

  async getResources(status?: string, category?: string, limit = 50): Promise<BaseResource[]> {
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category

    return await prisma.baseResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    }) as BaseResource[]
  }

  async searchResources(query: string, category?: SubmissionType): Promise<BaseResource[]> {
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { organizer: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = category
    }

    return await prisma.baseResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    }) as BaseResource[]
  }

  // 解析任务操作
  async createParseTask(data: Omit<ParseTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ParseTask> {
    return await prisma.parseTask.create({
      data: {
        messageId: data.messageId,
        taskType: data.taskType,
        priority: data.priority,
        attempts: data.attempts,
        maxAttempts: data.maxAttempts,
        status: data.status,
        scheduledAt: data.scheduledAt,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        errorMessage: data.errorMessage,
        errorCode: data.errorCode,
        result: data.result,
        metadata: data.metadata
      }
    }) as ParseTask
  }

  async getNextParseTask(): Promise<ParseTask | null> {
    return await prisma.parseTask.findFirst({
      where: {
        status: MessageStatus.PENDING,
        attempts: { lt: prisma.parseTask.fields.maxAttempts }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' }
      ]
    }) as ParseTask | null
  }

  async updateParseTask(id: string, data: Partial<ParseTask>): Promise<ParseTask> {
    return await prisma.parseTask.update({
      where: { id },
      data
    }) as ParseTask
  }

  // 解析规则操作
  async getParseRules(category?: SubmissionType): Promise<ParseRule[]> {
    const where: any = { isActive: true }
    if (category) {
      where.category = category
    }

    return await prisma.parseRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    }) as ParseRule[]
  }

  async createParseRule(data: Omit<ParseRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ParseRule> {
    return await prisma.parseRule.create({
      data
    }) as ParseRule
  }

  // 质量检查操作
  async createQualityCheck(data: Omit<QualityCheck, 'id' | 'createdAt'>): Promise<QualityCheck> {
    return await prisma.qualityCheck.create({
      data
    }) as QualityCheck
  }

  async getQualityChecks(resourceId: string): Promise<QualityCheck[]> {
    return await prisma.qualityCheck.findMany({
      where: { resourceId },
      orderBy: { createdAt: 'desc' }
    }) as QualityCheck[]
  }

  // 统计信息
  async createNotificationLog(data: {
    type: string
    recipient: string
    subject: string
    content: string
    status?: string
    metadata?: any
  }): Promise<any> {
    // 暂时返回空对象，后续可以实现实际的通知日志功能
    return {}
  }

  async getStats(): Promise<InfoReceiverStats> {
    const [
      totalMessages,
      pendingMessages,
      processingMessages,
      completedMessages,
      failedMessages,
      manualReviewMessages,
      totalResources,
      verifiedResources,
      duplicateResources,
      avgConfidence
    ] = await Promise.all([
      prisma.rawMessage.count(),
      prisma.rawMessage.count({ where: { status: MessageStatus.PENDING } }),
      prisma.rawMessage.count({ where: { status: MessageStatus.PROCESSING } }),
      prisma.rawMessage.count({ where: { status: MessageStatus.COMPLETED } }),
      prisma.rawMessage.count({ where: { status: MessageStatus.FAILED } }),
      prisma.rawMessage.count({ where: { status: MessageStatus.MANUAL_REVIEW } }),
      prisma.baseResource.count(),
      prisma.baseResource.count({ where: { status: ResourceStatus.VERIFIED } }),
      prisma.baseResource.count({ where: { status: ResourceStatus.DUPLICATE } }),
      prisma.baseResource.aggregate({
        _avg: { confidence: true },
        where: { confidence: { not: null } }
      })
    ])

    const processingRate = totalMessages > 0 ? (completedMessages / totalMessages) * 100 : 0
    const successRate = completedMessages > 0 ? (verifiedResources / completedMessages) * 100 : 0

    return {
      totalMessages,
      pendingMessages,
      processingMessages,
      completedMessages,
      failedMessages,
      manualReviewMessages,
      totalResources,
      verifiedResources,
      duplicateResources,
      averageConfidence: avgConfidence._avg.confidence || 0,
      processingRate,
      successRate,
      averageProcessingTime: 0 // 暂时设为0，后续可以计算实际处理时间
    }
  }

  // 工具方法
  generateContentHash(content: string, title?: string, deadline?: string): string {
    const hashContent = `${title || ''}|${deadline || ''}|${content.substring(0, 500)}`
    return crypto.createHash('sha256').update(hashContent).digest('hex')
  }

  async cleanup(): Promise<void> {
    // 清理30天前的已完成消息
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await prisma.rawMessage.deleteMany({
      where: {
        status: MessageStatus.COMPLETED,
        createdAt: { lt: thirtyDaysAgo }
      }
    })

    // 清理失败的解析任务
    await prisma.parseTask.deleteMany({
      where: {
        status: MessageStatus.FAILED,
        createdAt: { lt: thirtyDaysAgo }
      }
    })
  }
}

export const infoReceiverDb = new InfoReceiverDatabase()
