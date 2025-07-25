// 去重服务

import crypto from 'crypto'
import { BaseResource, ParseResult, SubmissionType, DeduplicationResult } from './types'
import { InfoReceiverDatabase } from './database'

export interface DeduplicationConfig {
  threshold: number
  enableSimilarityCheck: boolean
  hashAlgorithm: 'md5' | 'sha256'
}

export class DeduplicationService {
  private config: DeduplicationConfig
  private database: InfoReceiverDatabase

  constructor(config: DeduplicationConfig) {
    this.config = config
    this.database = new InfoReceiverDatabase()
  }

  async checkDuplication(parseResult: ParseResult): Promise<DeduplicationResult> {
    try {
      if (parseResult.originalUrl) {
        const urlDuplicate = await this.checkUrlDuplicate(parseResult.originalUrl)
        if (urlDuplicate.isDuplicate) {
          return urlDuplicate
        }
      }

      const contentHash = this.generateContentHash(parseResult)
      const hashDuplicate = await this.checkContentHashDuplicate(contentHash)
      if (hashDuplicate.isDuplicate) {
        return hashDuplicate
      }

      if (this.config.enableSimilarityCheck) {
        const similarityDuplicate = await this.checkSimilarityDuplicate(parseResult)
        if (similarityDuplicate.isDuplicate) {
          return similarityDuplicate
        }
      }

      return {
        isDuplicate: false,
        similarityScore: 0,
        reason: '未发现重复内容'
      }

    } catch (error) {
      console.error('Deduplication check failed:', error)
      return {
        isDuplicate: false,
        similarityScore: 0,
        reason: `去重检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  private async checkUrlDuplicate(url: string): Promise<DeduplicationResult> {
    try {
      const existingResource = await this.database.findResourceByUrl(url)
      if (existingResource) {
        return {
          isDuplicate: true,
          similarityScore: 1.0,
          duplicateId: existingResource.id,
          reason: 'URL已存在'
        }
      }
    } catch (error) {
      console.warn('URL duplicate check failed:', error)
    }

    return {
      isDuplicate: false,
      similarityScore: 0,
      reason: 'URL未重复'
    }
  }

  private async checkContentHashDuplicate(contentHash: string): Promise<DeduplicationResult> {
    try {
      const existingResource = await this.database.findResourceByHash(contentHash)
      if (existingResource) {
        return {
          isDuplicate: true,
          similarityScore: 1.0,
          duplicateId: existingResource.id,
          reason: '内容完全相同'
        }
      }
    } catch (error) {
      console.warn('Content hash duplicate check failed:', error)
    }

    return {
      isDuplicate: false,
      similarityScore: 0,
      reason: '内容哈希未重复'
    }
  }

  private async checkSimilarityDuplicate(parseResult: ParseResult): Promise<DeduplicationResult> {
    try {
      const similarResources = await this.database.getResourcesByCategory(
        (parseResult.category as SubmissionType) || SubmissionType.OTHER,
        50
      )

      let maxSimilarity = 0
      let mostSimilarResource: BaseResource | null = null

      for (const resource of similarResources) {
        const similarity = this.calculateSimilarity(parseResult, resource)
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity
          mostSimilarResource = resource
        }
      }

      if (maxSimilarity >= this.config.threshold) {
        return {
          isDuplicate: true,
          similarityScore: maxSimilarity,
          duplicateId: mostSimilarResource!.id,
          reason: `相似度过高 (${(maxSimilarity * 100).toFixed(1)}%)`
        }
      }

    } catch (error) {
      console.warn('Similarity duplicate check failed:', error)
    }

    return {
      isDuplicate: false,
      similarityScore: 0,
      reason: '相似度检查通过'
    }
  }

  private generateContentHash(parseResult: ParseResult): string {
    const content = [
      parseResult.title,
      parseResult.organizer,
      parseResult.deadline,
      parseResult.location
    ].filter(Boolean).join('|')

    return crypto.createHash(this.config.hashAlgorithm).update(content).digest('hex')
  }

  private calculateSimilarity(parseResult: ParseResult, resource: BaseResource): number {
    let totalScore = 0
    let totalWeight = 0

    if (parseResult.title && resource.title) {
      const titleSimilarity = this.calculateTextSimilarity(parseResult.title, resource.title)
      totalScore += titleSimilarity * 0.4
      totalWeight += 0.4
    }

    if (parseResult.organizer && resource.organizer) {
      const organizerSimilarity = this.calculateTextSimilarity(parseResult.organizer, resource.organizer)
      totalScore += organizerSimilarity * 0.3
      totalWeight += 0.3
    }

    if (parseResult.location && resource.location) {
      const locationSimilarity = this.calculateTextSimilarity(parseResult.location, resource.location)
      totalScore += locationSimilarity * 0.2
      totalWeight += 0.2
    }

    if (parseResult.deadline && resource.deadline) {
      const dateSimilarity = this.calculateDateSimilarity(
        new Date(parseResult.deadline),
        resource.deadline
      )
      totalScore += dateSimilarity * 0.1
      totalWeight += 0.1
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    
    const set1 = new Set(words1)
    const set2 = new Set(words2)
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  private calculateDateSimilarity(date1: Date, date2: Date): number {
    const diffMs = Math.abs(date1.getTime() - date2.getTime())
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    
    if (diffDays === 0) return 1
    if (diffDays <= 7) return 0.8
    if (diffDays <= 30) return 0.5
    return 0.2
  }
}
