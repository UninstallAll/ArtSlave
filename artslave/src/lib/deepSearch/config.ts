import { SearchConfig, ExpansionStrategy, DataSource } from './types'

// 默认扩展策略
export const DEFAULT_EXPANSION_STRATEGIES: ExpansionStrategy[] = [
  {
    name: 'artist_expansion',
    nodeTypes: ['artist', 'exhibition', 'institution'],
    searchPatterns: [
      '{name} artist',
      '{name} exhibition',
      '{name} gallery',
      '{name} museum'
    ],
    priority: 1,
    enabled: true
  },
  {
    name: 'exhibition_expansion',
    nodeTypes: ['artist', 'curator', 'institution', 'artwork'],
    searchPatterns: [
      '{name} exhibition',
      '{name} participants',
      '{name} curator',
      '{name} gallery'
    ],
    priority: 2,
    enabled: true
  },
  {
    name: 'institution_expansion',
    nodeTypes: ['exhibition', 'artist', 'curator'],
    searchPatterns: [
      '{name} exhibitions',
      '{name} artists',
      '{name} collection',
      '{name} programs'
    ],
    priority: 3,
    enabled: true
  }
]

// 默认数据源配置
export const DEFAULT_DATA_SOURCES: DataSource[] = [
  {
    name: 'artnet',
    type: 'web',
    priority: 1,
    rateLimit: 100,
    enabled: true,
    searchStrategies: [
      {
        name: 'artnet_artist_search',
        keywords: ['{name}', '{name} artist'],
        searchPatterns: ['site:artnet.com "{name}"'],
        contentSelectors: ['.artist-info', '.exhibition-list', '.biography'],
        extractionRules: [
          {
            field: 'exhibitions',
            pattern: /exhibition[s]?.*?(\d{4})/gi,
            processor: 'extractExhibitions',
            required: false
          }
        ]
      }
    ]
  },
  {
    name: 'artforum',
    type: 'web',
    priority: 2,
    rateLimit: 50,
    enabled: true,
    searchStrategies: [
      {
        name: 'artforum_search',
        keywords: ['{name}'],
        searchPatterns: ['site:artforum.com "{name}"'],
        contentSelectors: ['.article-content', '.review-content'],
        extractionRules: [
          {
            field: 'reviews',
            pattern: /review.*?by\s+([A-Za-z\s]+)/gi,
            processor: 'extractReviews',
            required: false
          }
        ]
      }
    ]
  },
  {
    name: 'google_search',
    type: 'web',
    priority: 3,
    rateLimit: 200,
    enabled: true,
    searchStrategies: [
      {
        name: 'general_search',
        keywords: ['{name} artist', '{name} exhibition', '{name} gallery'],
        searchPatterns: ['"{name}" artist exhibition', '"{name}" gallery museum'],
        contentSelectors: ['body'],
        extractionRules: []
      }
    ]
  }
]

// 默认搜索配置
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxDepth: 3,
  maxNodesPerLevel: 10,
  relevanceThreshold: 0.6,
  focusWeight: 0.8,
  expansionStrategies: DEFAULT_EXPANSION_STRATEGIES,
  llmConfig: {
    provider: 'openai', // DeepSeek使用OpenAI兼容接口
    model: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    maxTokens: 2000,
    temperature: 0.1,
    timeout: 30000
  },
  dataSourceConfig: {
    sources: DEFAULT_DATA_SOURCES,
    rateLimit: 100,
    timeout: 15000,
    retryAttempts: 3
  }
}

// 预设配置模板
export const SEARCH_PRESETS = {
  // 快速搜索：浅层但广泛
  quick: {
    ...DEFAULT_SEARCH_CONFIG,
    maxDepth: 2,
    maxNodesPerLevel: 15,
    relevanceThreshold: 0.7
  },
  
  // 深度搜索：深层但精确
  deep: {
    ...DEFAULT_SEARCH_CONFIG,
    maxDepth: 4,
    maxNodesPerLevel: 8,
    relevanceThreshold: 0.5
  },
  
  // 广泛搜索：中等深度，大量节点
  broad: {
    ...DEFAULT_SEARCH_CONFIG,
    maxDepth: 3,
    maxNodesPerLevel: 20,
    relevanceThreshold: 0.6
  },
  
  // 精确搜索：高相关性要求
  precise: {
    ...DEFAULT_SEARCH_CONFIG,
    maxDepth: 3,
    maxNodesPerLevel: 6,
    relevanceThreshold: 0.8
  }
}

// 艺术领域特定配置（简化版）
export const ART_DOMAIN_CONFIG = {
  contemporary: {
    ...DEFAULT_SEARCH_CONFIG,
    expansionStrategies: [
      {
        name: 'contemporary_art',
        nodeTypes: ['artist', 'exhibition', 'institution', 'curator'],
        searchPatterns: ['{name} contemporary art', '{name} modern gallery'],
        priority: 1,
        enabled: true
      }
    ]
  }
}

// 配置验证函数
export function validateSearchConfig(config: SearchConfig): string[] {
  const errors: string[] = []
  
  if (config.maxDepth < 1 || config.maxDepth > 10) {
    errors.push('maxDepth must be between 1 and 10')
  }
  
  if (config.maxNodesPerLevel < 1 || config.maxNodesPerLevel > 100) {
    errors.push('maxNodesPerLevel must be between 1 and 100')
  }
  
  if (config.relevanceThreshold < 0 || config.relevanceThreshold > 1) {
    errors.push('relevanceThreshold must be between 0 and 1')
  }
  
  if (!config.llmConfig.apiKey) {
    errors.push('LLM API key is required')
  }
  
  if (config.expansionStrategies.length === 0) {
    errors.push('At least one expansion strategy is required')
  }
  
  return errors
}

// 配置合并函数
export function mergeConfigs(base: SearchConfig, override: Partial<SearchConfig>): SearchConfig {
  return {
    ...base,
    ...override,
    llmConfig: {
      ...base.llmConfig,
      ...override.llmConfig
    },
    dataSourceConfig: {
      ...base.dataSourceConfig,
      ...override.dataSourceConfig,
      sources: override.dataSourceConfig?.sources || base.dataSourceConfig.sources
    },
    expansionStrategies: override.expansionStrategies || base.expansionStrategies
  }
}
