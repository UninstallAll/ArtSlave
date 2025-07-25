// InfoReceiver 核心服务

import { 
  RawMessage, 
  BaseResource, 
  ParseResult, 
  MessageSource, 
  MessageStatus, 
  ResourceStatus,
  SubmissionType,
  InfoReceiverStats,
  SubmitMessageRequest,
  SubmitMessageResponse,
  InfoReceiverConfig,
  ConfidenceLevel,
  DeduplicationResult,
  CrawlResult,
  QualityCheck
} from './types'
import { InfoReceiverDatabase } from './database'
import { LLMParser } from './llmParser'
import { ContentCrawler } from './contentCrawler'
import { DeduplicationService } from './deduplication'
import crypto from 'crypto'

/**
 * InfoReceiver 核心服务类
 * 负责统一处理多渠道信息接收、智能解析、去重和质量控制
 */
export class InfoReceiverService {
  private database!: InfoReceiverDatabase
  private llmParser!: LLMParser
  private contentCrawler!: ContentCrawler
  private deduplicationService!: DeduplicationService
  private config: InfoReceiverConfig
  private isProcessing = false
  private processingQueue: Map<string, Promise<void>> = new Map()

  constructor(config: InfoReceiverConfig) {
    this.config = config
    this.initializeServices()
  }

  private initializeServices() {
    this.database = new InfoReceiverDatabase()
    this.llmParser = new LLMParser(this.config.llm)
    this.contentCrawler = new ContentCrawler(this.config.crawler)
    this.deduplicationService = new DeduplicationService(this.config.deduplication)
  }

