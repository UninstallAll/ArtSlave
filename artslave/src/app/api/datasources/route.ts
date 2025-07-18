import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseAdapter } from '@/lib/databaseAdapter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const active = searchParams.get('active')
    
    const db = getDatabaseAdapter()
    
    // Get all data sources with optional filtering
    let dataSources = await db.getDataSources()
    
    // Apply filters
    if (type && type !== 'all') {
      dataSources = dataSources.filter(source => source.type === type)
    }
    
    if (active !== null) {
      const isActive = active === 'true'
      dataSources = dataSources.filter(source => source.isActive === isActive)
    }
    
    return NextResponse.json({
      success: true,
      data: dataSources,
      count: dataSources.length
    })
  } catch (error) {
    console.error('获取数据源失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取数据源失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      url,
      type,
      category,
      crawlFreq,
      isActive = true,
      config = {}
    } = body
    
    // Validate required fields
    if (!name || !url || !type) {
      return NextResponse.json({
        success: false,
        error: '缺少必需字段: name, url, type'
      }, { status: 400 })
    }
    
    // Validate type
    const validTypes = ['website', 'api', 'rss']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: `无效的类型: ${type}. 有效类型: ${validTypes.join(', ')}`
      }, { status: 400 })
    }
    
    const db = getDatabaseAdapter()

    const newDataSource = {
      id: Date.now().toString(), // Simple ID generation
      name,
      url,
      type,
      category: category || '未分类',
      isActive,
      crawlFreq: crawlFreq || 24, // Default 24 hours
      itemsFound: 0,
      status: 'idle' as const,
      config,
      createdAt: new Date().toISOString(),
      lastCrawled: null
    }
    
    const result = await db.createDataSource(newDataSource)
    
    return NextResponse.json({
      success: true,
      data: result,
      message: '数据源创建成功'
    }, { status: 201 })
  } catch (error) {
    console.error('创建数据源失败:', error)
    return NextResponse.json({
      success: false,
      error: '创建数据源失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少数据源ID'
      }, { status: 400 })
    }
    
    const db = getDatabaseAdapter()

    // Check if data source exists
    const existingSource = await db.getDataSource(id)
    if (!existingSource) {
      return NextResponse.json({
        success: false,
        error: '数据源不存在'
      }, { status: 404 })
    }
    
    // Validate type if provided
    if (updates.type) {
      const validTypes = ['website', 'api', 'rss']
      if (!validTypes.includes(updates.type)) {
        return NextResponse.json({
          success: false,
          error: `无效的类型: ${updates.type}. 有效类型: ${validTypes.join(', ')}`
        }, { status: 400 })
      }
    }
    
    const updatedSource = await db.updateDataSource(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      data: updatedSource,
      message: '数据源更新成功'
    })
  } catch (error) {
    console.error('更新数据源失败:', error)
    return NextResponse.json({
      success: false,
      error: '更新数据源失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少数据源ID'
      }, { status: 400 })
    }
    
    const db = getDatabaseAdapter()

    // Check if data source exists
    const existingSource = await db.getDataSource(id)
    if (!existingSource) {
      return NextResponse.json({
        success: false,
        error: '数据源不存在'
      }, { status: 404 })
    }
    
    await db.deleteDataSource(id)
    
    return NextResponse.json({
      success: true,
      message: '数据源删除成功'
    })
  } catch (error) {
    console.error('删除数据源失败:', error)
    return NextResponse.json({
      success: false,
      error: '删除数据源失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
