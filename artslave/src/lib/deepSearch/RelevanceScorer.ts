import { SearchNode, RelevanceFactors } from './types'

export class RelevanceScorer {
  /**
   * 计算相关性分数
   */
  async calculateRelevance(
    coreNode: SearchNode,
    candidateEntity: any,
    parentNode: SearchNode
  ): Promise<number> {
    try {
      const factors = await this.calculateRelevanceFactors(coreNode, candidateEntity, parentNode)
      return this.computeWeightedScore(factors)
    } catch (error) {
      console.error('Relevance calculation failed:', error)
      return 0.5 // 默认中等相关性
    }
  }

  /**
   * 计算相关性因子
   */
  private async calculateRelevanceFactors(
    coreNode: SearchNode,
    candidateEntity: any,
    parentNode: SearchNode
  ): Promise<RelevanceFactors> {
    return {
      textualSimilarity: this.calculateTextualSimilarity(coreNode, candidateEntity),
      semanticRelatedness: this.calculateSemanticRelatedness(coreNode, candidateEntity),
      temporalProximity: this.calculateTemporalProximity(coreNode, candidateEntity),
      geographicProximity: this.calculateGeographicProximity(coreNode, candidateEntity),
      networkDistance: this.calculateNetworkDistance(parentNode),
      authorityScore: this.calculateAuthorityScore(candidateEntity)
    }
  }

  /**
   * 计算文本相似度
   */
  private calculateTextualSimilarity(coreNode: SearchNode, candidateEntity: any): number {
    const coreName = coreNode.name.toLowerCase()
    const candidateName = candidateEntity.name?.toLowerCase() || ''

    // 简单的字符串相似度计算
    if (coreName === candidateName) return 1.0
    if (coreName.includes(candidateName) || candidateName.includes(coreName)) return 0.8

    // 计算共同词汇
    const coreWords = new Set(coreName.split(/\s+/))
    const candidateWords = new Set(candidateName.split(/\s+/))
    const intersection = new Set([...coreWords].filter(x => candidateWords.has(x)))
    const union = new Set([...coreWords, ...candidateWords])

    return intersection.size / union.size
  }

  /**
   * 计算语义相关性
   */
  private calculateSemanticRelatedness(coreNode: SearchNode, candidateEntity: any): number {
    // 基于类型的相关性
    const typeRelatedness = this.getTypeRelatedness(coreNode.type, candidateEntity.type)
    
    // 基于领域的相关性
    const domainRelatedness = this.getDomainRelatedness(coreNode, candidateEntity)
    
    return (typeRelatedness + domainRelatedness) / 2
  }

  /**
   * 获取类型相关性
   */
  private getTypeRelatedness(coreType: string, candidateType: string): number {
    if (coreType === candidateType) return 1.0

    // 定义类型相关性矩阵
    const typeMatrix: Record<string, Record<string, number>> = {
      artist: {
        exhibition: 0.9,
        artwork: 0.8,
        curator: 0.7,
        institution: 0.6,
        movement: 0.7,
        location: 0.4
      },
      exhibition: {
        artist: 0.9,
        curator: 0.8,
        institution: 0.8,
        artwork: 0.7,
        location: 0.6,
        movement: 0.5
      },
      institution: {
        exhibition: 0.8,
        artist: 0.6,
        curator: 0.7,
        location: 0.8,
        artwork: 0.5,
        movement: 0.4
      }
    }

    return typeMatrix[coreType]?.[candidateType] || 0.3
  }

  /**
   * 获取领域相关性
   */
  private getDomainRelatedness(coreNode: SearchNode, candidateEntity: any): number {
    // 检查共同的艺术运动、风格、媒介等
    const coreData = coreNode.data || {}
    const candidateData = candidateEntity.properties || {}

    let relatedness = 0.5 // 基础相关性

    // 检查艺术运动
    if (coreData.movements && candidateData.movements) {
      const coreMovements = new Set(coreData.movements)
      const candidateMovements = new Set(candidateData.movements)
      const commonMovements = new Set([...coreMovements].filter(x => candidateMovements.has(x)))
      
      if (commonMovements.size > 0) {
        relatedness += 0.3
      }
    }

    // 检查媒介
    if (coreData.medium && candidateData.medium) {
      const coreMedium = new Set(coreData.medium)
      const candidateMedium = new Set(candidateData.medium)
      const commonMedium = new Set([...coreMedium].filter(x => candidateMedium.has(x)))
      
      if (commonMedium.size > 0) {
        relatedness += 0.2
      }
    }

    // 检查国籍/地区
    if (coreData.nationality && candidateData.nationality) {
      if (coreData.nationality === candidateData.nationality) {
        relatedness += 0.1
      }
    }

    return Math.min(relatedness, 1.0)
  }

