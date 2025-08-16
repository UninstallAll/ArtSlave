// InfoReceiver 统一配置

import { InfoReceiverConfig } from './types'

// 默认配置
export const defaultInfoReceiverConfig: InfoReceiverConfig = {
  llm: {
    provider: 'openai',
    model: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: 'https://api.deepseek.com',
    maxTokens: 2000,
    temperature: 0.1,
    timeout: 30000,
    fallbackModels: ['gpt-4o-mini', 'gpt-3.5-turbo']
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
      processingLatency: 10000,
      diskUsage: 0.9,
      memoryUsage: 0.9
    }
  },
  storage: {
    provider: 'prisma',
    enableBackup: false,
    backupInterval: 3600000
  }
}

// 测试环境配置
export const testInfoReceiverConfig: InfoReceiverConfig = {
  ...defaultInfoReceiverConfig,
  llm: {
    ...defaultInfoReceiverConfig.llm,
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || 'test-key'
  },
  crawler: {
    ...defaultInfoReceiverConfig.crawler,
    userAgent: 'ArtSlave InfoReceiver Test Bot 1.0'
  },
  processing: {
    ...defaultInfoReceiverConfig.processing,
    batchSize: 5,
    maxConcurrency: 2
  }
}
