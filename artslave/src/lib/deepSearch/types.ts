// DeepSearch 系统类型定义

export type NodeType = 
  | 'artist' 
  | 'exhibition' 
  | 'institution' 
  | 'artwork' 
  | 'curator'
  | 'movement'
  | 'location'
  | 'event'

export type EdgeType = 
  | 'collaborated_with'
  | 'exhibited_at'
  | 'influenced_by'
  | 'curated_by'
  | 'belongs_to'
  | 'contemporary_of'
  | 'studied_under'
  | 'participated_in'
  | 'located_in'
  | 'created_by'
  | 'owned_by'

export interface SearchNode {
  id: string
  type: NodeType
  name: string
  data: Record<string, any>
  relevanceScore: number
  depth: number
  parentId?: string
  searchKeywords: string[]
  metadata: {
    createdAt: Date
    updatedAt: Date
    source: string
    confidence: number
    searchDepth: number
    urls: string[]
  }
}

export interface SearchEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  weight: number
  properties: Record<string, any>
  metadata: {
    createdAt: Date
    evidence: string[]
    confidence: number
    source: string
  }
}

export interface SearchConfig {
  maxDepth: number
  maxNodesPerLevel: number
  relevanceThreshold: number
  focusWeight: number
  expansionStrategies: ExpansionStrategy[]
  llmConfig: LLMConfig
  dataSourceConfig: DataSourceConfig
}

export interface ExpansionStrategy {
  name: string
  nodeTypes: NodeType[]
  searchPatterns: string[]
  priority: number
  enabled: boolean
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek'
  model: string
  apiKey: string
  baseUrl?: string
  maxTokens: number
  temperature: number
  timeout: number
}

export interface DataSourceConfig {
  sources: DataSource[]
  rateLimit: number
  timeout: number
  retryAttempts: number
}

export interface DataSource {
  name: string
  type: 'web' | 'api' | 'database'
  priority: number
  rateLimit: number
  searchStrategies: SearchStrategy[]
  enabled: boolean
}

export interface SearchStrategy {
  name: string
  keywords: string[]
  searchPatterns: string[]
  contentSelectors: string[]
  extractionRules: ExtractionRule[]
}

export interface ExtractionRule {
  field: string
  pattern: RegExp
  processor: string
  required: boolean
}

export interface RelevanceFactors {
  textualSimilarity: number
  semanticRelatedness: number
  temporalProximity: number
  geographicProximity: number
  networkDistance: number
  authorityScore: number
}

export interface SearchResult {
  nodes: SearchNode[]
  edges: SearchEdge[]
  metadata: {
    searchId: string
    coreNodeId: string
    totalNodes: number
    totalEdges: number
    maxDepthReached: number
    searchDuration: number
    timestamp: Date
  }
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[]
  confidence: number
  processingTime: number
  llmUsed: string
}

export interface ExtractedEntity {
  name: string
  type: NodeType
  confidence: number
  description?: string
  properties: Record<string, any>
  mentions: string[]
}

export interface RelationshipAnalysis {
  sourceEntity: string
  targetEntity: string
  relationshipType: EdgeType
  strength: number
  evidence: string[]
  confidence: number
}

export interface GraphVisualization {
  nodes: VisualNode[]
  edges: VisualEdge[]
  layout: LayoutConfig
  interactions: InteractionConfig
  styling: StyleConfig
}

export interface VisualNode {
  id: string
  x: number
  y: number
  size: number
  color: string
  shape: 'circle' | 'square' | 'diamond' | 'triangle'
  label: string
  icon?: string
  opacity: number
  borderWidth: number
  borderColor: string
}

export interface VisualEdge {
  source: string
  target: string
  width: number
  color: string
  style: 'solid' | 'dashed' | 'dotted'
  curvature: number
  opacity: number
  animated: boolean
}

export interface LayoutConfig {
  algorithm: 'force' | 'circular' | 'hierarchical' | 'grid'
  spacing: number
  iterations: number
  gravity: number
  repulsion: number
  attraction: number
}

export interface InteractionConfig {
  enableZoom: boolean
  enablePan: boolean
  enableSelection: boolean
  enableHover: boolean
  enableDoubleClick: boolean
  enableContextMenu: boolean
}

export interface StyleConfig {
  nodeStyles: Record<NodeType, NodeStyle>
  edgeStyles: Record<EdgeType, EdgeStyle>
  colorScheme: ColorScheme
  fonts: FontConfig
}

export interface NodeStyle {
  defaultColor: string
  hoverColor: string
  selectedColor: string
  size: number
  shape: string
  icon?: string
}

export interface EdgeStyle {
  defaultColor: string
  hoverColor: string
  selectedColor: string
  width: number
  style: string
}

export interface ColorScheme {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  border: string
}

export interface FontConfig {
  family: string
  size: number
  weight: string
  color: string
}

export interface SearchProgress {
  currentDepth: number
  nodesProcessed: number
  totalNodes: number
  edgesFound: number
  status: 'initializing' | 'searching' | 'analyzing' | 'building_graph' | 'completed' | 'error'
  message: string
  progress: number // 0-100
}

export interface DeepSearchError extends Error {
  code: string
  details?: any
  timestamp: Date
}

// 搜索事件类型
export type SearchEventType = 
  | 'search_started'
  | 'node_discovered'
  | 'edge_discovered'
  | 'depth_completed'
  | 'search_completed'
  | 'search_error'

export interface SearchEvent {
  type: SearchEventType
  data: any
  timestamp: Date
  searchId: string
}

// 回调函数类型
export type SearchProgressCallback = (progress: SearchProgress) => void
export type SearchEventCallback = (event: SearchEvent) => void

// 缓存相关类型
export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in seconds
  maxSize: number
  strategy: 'lru' | 'fifo' | 'lfu'
}

export interface CachedResult {
  data: any
  timestamp: Date
  ttl: number
  hits: number
}

// 性能监控类型
export interface PerformanceMetrics {
  searchDuration: number
  nodesPerSecond: number
  edgesPerSecond: number
  llmCallsCount: number
  llmTotalTime: number
  cacheHitRate: number
  memoryUsage: number
  errorCount: number
}

// 导出配置类型
export interface ExportConfig {
  format: 'json' | 'csv' | 'graphml' | 'gexf' | 'cytoscape'
  includeMetadata: boolean
  includeVisualization: boolean
  compression: boolean
}

export interface ExportResult {
  data: string | Buffer
  format: string
  size: number
  timestamp: Date
}
