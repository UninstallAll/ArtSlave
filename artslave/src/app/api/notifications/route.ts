import { NextRequest, NextResponse } from 'next/server'

// 简单的内存存储，实际应用中应该使用数据库
let notifications: any[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')

    let filteredNotifications = notifications

    // 按用户ID筛选
    if (userId) {
      filteredNotifications = filteredNotifications.filter(n => n.userId === userId)
    }

    // 按类型筛选
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type)
    }

    // 按时间排序并限制数量
    const result = filteredNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: result,
      total: filteredNotifications.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get notifications:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证必需字段
    const { userId, type, title, message } = body
    if (!userId || !type || !title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, type, title, message'
      }, { status: 400 })
    }

    // 创建通知
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      data: body.data || null,
      read: false,
      createdAt: new Date().toISOString()
    }

    notifications.push(notification)

    // 保持通知数量在合理范围内（最多1000条）
    if (notifications.length > 1000) {
      notifications = notifications.slice(-1000)
    }

    // 在实际应用中，这里可以集成推送服务
    console.log(`📧 新通知: ${title} -> 用户 ${userId}`)

    return NextResponse.json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing notification ID'
      }, { status: 400 })
    }

    // 查找并更新通知
    const index = notifications.findIndex(n => n.id === id)
    if (index === -1) {
      return NextResponse.json({
        success: false,
        error: 'Notification not found'
      }, { status: 404 })
    }

    notifications[index] = {
      ...notifications[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: notifications[index],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to update notification:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 批量标记为已读
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ids } = body
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId'
      }, { status: 400 })
    }

    let updatedCount = 0

    if (ids && Array.isArray(ids)) {
      // 标记指定通知为已读
      notifications.forEach(notification => {
        if (notification.userId === userId && ids.includes(notification.id)) {
          notification.read = true
          notification.updatedAt = new Date().toISOString()
          updatedCount++
        }
      })
    } else {
      // 标记用户所有通知为已读
      notifications.forEach(notification => {
        if (notification.userId === userId && !notification.read) {
          notification.read = true
          notification.updatedAt = new Date().toISOString()
          updatedCount++
        }
      })
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
