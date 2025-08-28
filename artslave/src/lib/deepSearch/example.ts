// DeepSearch 使用示例

import { DeepSearchEngine } from './SearchEngine'
import { SearchNode, SearchResult } from './types'
import { DEFAULT_SEARCH_CONFIG, SEARCH_PRESETS } from './config'

/**
 * 基础使用示例：搜索艺术家网络
 */
export async function searchArtistNetwork() {
  const searchEngine = new DeepSearchEngine(DEFAULT_SEARCH_CONFIG)

  const coreArtist: SearchNode = {
    id: 'artist_david_hockney',
    type: 'artist',
    name: 'David Hockney',
    data: {
      birthYear: 1937,
      nationality: 'British',
      medium: ['painting', 'photography', 'digital art']
    },
    relevanceScore: 1.0,
    depth: 0,
    searchKeywords: ['David Hockney', 'David Hockney artist'],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'manual_input',
      confidence: 1.0,
      searchDepth: 0,
      urls: []
    }
  }

  const result = await searchEngine.startSearch(coreArtist)
  console.log(`发现 ${result.nodes.length} 个节点，${result.edges.length} 个关系`)
  return result
}

/**
 * 展览网络搜索示例
 */
export async function searchExhibitionNetwork() {
  const searchEngine = new DeepSearchEngine(SEARCH_PRESETS.deep)

  const coreExhibition: SearchNode = {
    id: 'exhibition_documenta_15',
    type: 'exhibition',
    name: 'documenta 15',
    data: {
      year: 2022,
      location: 'Kassel, Germany',
      curator: 'ruangrupa'
    },
    relevanceScore: 1.0,
    depth: 0,
    searchKeywords: ['documenta 15', 'documenta 2022'],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'manual_input',
      confidence: 1.0,
      searchDepth: 0,
      urls: []
    }
  }

  return await searchEngine.startSearch(coreExhibition)
}

/**
 * 交互式搜索示例
 */
export class InteractiveSearch {
  private searchEngine: DeepSearchEngine
  private currentResult?: SearchResult

  constructor(config = DEFAULT_SEARCH_CONFIG) {
    this.searchEngine = new DeepSearchEngine(config)
  }

  async startSearch(coreNode: SearchNode): Promise<SearchResult> {
    this.currentResult = await this.searchEngine.startSearch(coreNode)
    return this.currentResult
  }

  // 从当前结果中选择节点进行扩展搜索
  async expandFromNode(nodeId: string): Promise<SearchResult | null> {
    if (!this.currentResult) {
      throw new Error('No current search result')
    }

    const node = this.currentResult.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found in current result`)
    }

    const newCoreNode: SearchNode = {
      ...node,
      depth: 0,
      relevanceScore: 1.0,
      parentId: undefined
    }

    return await this.startSearch(newCoreNode)
  }

  // 获取节点的邻居
  getNodeNeighbors(nodeId: string): SearchNode[] {
    if (!this.currentResult) return []

    const connectedNodeIds = new Set<string>()
    this.currentResult.edges.forEach(edge => {
      if (edge.source === nodeId) {
        connectedNodeIds.add(edge.target)
      } else if (edge.target === nodeId) {
        connectedNodeIds.add(edge.source)
      }
    })

    return this.currentResult.nodes.filter(node => connectedNodeIds.has(node.id))
  }
}
