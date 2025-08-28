import OpenAI from 'openai'
import { 
  LLMConfig, 
  SearchNode, 
  ExpansionStrategy,
  EntityExtractionResult,
  ExtractedEntity,
  RelationshipAnalysis,
  NodeType,
  EdgeType
} from './types'

export interface AnalysisResult {
  entities: ExtractedEntity[]
  relationships: RelationshipAnalysis[]
  confidence: number
  processingTime: number
}

export class LLMAnalyzer {
  private openai?: OpenAI
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
    
    if (config.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl
      })
    }
  }

  /**
   * 分析内容并提取实体和关系
   */
  async analyzeContent(
    content: string,
    contextNode: SearchNode,
    strategies: ExpansionStrategy[]
  ): Promise<AnalysisResult> {
    const startTime = Date.now()

    try {
      // 并行执行实体提取和关系分析
      const [entityResult, relationshipResult] = await Promise.all([
        this.extractEntities(content, contextNode, strategies),
        this.analyzeRelationships(content, contextNode)
      ])

      const processingTime = Date.now() - startTime

      return {
        entities: entityResult.entities,
        relationships: relationshipResult,
        confidence: entityResult.confidence,
        processingTime
      }
    } catch (error) {
      console.error('LLM analysis failed:', error)
      return {
        entities: [],
        relationships: [],
        confidence: 0,
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * 提取实体
   */
  private async extractEntities(
    content: string,
    contextNode: SearchNode,
    strategies: ExpansionStrategy[]
  ): Promise<EntityExtractionResult> {
    const relevantNodeTypes = this.getRelevantNodeTypes(contextNode, strategies)
    
    const prompt = this.buildEntityExtractionPrompt(content, contextNode, relevantNodeTypes)
    
    try {
      const response = await this.callLLM(prompt)
      const result = this.parseEntityExtractionResponse(response)
      
      return {
        entities: result.entities || [],
        confidence: result.confidence || 0.8,
        processingTime: 0,
        llmUsed: `${this.config.provider}:${this.config.model}`
      }
    } catch (error) {
      console.error('Entity extraction failed:', error)
      return {
        entities: [],
        confidence: 0,
        processingTime: 0,
        llmUsed: `${this.config.provider}:${this.config.model}`
      }
    }
  }

  /**
   * 分析关系
   */
  private async analyzeRelationships(
    content: string,
    contextNode: SearchNode
  ): Promise<RelationshipAnalysis[]> {
    const prompt = this.buildRelationshipAnalysisPrompt(content, contextNode)
    
    try {
      const response = await this.callLLM(prompt)
      const result = this.parseRelationshipResponse(response)
      
      return result.relationships || []
    } catch (error) {
      console.error('Relationship analysis failed:', error)
      return []
    }
  }

  /**
   * 构建实体提取提示词
   */
  private buildEntityExtractionPrompt(
    content: string,
    contextNode: SearchNode,
    relevantNodeTypes: NodeType[]
  ): string {
    return `你是一个专业的艺术领域实体识别专家。请从以下文本中提取与"${contextNode.name}"相关的实体。

上下文信息：
- 核心实体：${contextNode.name} (${contextNode.type})
- 当前搜索深度：${contextNode.depth}

需要提取的实体类型：
${relevantNodeTypes.map(type => `- ${type}`).join('\n')}

文本内容：
${content.substring(0, 3000)}

请返回 JSON 格式，包含以下结构：
{
  "entities": [
    {
      "name": "实体名称",
      "type": "实体类型",
      "confidence": 0.9,
      "description": "简短描述",
      "properties": {
        "year": "年份",
        "location": "地点",
        "medium": "媒介"
      },
      "mentions": ["在文本中的提及"]
    }
  ],
  "confidence": 0.85
}

注意：
1. 只提取与核心实体"${contextNode.name}"有直接或间接关联的实体
2. 置信度应该反映实体与核心主题的相关性
3. 优先提取高质量、有具体信息的实体
4. 避免提取过于宽泛或模糊的实体`
  }

  /**
   * 构建关系分析提示词
   */
  private buildRelationshipAnalysisPrompt(
    content: string,
    contextNode: SearchNode
  ): string {
    return `你是一个专业的艺术领域关系分析专家。请分析以下文本中与"${contextNode.name}"相关的实体关系。

核心实体：${contextNode.name} (${contextNode.type})

文本内容：
${content.substring(0, 3000)}

支持的关系类型：
- collaborated_with: 合作关系
- exhibited_at: 展出关系
- influenced_by: 影响关系
- curated_by: 策展关系
- belongs_to: 归属关系
- contemporary_of: 同时代关系
- studied_under: 师承关系
- participated_in: 参与关系
- located_in: 位置关系
- created_by: 创作关系

请返回 JSON 格式：
{
  "relationships": [
    {
      "sourceEntity": "源实体名称",
      "targetEntity": "目标实体名称",
      "relationshipType": "关系类型",
      "strength": 0.8,
      "evidence": ["支持证据1", "支持证据2"],
      "confidence": 0.9
    }
  ]
}

注意：
1. 关系强度(strength)范围0-1，表示关系的重要程度
2. 置信度(confidence)范围0-1，表示关系存在的确定性
3. 证据应该是文本中的具体句子或短语
4. 优先识别与核心实体直接相关的关系`
  }

  /**
   * 调用LLM
   */
  private async callLLM(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('LLM client not initialized')
    }

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的艺术领域分析专家。请严格按照要求返回JSON格式的结果。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from LLM')
    }

    return content
  }

  /**
   * 解析实体提取响应
   */
  private parseEntityExtractionResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      
      // 验证和清理实体数据
      if (parsed.entities && Array.isArray(parsed.entities)) {
        parsed.entities = parsed.entities
          .filter((entity: any) => entity.name && entity.type)
          .map((entity: any) => ({
            name: entity.name.trim(),
            type: this.normalizeNodeType(entity.type),
            confidence: Math.min(Math.max(entity.confidence || 0.8, 0), 1),
            description: entity.description || '',
            properties: entity.properties || {},
            mentions: Array.isArray(entity.mentions) ? entity.mentions : []
          }))
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse entity extraction response:', error)
      return { entities: [], confidence: 0 }
    }
  }

  /**
   * 解析关系分析响应
   */
  private parseRelationshipResponse(response: string): any {
    try {
      const parsed = JSON.parse(response)
      
      // 验证和清理关系数据
      if (parsed.relationships && Array.isArray(parsed.relationships)) {
        parsed.relationships = parsed.relationships
          .filter((rel: any) => rel.sourceEntity && rel.targetEntity && rel.relationshipType)
          .map((rel: any) => ({
            sourceEntity: rel.sourceEntity.trim(),
            targetEntity: rel.targetEntity.trim(),
            relationshipType: this.normalizeEdgeType(rel.relationshipType),
            strength: Math.min(Math.max(rel.strength || 0.5, 0), 1),
            evidence: Array.isArray(rel.evidence) ? rel.evidence : [],
            confidence: Math.min(Math.max(rel.confidence || 0.8, 0), 1)
          }))
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse relationship response:', error)
      return { relationships: [] }
    }
  }

  /**
   * 获取相关节点类型
   */
  private getRelevantNodeTypes(
    contextNode: SearchNode,
    strategies: ExpansionStrategy[]
  ): NodeType[] {
    const relevantTypes = new Set<NodeType>()
    
    // 根据上下文节点类型确定相关类型
    switch (contextNode.type) {
      case 'artist':
        relevantTypes.add('exhibition')
        relevantTypes.add('artwork')
        relevantTypes.add('institution')
        relevantTypes.add('curator')
        relevantTypes.add('artist')
        break
      case 'exhibition':
        relevantTypes.add('artist')
        relevantTypes.add('curator')
        relevantTypes.add('institution')
        relevantTypes.add('artwork')
        break
      case 'institution':
        relevantTypes.add('exhibition')
        relevantTypes.add('artist')
        relevantTypes.add('curator')
        break
      default:
        // 默认包含所有类型
        relevantTypes.add('artist')
        relevantTypes.add('exhibition')
        relevantTypes.add('institution')
        relevantTypes.add('artwork')
        relevantTypes.add('curator')
    }

    // 根据扩展策略添加类型
    strategies.forEach(strategy => {
      if (strategy.enabled) {
        strategy.nodeTypes.forEach(type => relevantTypes.add(type))
      }
    })

    return Array.from(relevantTypes)
  }

  /**
   * 标准化节点类型
   */
  private normalizeNodeType(type: string): NodeType {
    const typeMap: Record<string, NodeType> = {
      'artist': 'artist',
      'exhibition': 'exhibition',
      'institution': 'institution',
      'artwork': 'artwork',
      'curator': 'curator',
      'movement': 'movement',
      'location': 'location',
      'event': 'event'
    }

    const normalized = type.toLowerCase().trim()
    return typeMap[normalized] || 'artist'
  }

  /**
   * 标准化边类型
   */
  private normalizeEdgeType(type: string): EdgeType {
    const typeMap: Record<string, EdgeType> = {
      'collaborated_with': 'collaborated_with',
      'exhibited_at': 'exhibited_at',
      'influenced_by': 'influenced_by',
      'curated_by': 'curated_by',
      'belongs_to': 'belongs_to',
      'contemporary_of': 'contemporary_of',
      'studied_under': 'studied_under',
      'participated_in': 'participated_in',
      'located_in': 'located_in',
      'created_by': 'created_by',
      'owned_by': 'owned_by'
    }

    const normalized = type.toLowerCase().trim()
    return typeMap[normalized] || 'collaborated_with'
  }
}
