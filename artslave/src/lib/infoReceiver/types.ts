// InfoReceiver 类型定义

export enum MessageSource {
  EMAIL = 'EMAIL',
  WECHAT = 'WECHAT',
  WEB = 'WEB',
  SOCIAL = 'SOCIAL',
  API = 'API',
  RSS = 'RSS',
  WEBHOOK = 'WEBHOOK'
}

export enum MessageStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  CANCELLED = 'CANCELLED'
}

export enum ResourceStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  DUPLICATE = 'DUPLICATE',
  MERGED = 'MERGED'
}

export enum SubmissionType {
  EXHIBITION = 'EXHIBITION',
  RESIDENCY = 'RESIDENCY',
  COMPETITION = 'COMPETITION',
  GRANT = 'GRANT',
  CONFERENCE = 'CONFERENCE',
  PUBLICATION = 'PUBLICATION',
  OTHER = 'OTHER'
}

export enum ConfidenceLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum TaskType {
  PARSE = 'parse',
  CRAWL = 'crawl',
  OCR = 'ocr',
  GEOCODE = 'geocode',
  DEDUPLICATE = 'deduplicate'
}

// 原始消息接口
export interface RawMessage {
  id: string
  source: MessageSource
  content: string
  links: string[]
  images: string[]
  attachments: string[]
  metadata?: {
    sender?: string
    timestamp?: Date
    platform?: string
    title?: string
    description?: string
    userAgent?: string
    ip?: string
    [key: string]: any
  }
  status: MessageStatus
  processed: boolean
  resourceId?: string
  errorMessage?: string
  retryCount: number
  priority: number
  scheduledAt?: Date
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// 解析后的资源接口
export interface BaseResource {
  id: string
  title: string
  category: SubmissionType
  deadline?: Date
  eventDate?: Date
  endDate?: Date
  location?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  organizer?: string
  description?: string
  requirements?: string
  fee?: string
  prize?: string
  contact?: string
  email?: string
  phone?: string
  website?: string
  originalUrl?: string
  tags: string[]
  source: MessageSource
  confidence?: number
  confidenceLevel?: ConfidenceLevel
  status: ResourceStatus
  language?: string
  contentHash: string
  similarityHash?: string
  version: number
  parentId?: string
  reviewedBy?: string
  reviewedAt?: Date
  reviewNotes?: string
  createdAt: Date
  updatedAt: Date
}

// LLM 解析结果接口
export interface ParseResult {
  title?: string
  category?: SubmissionType
  deadline?: string
  eventDate?: string
  endDate?: string
  location?: string
  city?: string
  country?: string
  organizer?: string
  description?: string
  requirements?: string
  fee?: string
  prize?: string
  contact?: string
  email?: string
  phone?: string
  website?: string
  originalUrl?: string
  tags?: string[]
  language?: string
  confidence: number
  confidenceLevel?: ConfidenceLevel
  reasoning?: string
  extractedFields?: Record<string, any>
  processingTime?: number
  llmUsed?: string
}

// 解析任务接口
export interface ParseTask {
  id: string
  messageId: string
  taskType: TaskType
  priority: number
  attempts: number
  maxAttempts: number
  status: MessageStatus
  scheduledAt: Date
  startedAt?: Date
  completedAt?: Date
  processingTime?: number
  errorMessage?: string
  errorCode?: string
  result?: any
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// 解析规则接口
export interface ParseRule {
  id: string
  name: string
  description?: string
  category: SubmissionType
  keywords: string[]
  patterns?: any
  confidence: number
  isActive: boolean
  priority: number
  language: string
  ruleType: string
  config?: any
  successCount: number
  totalCount: number
  createdAt: Date
  updatedAt: Date
}

// 质量检查接口
export interface QualityCheck {
  id: string
  resourceId: string
  checkType: string
  result: 'PASS' | 'FAIL' | 'WARNING'
  score?: number
  details?: any
  suggestions?: string
  automated: boolean
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
}

// 处理统计接口
export interface ProcessingStats {
  id: string
  date: Date
  source: MessageSource
  totalMessages: number
  successfulParsed: number
  failedParsed: number
  duplicatesFound: number
  avgConfidence?: number
  avgProcessingTime?: number
  createdAt: Date
  updatedAt: Date
}

// 系统配置接口
export interface SystemConfig {
  id: string
  key: string
  value: any
  description?: string
  category: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 通知记录接口
export interface NotificationLog {
  id: string
  type: string
  recipient: string
  subject?: string
  content: string
  status: string
  metadata?: any
  sentAt?: Date
  createdAt: Date
}

// API 请求接口
export interface SubmitMessageRequest {
  source: MessageSource
  content: string
  links?: string[]
  images?: string[]
  attachments?: string[]
  metadata?: Record<string, any>
}

export interface SubmitMessageResponse {
  success: boolean
  messageId: string
  message: string
}

// 统计接口
export interface InfoReceiverStats {
  totalMessages: number
  pendingMessages: number
  processingMessages: number
  completedMessages: number
  failedMessages: number
  manualReviewMessages: number
  totalResources: number
  verifiedResources: number
  duplicateResources: number
  averageConfidence: number
  processingRate: number
  successRate: number
  averageProcessingTime: number
}

// 监控指标接口
export interface MonitoringMetrics {
  messageProcessingRate: number
  llmCallLatency: number
  llmCallSuccessRate: number
  queueLength: number
  systemResourceUsage: {
    cpu: number
    memory: number
    disk: number
  }
  errorRate: number
  duplicateRate: number
}

// 配置接口
export interface InfoReceiverConfig {
  llm: {
    provider: 'openai' | 'anthropic' | 'google' | 'local'
    model: string
    apiKey?: string
    baseUrl?: string
    maxTokens: number
    temperature: number
    timeout: number
    fallbackModels?: string[]
  }
  crawler: {
    timeout: number
    maxRetries: number
    delay: number
    userAgent?: string
    enableJavaScript: boolean
  }
  deduplication: {
    threshold: number
    enableSimilarityCheck: boolean
    hashAlgorithm: 'md5' | 'sha256'
  }
  processing: {
    batchSize: number
    maxConcurrency: number
    confidenceThreshold: number
    manualReviewThreshold: number
    enableRuleEngine: boolean
    enableGeocoding: boolean
    enableOCR: boolean
  }
  queue: {
    redisUrl?: string
    maxRetries: number
    retryDelay: number
    priorityLevels: number
  }
  monitoring: {
    enableMetrics: boolean
    metricsInterval: number
    enableNotifications: boolean
    alertThresholds: {
      errorRate: number
      queueLength: number
      processingLatency: number
      diskUsage: number
      memoryUsage: number
    }
  }
  storage: {
    provider: 'prisma' | 'memory' | 'redis'
    connectionString?: string
    enableBackup: boolean
    backupInterval: number
  }
}

// 去重结果接口
export interface DeduplicationResult {
  isDuplicate: boolean
  similarityScore: number
  duplicateId?: string
  reason: string
  suggestions?: string[]
}

// 地理编码结果接口
export interface GeocodingResult {
  latitude?: number
  longitude?: number
  city?: string
  country?: string
  formattedAddress?: string
  confidence: number
}

// 内容爬取结果接口
export interface CrawlResult {
  success: boolean
  content?: string
  title?: string
  description?: string
  images?: string[]
  metadata?: Record<string, any>
  error?: string
}

// LLM 错误类型
export class LLMError extends Error {
  constructor(message: string, public code?: string, public provider?: string, public retryable?: boolean) {
    super(message)
    this.name = 'LLMError'
  }
}
