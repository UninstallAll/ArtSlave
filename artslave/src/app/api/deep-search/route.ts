import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coreNode, config, preset } = body

    // 验证核心节点
    if (!coreNode || !coreNode.name || !coreNode.type) {
      return NextResponse.json({
        success: false,
        error: 'Invalid core node. Name and type are required.'
      }, { status: 400 })
    }

    // 直接返回模拟数据进行测试
    const mockResult = generateMockSearchResult(coreNode)

    return NextResponse.json({
      success: true,
      data: mockResult,
      mock: true
    })

  } catch (error) {
    console.error('Deep search error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  switch (action) {
    case 'presets':
      return NextResponse.json({
        success: true,
        data: {
          presets: Object.keys(SEARCH_PRESETS),
          descriptions: {
            quick: '快速搜索：浅层但广泛，适合快速概览',
            deep: '深度搜索：深层但精确，适合详细研究',
            broad: '广泛搜索：中等深度，大量节点',
            precise: '精确搜索：高相关性要求，质量优先'
          }
        }
      })

    case 'config':
      return NextResponse.json({
        success: true,
        data: {
          defaultConfig: {
            maxDepth: DEFAULT_SEARCH_CONFIG.maxDepth,
            maxNodesPerLevel: DEFAULT_SEARCH_CONFIG.maxNodesPerLevel,
            relevanceThreshold: DEFAULT_SEARCH_CONFIG.relevanceThreshold,
            focusWeight: DEFAULT_SEARCH_CONFIG.focusWeight
          },
          nodeTypes: [
            'artist',
            'exhibition', 
            'institution',
            'artwork',
            'curator',
            'movement',
            'location',
            'event'
          ],
          edgeTypes: [
            'collaborated_with',
            'exhibited_at',
            'influenced_by',
            'curated_by',
            'belongs_to',
            'contemporary_of',
            'studied_under',
            'participated_in',
            'located_in',
            'created_by',
            'owned_by'
          ]
        }
      })

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid action parameter'
      }, { status: 400 })
  }
}

// 生成模拟搜索结果
function generateMockSearchResult(coreNode: any): any {
  const mockNodes = [
    // 核心节点
    {
      id: `${coreNode.type}_${coreNode.name.toLowerCase().replace(/\s+/g, '_')}`,
      type: coreNode.type,
      name: coreNode.name,
      relevanceScore: 1.0,
      depth: 0,
      data: coreNode.data || {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        source: 'mock_data',
        confidence: 1.0,
        searchDepth: 0,
        urls: []
      }
    }
  ]

  // 根据核心节点类型生成相关节点
  if (coreNode.type === 'artist') {
    mockNodes.push(
      {
        id: 'exhibition_solo_show_2023',
        type: 'exhibition',
        name: `${coreNode.name} Solo Exhibition 2023`,
        relevanceScore: 0.95,
        depth: 1,
        data: { year: 2023, type: 'solo', venue: 'Modern Art Gallery' },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'mock_data',
          confidence: 0.9,
          searchDepth: 1,
          urls: []
        }
      },
      {
        id: 'institution_modern_art_gallery',
        type: 'institution',
        name: 'Modern Art Gallery',
        relevanceScore: 0.85,
        depth: 1,
        data: { type: 'gallery', location: 'New York' },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'mock_data',
          confidence: 0.8,
          searchDepth: 1,
          urls: []
        }
      },
      {
        id: 'artist_contemporary_peer',
        type: 'artist',
        name: 'Contemporary Peer Artist',
        relevanceScore: 0.75,
        depth: 2,
        data: { nationality: 'American', medium: ['painting', 'sculpture'] },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'mock_data',
          confidence: 0.7,
          searchDepth: 2,
          urls: []
        }
      },
      {
        id: 'curator_john_smith',
        type: 'curator',
        name: 'John Smith',
        relevanceScore: 0.70,
        depth: 2,
        data: { specialization: 'Contemporary Art', institution: 'Modern Art Gallery' },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'mock_data',
          confidence: 0.75,
          searchDepth: 2,
          urls: []
        }
      }
    )
  } else if (coreNode.type === 'exhibition') {
    mockNodes.push(
      {
        id: 'artist_featured_artist_1',
        type: 'artist',
        name: 'Featured Artist One',
        relevanceScore: 0.90,
        depth: 1,
        data: { nationality: 'British', medium: ['photography'] },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'mock_data',
          confidence: 0.85,
          searchDepth: 1,
          urls: []
        }
      },
      {
        id: 'artist_featured_artist_2',
        type: 'artist',
        name: 'Featured Artist Two',
        relevanceScore: 0.88,
        depth: 1,
        data: { nationality: 'German', medium: ['installation'] },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'mock_data',
          confidence: 0.82,
          searchDepth: 1,
          urls: []
        }
      }
    )
  }

  const mockEdges = [
    {
      id: 'edge_1',
      source: mockNodes[0].id,
      target: mockNodes[1]?.id,
      type: 'exhibited_at',
      weight: 0.9,
      properties: {},
      metadata: {
        createdAt: new Date(),
        evidence: ['Exhibition catalog', 'Gallery website'],
        confidence: 0.9,
        source: 'mock_data'
      }
    }
  ].filter(edge => edge.target) // 过滤掉无效的边

  return {
    nodes: mockNodes,
    edges: mockEdges,
    metadata: {
      searchId: `mock_search_${Date.now()}`,
      coreNodeId: mockNodes[0].id,
      totalNodes: mockNodes.length,
      totalEdges: mockEdges.length,
      maxDepthReached: Math.max(...mockNodes.map(n => n.depth)),
      searchDuration: 1500, // 模拟1.5秒搜索时间
      timestamp: new Date()
    }
  }
}
