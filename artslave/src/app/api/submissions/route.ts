import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/server-database'

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const query = searchParams.get('query')
    const type = searchParams.get('type')
    const country = searchParams.get('country')
    const days = searchParams.get('days')

    switch (action) {
      case 'search':
        if (query) {
          const results = db.searchSubmissions(query)
          return NextResponse.json({ success: true, data: results })
        }
        break

      case 'filter-type':
        if (type) {
          const results = db.getSubmissionsByType(type)
          return NextResponse.json({ success: true, data: results })
        }
        break

      case 'filter-country':
        if (country) {
          const results = db.getSubmissionsByCountry(country)
          return NextResponse.json({ success: true, data: results })
        }
        break

      case 'upcoming':
        const daysNum = days ? parseInt(days) : 30
        const results = db.getUpcomingDeadlines(daysNum)
        return NextResponse.json({ success: true, data: results })

      case 'statistics':
        const stats = db.getStatistics()
        return NextResponse.json({ success: true, data: stats })

      default:
        // 返回所有投稿信息
        const allSubmissions = db.getAllSubmissions()
        return NextResponse.json({ success: true, data: allSubmissions })
    }

    return NextResponse.json({ success: false, error: '无效的请求参数' }, { status: 400 })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase()
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'add':
        const newSubmission = db.addSubmission(data)
        return NextResponse.json({ success: true, data: newSubmission })

      case 'import':
        let importCount = 0
        if (Array.isArray(data)) {
          for (const item of data) {
            try {
              db.addSubmission(item)
              importCount++
            } catch (error) {
              console.error('导入数据失败:', error)
            }
          }
        }
        return NextResponse.json({
          success: true,
          message: `成功导入 ${importCount} 条数据`
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: '无效的操作' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDatabase()
    const body = await request.json()
    const { id, data } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少ID参数'
      }, { status: 400 })
    }

    const updatedSubmission = db.updateSubmission(id, data)
    
    if (!updatedSubmission) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到指定的投稿信息' 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedSubmission })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少ID参数'
      }, { status: 400 })
    }

    const deleted = db.deleteSubmission(id)
    
    if (!deleted) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到指定的投稿信息' 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: '删除成功' })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误' 
    }, { status: 500 })
  }
}