  /**
   * 提交消息到处理队列
   */
  async submitMessage(request: SubmitMessageRequest): Promise<SubmitMessageResponse> {
    try {
      // 验证输入
      this.validateSubmitRequest(request)

      // 创建原始消息记录
      const rawMessage = await this.database.createRawMessage({
        source: request.source,
        content: request.content,
        links: request.links || [],
        images: request.images || [],
        attachments: request.attachments || [],
        metadata: {
          ...request.metadata,
          timestamp: new Date(),
          userAgent: request.metadata?.userAgent,
          ip: request.metadata?.ip
        },
        status: MessageStatus.PENDING,
        processed: false,
        retryCount: 0,
        priority: this.calculatePriority(request)
      })

      // 异步处理消息
      this.processMessageAsync(rawMessage.id).catch(error => {
        console.error(`Failed to process message ${rawMessage.id}:`, error)
      })

      return {
        success: true,
        messageId: rawMessage.id,
        message: '消息已接收，正在处理中...'
      }
    } catch (error) {
      console.error('Submit message error:', error)
      throw new Error(`提交消息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 异步处理单个消息
   */
  private async processMessageAsync(messageId: string): Promise<void> {
    // 避免重复处理
    if (this.processingQueue.has(messageId)) {
      return this.processingQueue.get(messageId)!
    }

    const processingPromise = this.processMessage(messageId)
    this.processingQueue.set(messageId, processingPromise)

    try {
      await processingPromise
    } finally {
      this.processingQueue.delete(messageId)
    }
  }

  /**
   * 处理单个消息的核心逻辑
   */
  private async processMessage(messageId: string): Promise<void> {
    const startTime = Date.now()
    let message: RawMessage | null = null

    try {
      // 获取消息
      message = await this.database.getRawMessage(messageId)
      if (!message) {
        throw new Error(`Message ${messageId} not found`)
      }

      // 更新状态为处理中
      await this.database.updateRawMessage(messageId, {
        status: MessageStatus.PROCESSING,
        processedAt: new Date()
      })

      // 1. 预处理阶段
      const preprocessedContent = await this.preprocessContent(message)

      // 2. 内容爬取（如果有链接）
      const crawledContent = await this.crawlLinks(message.links)

      // 3. LLM 解析
      const parseResult = await this.parseContent(preprocessedContent, crawledContent)

      // 4. 去重检查
      const deduplicationResult = await this.checkDuplication(parseResult)

      if (deduplicationResult.isDuplicate) {
        await this.handleDuplicate(message, deduplicationResult)
        return
      }

      // 5. 创建资源记录
      const resource = await this.createResource(message, parseResult)

      // 6. 质量控制
      await this.performQualityChecks(resource)

      // 7. 更新消息状态
      await this.database.updateRawMessage(messageId, {
        status: MessageStatus.COMPLETED,
        resourceId: resource.id,
        processedAt: new Date()
      })

      console.log(`Successfully processed message ${messageId} in ${Date.now() - startTime}ms`)

    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error)
      
      if (message) {
        const newRetryCount = message.retryCount + 1
        const maxRetries = this.config.queue?.maxRetries || 3

        if (newRetryCount < maxRetries) {
          // 重试
          await this.database.updateRawMessage(messageId, {
            status: MessageStatus.PENDING,
            retryCount: newRetryCount,
            errorMessage: error instanceof Error ? error.message : '未知错误',
            scheduledAt: new Date(Date.now() + (this.config.queue?.retryDelay || 5000) * newRetryCount)
          })
        } else {
          // 超过重试次数，标记为失败
          await this.database.updateRawMessage(messageId, {
            status: MessageStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : '未知错误'
          })
        }
      }

      throw error
    }
  }

  /**
   * 验证提交请求
   */
  private validateSubmitRequest(request: SubmitMessageRequest): void {
    if (!request.content || request.content.trim().length < 10) {
      throw new Error('内容不能为空且至少需要10个字符')
    }

    if (request.content.length > 50000) {
      throw new Error('内容长度不能超过50000个字符')
    }

    if (!Object.values(MessageSource).includes(request.source)) {
      throw new Error('无效的消息来源')
    }
  }

  /**
   * 计算消息处理优先级
   */
  private calculatePriority(request: SubmitMessageRequest): number {
    let priority = 0

    // 根据来源设置优先级
    switch (request.source) {
      case MessageSource.EMAIL:
        priority = 10
        break
      case MessageSource.API:
        priority = 8
        break
      case MessageSource.WEB:
        priority = 5
        break
      case MessageSource.WECHAT:
      case MessageSource.SOCIAL:
        priority = 3
        break
      default:
        priority = 1
    }

    // 如果有截止日期相关关键词，提高优先级
    if (request.content.includes('截止') || request.content.includes('deadline') || request.content.includes('申请')) {
      priority += 5
    }

    return priority
  }

  /**
   * 预处理内容
   */
  private async preprocessContent(message: RawMessage): Promise<string> {
    let content = message.content

    // 清理和标准化文本
    content = content.trim()
    content = content.replace(/\s+/g, ' ') // 合并多个空格
    content = content.replace(/[\r\n]+/g, '\n') // 标准化换行符

    // 提取和处理图片中的文字（OCR）
    if (message.images.length > 0 && this.config.processing.enableOCR) {
      try {
        const ocrText = await this.extractTextFromImages(message.images)
        if (ocrText) {
          content += '\n\n[图片文字内容]\n' + ocrText
        }
      } catch (error) {
        console.warn('OCR processing failed:', error)
      }
    }

    return content
  }

  /**
   * 从图片中提取文字（OCR）
   */
  private async extractTextFromImages(imageUrls: string[]): Promise<string> {
    // TODO: 实现OCR功能
    // 可以使用 Tesseract.js 或其他OCR服务
    return ''
  }

  /**
   * 爬取链接内容
   */
  private async crawlLinks(links: string[]): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []

    for (const link of links) {
      try {
        const result = await this.contentCrawler.crawl(link)
        results.push(result)
      } catch (error) {
        console.warn(`Failed to crawl ${link}:`, error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : '爬取失败'
        })
      }
    }

    return results
  }

  /**
   * 解析内容
   */
  private async parseContent(content: string, crawledContent: CrawlResult[]): Promise<ParseResult> {
    // 合并所有内容
    let fullContent = content

    for (const crawled of crawledContent) {
      if (crawled.success && crawled.content) {
        fullContent += '\n\n[网页内容]\n' + crawled.content
      }
    }

    // 使用LLM解析
    const parseResult = await this.llmParser.parseContent(fullContent)

    // 如果LLM解析置信度低，尝试规则引擎
    if (parseResult.confidence < this.config.processing.confidenceThreshold && this.config.processing.enableRuleEngine) {
      const ruleResult = await this.parseWithRules(fullContent)
      if (ruleResult && ruleResult.confidence > parseResult.confidence) {
        return ruleResult
      }
    }

    return parseResult
  }

  /**
   * 使用规则引擎解析
   */
  private async parseWithRules(content: string): Promise<ParseResult | null> {
    // TODO: 实现规则引擎解析
    return null
  }

  /**
   * 检查重复
   */
  private async checkDuplication(parseResult: ParseResult): Promise<DeduplicationResult> {
    return await this.deduplicationService.checkDuplication(parseResult)
  }

  /**
   * 处理重复内容
   */
  private async handleDuplicate(message: RawMessage, deduplicationResult: DeduplicationResult): Promise<void> {
    await this.database.updateRawMessage(message.id, {
      status: MessageStatus.COMPLETED,
      errorMessage: `重复内容: ${deduplicationResult.reason}`
    })

    console.log(`Message ${message.id} marked as duplicate: ${deduplicationResult.reason}`)
  }

  /**
   * 创建资源记录
   */
  private async createResource(message: RawMessage, parseResult: ParseResult): Promise<BaseResource> {
    // 生成内容哈希
    const contentHash = this.generateContentHash(parseResult)

    // 地理编码
    let geocodingResult: any = null
    if (parseResult.location && this.config.processing.enableGeocoding) {
      try {
        geocodingResult = await this.geocodeLocation(parseResult.location)
      } catch (error) {
        console.warn('Geocoding failed:', error)
      }
    }

    const resource: Omit<BaseResource, 'id' | 'createdAt' | 'updatedAt'> = {
      title: parseResult.title || '未知标题',
      category: parseResult.category || SubmissionType.OTHER,
      deadline: parseResult.deadline ? new Date(parseResult.deadline) : undefined,
      eventDate: parseResult.eventDate ? new Date(parseResult.eventDate) : undefined,
      endDate: parseResult.endDate ? new Date(parseResult.endDate) : undefined,
      location: parseResult.location,
      city: geocodingResult?.city || parseResult.city,
      country: geocodingResult?.country || parseResult.country,
      latitude: geocodingResult?.latitude,
      longitude: geocodingResult?.longitude,
      organizer: parseResult.organizer,
      description: parseResult.description,
      requirements: parseResult.requirements,
      fee: parseResult.fee,
      prize: parseResult.prize,
      contact: parseResult.contact,
      email: parseResult.email,
      phone: parseResult.phone,
      website: parseResult.website,
      originalUrl: parseResult.originalUrl,
      tags: parseResult.tags || [],
      source: message.source,
      confidence: parseResult.confidence,
      confidenceLevel: this.getConfidenceLevel(parseResult.confidence),
      status: parseResult.confidence >= this.config.processing.confidenceThreshold
        ? ResourceStatus.VERIFIED
        : ResourceStatus.PENDING,
      language: parseResult.language || 'zh',
      contentHash,
      similarityHash: this.generateSimilarityHash(parseResult),
      version: 1
    }

    return await this.database.createBaseResource(resource)
  }

  /**
   * 生成内容哈希
   */
  private generateContentHash(parseResult: ParseResult): string {
    const content = [
      parseResult.title,
      parseResult.organizer,
      parseResult.deadline,
      parseResult.location
    ].filter(Boolean).join('|')

    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * 生成相似度哈希
   */
  private generateSimilarityHash(parseResult: ParseResult): string {
    // 简化版的相似度哈希，实际应该使用更复杂的算法
    const content = [
      parseResult.title?.toLowerCase(),
      parseResult.organizer?.toLowerCase()
    ].filter(Boolean).join(' ')

    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * 获取置信度等级
   */
  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.9) return ConfidenceLevel.VERY_HIGH
    if (confidence >= 0.7) return ConfidenceLevel.HIGH
    if (confidence >= 0.5) return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW
  }

  /**
   * 地理编码
   */
  private async geocodeLocation(location: string): Promise<any> {
    // TODO: 实现地理编码功能
    // 可以使用高德地图API或其他地理编码服务
    return {
      confidence: 0
    }
  }

  /**
   * 执行质量检查
   */
  private async performQualityChecks(resource: BaseResource): Promise<void> {
    const checks: QualityCheck[] = []

    // 完整性检查
    const completenessCheck = this.checkCompleteness(resource)
    checks.push(completenessCheck)

    // 准确性检查
    const accuracyCheck = this.checkAccuracy(resource)
    checks.push(accuracyCheck)

    // 格式检查
    const formatCheck = this.checkFormat(resource)
    checks.push(formatCheck)

    // 保存质量检查结果
    for (const check of checks) {
      await this.database.createQualityCheck(check)
    }
  }

  /**
   * 检查完整性
   */
  private checkCompleteness(resource: BaseResource): QualityCheck {
    const requiredFields = ['title', 'category', 'organizer']
    const missingFields = requiredFields.filter(field => !resource[field as keyof BaseResource])

    const score = (requiredFields.length - missingFields.length) / requiredFields.length
    const result = score >= 0.8 ? 'PASS' : score >= 0.5 ? 'WARNING' : 'FAIL'

    return {
      id: crypto.randomUUID(),
      resourceId: resource.id,
      checkType: 'completeness',
      result,
      score,
      details: { missingFields },
      suggestions: missingFields.length > 0 ? `缺少字段: ${missingFields.join(', ')}` : undefined,
      automated: true,
      createdAt: new Date()
    }
  }

  /**
   * 检查准确性
   */
  private checkAccuracy(resource: BaseResource): QualityCheck {
    let score = 1.0
    const issues: string[] = []

    // 检查日期格式
    if (resource.deadline && isNaN(resource.deadline.getTime())) {
      score -= 0.3
      issues.push('截止日期格式错误')
    }

    // 检查邮箱格式
    if (resource.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resource.email)) {
      score -= 0.2
      issues.push('邮箱格式错误')
    }

    // 检查网址格式
    if (resource.website && !/^https?:\/\/.+/.test(resource.website)) {
      score -= 0.2
      issues.push('网址格式错误')
    }

    const result = score >= 0.8 ? 'PASS' : score >= 0.5 ? 'WARNING' : 'FAIL'

    return {
      id: crypto.randomUUID(),
      resourceId: resource.id,
      checkType: 'accuracy',
      result,
      score,
      details: { issues },
      suggestions: issues.length > 0 ? `需要修正: ${issues.join(', ')}` : undefined,
      automated: true,
      createdAt: new Date()
    }
  }

  /**
   * 检查格式
   */
  private checkFormat(resource: BaseResource): QualityCheck {
    let score = 1.0
    const issues: string[] = []

    // 检查标题长度
    if (resource.title.length < 5) {
      score -= 0.3
      issues.push('标题过短')
    }

    // 检查描述长度
    if (resource.description && resource.description.length < 20) {
      score -= 0.2
      issues.push('描述过短')
    }

    const result = score >= 0.8 ? 'PASS' : score >= 0.5 ? 'WARNING' : 'FAIL'

    return {
      id: crypto.randomUUID(),
      resourceId: resource.id,
      checkType: 'format',
      result,
      score,
      details: { issues },
      suggestions: issues.length > 0 ? `格式建议: ${issues.join(', ')}` : undefined,
      automated: true,
      createdAt: new Date()
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<InfoReceiverStats> {
    return await this.database.getStats()
  }

  /**
   * 处理待处理消息
   */
  async processPendingMessages(): Promise<void> {
    if (this.isProcessing) {
      console.log('Already processing pending messages')
      return
    }

    this.isProcessing = true
    
    try {
      const batchSize = this.config.processing.batchSize || 10
      const pendingMessages = await this.database.getRawMessagesByStatus(MessageStatus.PENDING, batchSize)
      
      if (pendingMessages.length === 0) {
        console.log('No pending messages to process')
        return
      }

      console.log(`Processing ${pendingMessages.length} pending messages`)

      // 并发处理消息
      const maxConcurrency = this.config.processing.maxConcurrency || 3
      const chunks = this.chunkArray(pendingMessages, maxConcurrency)

      for (const chunk of chunks) {
        await Promise.allSettled(
          chunk.map(message => this.processMessage(message.id))
        )
      }

      console.log('Finished processing pending messages')
    } catch (error) {
      console.error('Error processing pending messages:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 将数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * 搜索资源
   */
  async searchResources(query: string, category?: string): Promise<BaseResource[]> {
    try {
      return await this.database.searchResources(query, category as SubmissionType)
    } catch (error) {
      console.error('Search resources failed:', error)
      return []
    }
  }

  /**
   * 获取资源列表
   */
  async getResources(status?: string, category?: string, limit?: number): Promise<BaseResource[]> {
    try {
      return await this.database.getResources(status, category, limit)
    } catch (error) {
      console.error('Get resources failed:', error)
      return []
    }
  }

  /**
   * 更新资源状态
   */
  async updateResourceStatus(resourceId: string, status: string): Promise<BaseResource | null> {
    try {
      return await this.database.updateResourceStatus(resourceId, status)
    } catch (error) {
      console.error('Update resource status failed:', error)
      return null
    }
  }
}

/**
 * 创建InfoReceiverService实例的工厂函数
 */
export function createInfoReceiverService(config: InfoReceiverConfig): InfoReceiverService {
  return new InfoReceiverService(config)
}
