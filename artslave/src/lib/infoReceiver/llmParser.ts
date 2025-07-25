// LLM 解析服务

import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'
import { ParseResult, SubmissionType, LLMError } from './types'

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  model: string
  apiKey?: string
  baseUrl?: string
  maxTokens: number
  temperature: number
  timeout: number
}

export class LLMParser {
  private openai?: OpenAI
  private anthropic?: Anthropic
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
    this.initializeClients()
  }

  private initializeClients() {
    switch (this.config.provider) {
      case 'openai':
        if (!this.config.apiKey) {
          throw new Error('OpenAI API key is required')
        }
        this.openai = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl,
          timeout: this.config.timeout
        })
        break
      
      case 'anthropic':
        if (!this.config.apiKey) {
          throw new Error('Anthropic API key is required')
        }
        this.anthropic = new Anthropic({
          apiKey: this.config.apiKey,
          timeout: this.config.timeout
        })
        break
      
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`)
    }
  }

  async parseContent(content: string, links: string[] = []): Promise<ParseResult> {
    const startTime = Date.now()
    
    try {
      const prompt = this.buildPrompt(content, links)
      let result: any

      switch (this.config.provider) {
        case 'openai':
          result = await this.parseWithOpenAI(prompt)
          break
        case 'anthropic':
          result = await this.parseWithAnthropic(prompt)
          break
        default:
          throw new LLMError(`Unsupported provider: ${this.config.provider}`)
      }

      const processingTime = Date.now() - startTime
      
      // 验证和清理结果
      const cleanedResult = this.validateAndCleanResult(result)
      
      return {
        ...cleanedResult,
        processingTime,
        llmUsed: `${this.config.provider}:${this.config.model}`
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      console.error('LLM parsing failed:', error)
      
      throw new LLMError(
        `Failed to parse content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_ERROR',
        this.config.provider,
        true
      )
    }
  }

  private buildPrompt(content: string, links: string[]): string {
    const linksText = links.length > 0 ? `\n相关链接：\n${links.join('\n')}` : ''
    
    return `请从以下内容中提取投稿信息，返回JSON格式：

内容：
${content}${linksText}

请提取以下字段并返回严格的JSON格式：
{
  "title": "活动/投稿标题",
  "category": "类型 (EXHIBITION|RESIDENCY|COMPETITION|FUNDING|CONFERENCE)",
  "deadline": "截止日期 (YYYY-MM-DD格式，如无法确定请返回null)",
  "location": "地点信息",
  "organizer": "主办方",
  "description": "详细描述",
  "requirements": "申请要求",
  "fee": "费用信息",
  "contact": "联系方式",
  "originalUrl": "原始链接",
  "confidence": "置信度 (0-1之间的数字)",
  "reasoning": "解析理由和依据"
}

重要规则：
1. 如果无法确定某个字段，请返回null
2. category必须是以下之一：EXHIBITION, RESIDENCY, COMPETITION, FUNDING, CONFERENCE
3. deadline必须是YYYY-MM-DD格式或null
4. confidence必须是0-1之间的数字
5. 只返回JSON，不要包含其他文字
6. 确保JSON格式正确，可以被解析

如果内容不是投稿信息，请返回：
{
  "title": null,
  "category": null,
  "deadline": null,
  "location": null,
  "organizer": null,
  "description": null,
  "requirements": null,
  "fee": null,
  "contact": null,
  "originalUrl": null,
  "confidence": 0,
  "reasoning": "内容不是投稿信息"
}`
  }

  private async parseWithOpenAI(prompt: string): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized')
    }

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的艺术投稿信息解析助手。请严格按照要求返回JSON格式的结果。'
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
      throw new Error('No response from OpenAI')
    }

    try {
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${content}`)
    }
  }

  private async parseWithAnthropic(prompt: string): Promise<any> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized')
    }

    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    try {
      return JSON.parse(content.text)
    } catch (error) {
      throw new Error(`Failed to parse Anthropic response as JSON: ${content.text}`)
    }
  }

  private validateAndCleanResult(result: any): ParseResult {
    // 验证必需字段
    if (typeof result !== 'object' || result === null) {
      throw new Error('Invalid result format')
    }

    // 验证 category
    if (result.category && !Object.values(SubmissionType).includes(result.category)) {
      console.warn(`Invalid category: ${result.category}, setting to null`)
      result.category = null
    }

    // 验证 deadline 格式
    if (result.deadline && typeof result.deadline === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(result.deadline)) {
        console.warn(`Invalid deadline format: ${result.deadline}, setting to null`)
        result.deadline = null
      }
    }

    // 验证 confidence
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      console.warn(`Invalid confidence: ${result.confidence}, setting to 0`)
      result.confidence = 0
    }

    // 清理字符串字段
    const stringFields = ['title', 'location', 'organizer', 'description', 'requirements', 'fee', 'contact', 'originalUrl', 'reasoning']
    stringFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = result[field].trim()
        if (result[field] === '') {
          result[field] = null
        }
      }
    })

    return {
      title: result.title || null,
      category: result.category || null,
      deadline: result.deadline || null,
      location: result.location || null,
      organizer: result.organizer || null,
      description: result.description || null,
      requirements: result.requirements || null,
      fee: result.fee || null,
      contact: result.contact || null,
      originalUrl: result.originalUrl || null,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || null
    }
  }

  // 批量解析
  async parseBatch(contents: Array<{ content: string, links?: string[] }>): Promise<ParseResult[]> {
    const results = await Promise.allSettled(
      contents.map(({ content, links }) => this.parseContent(content, links))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Batch parsing failed for item ${index}:`, result.reason)
        return {
          title: undefined,
          category: undefined,
          deadline: undefined,
          location: undefined,
          organizer: undefined,
          description: undefined,
          requirements: undefined,
          fee: undefined,
          contact: undefined,
          originalUrl: undefined,
          confidence: 0,
          reasoning: `解析失败: ${result.reason.message}`,
          processingTime: 0,
          llmUsed: this.config.provider
        }
      }
    })
  }

  // 获取使用统计
  getUsageStats() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      // 这里可以添加更多统计信息
    }
  }
}

// 默认配置
export const defaultLLMConfig: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  maxTokens: 2000,
  temperature: 0.1,
  timeout: 30000
}

// 创建默认解析器实例
export function createLLMParser(config?: Partial<LLMConfig>): LLMParser {
  const finalConfig = {
    ...defaultLLMConfig,
    ...config,
    apiKey: config?.apiKey || process.env.OPENAI_API_KEY
  }

  return new LLMParser(finalConfig)
}