  /**
   * 计算时间接近度
   */
  private calculateTemporalProximity(coreNode: SearchNode, candidateEntity: any): number {
    const coreYear = this.extractYear(coreNode.data)
    const candidateYear = this.extractYear(candidateEntity.properties)

    if (!coreYear || !candidateYear) return 0.5

    const yearDiff = Math.abs(coreYear - candidateYear)
    
    // 时间差越小，相关性越高
    if (yearDiff === 0) return 1.0
    if (yearDiff <= 5) return 0.9
    if (yearDiff <= 10) return 0.7
    if (yearDiff <= 20) return 0.5
    if (yearDiff <= 50) return 0.3
    
    return 0.1
  }

  /**
   * 提取年份
   */
  private extractYear(data: any): number | null {
    if (!data) return null

    // 尝试从各种字段提取年份
    const yearFields = ['year', 'birthYear', 'createdYear', 'exhibitionYear']
    
    for (const field of yearFields) {
      if (data[field]) {
        const year = parseInt(String(data[field]))
        if (year > 1800 && year <= new Date().getFullYear()) {
          return year
        }
      }
    }

    return null
  }

  /**
   * 计算地理接近度
   */
  private calculateGeographicProximity(coreNode: SearchNode, candidateEntity: any): number {
    const coreLocation = this.extractLocation(coreNode.data)
    const candidateLocation = this.extractLocation(candidateEntity.properties)

    if (!coreLocation || !candidateLocation) return 0.5

    // 简单的地理相关性计算
    if (coreLocation.toLowerCase() === candidateLocation.toLowerCase()) return 1.0
    
    // 检查是否在同一国家/地区
    const coreCountry = this.extractCountry(coreLocation)
    const candidateCountry = this.extractCountry(candidateLocation)
    
    if (coreCountry && candidateCountry && coreCountry === candidateCountry) {
      return 0.7
    }

    return 0.3
  }

  /**
   * 提取位置信息
   */
  private extractLocation(data: any): string | null {
    if (!data) return null

    const locationFields = ['location', 'city', 'country', 'nationality', 'birthPlace']
    
    for (const field of locationFields) {
      if (data[field]) {
        return String(data[field])
      }
    }

    return null
  }

  /**
   * 提取国家信息
   */
  private extractCountry(location: string): string | null {
    // 简单的国家提取逻辑
    const countries = ['USA', 'UK', 'France', 'Germany', 'Italy', 'Spain', 'China', 'Japan', 'Korea']
    
    for (const country of countries) {
      if (location.toLowerCase().includes(country.toLowerCase())) {
        return country
      }
    }

    return null
  }

  /**
   * 计算网络距离
   */
  private calculateNetworkDistance(parentNode: SearchNode): number {
    // 基于深度的距离计算
    const depth = parentNode.depth
    
    if (depth === 0) return 1.0
    if (depth === 1) return 0.8
    if (depth === 2) return 0.6
    if (depth === 3) return 0.4
    
    return 0.2
  }

  /**
   * 计算权威性分数
   */
  private calculateAuthorityScore(candidateEntity: any): number {
    // 基于实体的权威性指标
    let score = 0.5

    const properties = candidateEntity.properties || {}

    // 检查是否有知名度指标
    if (properties.exhibitions && Array.isArray(properties.exhibitions)) {
      score += Math.min(properties.exhibitions.length * 0.1, 0.3)
    }

    if (properties.awards && Array.isArray(properties.awards)) {
      score += Math.min(properties.awards.length * 0.1, 0.2)
    }

    if (properties.collections && Array.isArray(properties.collections)) {
      score += Math.min(properties.collections.length * 0.05, 0.2)
    }

    return Math.min(score, 1.0)
  }

  /**
   * 计算加权分数
   */
  private computeWeightedScore(factors: RelevanceFactors): number {
    const weights = {
      textualSimilarity: 0.25,
      semanticRelatedness: 0.30,
      temporalProximity: 0.15,
      geographicProximity: 0.10,
      networkDistance: 0.15,
      authorityScore: 0.05
    }

    const score = 
      factors.textualSimilarity * weights.textualSimilarity +
      factors.semanticRelatedness * weights.semanticRelatedness +
      factors.temporalProximity * weights.temporalProximity +
      factors.geographicProximity * weights.geographicProximity +
      factors.networkDistance * weights.networkDistance +
      factors.authorityScore * weights.authorityScore

    return Math.max(0, Math.min(1, score))
  }
}
