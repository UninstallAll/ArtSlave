import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // 获取各种统计数据
    const [
      totalSubmissions,
      activeSubmissions,
      totalUsers,
      totalUserSubmissions,
      recentSubmissions,
      submissionsByType,
      usersByType,
      submissionsByStatus
    ] = await Promise.all([
      // 总投稿信息数
      prisma.submissionInfo.count(),
      
      // 活跃投稿信息数
      prisma.submissionInfo.count({
        where: { isActive: true }
      }),
      
      // 总用户数
      prisma.user.count(),
      
      // 总用户投稿记录数
      prisma.userSubmission.count(),
      
      // 最近7天的投稿信息
      prisma.submissionInfo.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // 按类型分组的投稿信息
      prisma.submissionInfo.groupBy({
        by: ['type'],
        _count: {
          id: true
        }
      }),
      
      // 按类型分组的用户
      prisma.user.groupBy({
        by: ['userType'],
        _count: {
          id: true
        },
        where: {
          userType: {
            not: null
          }
        }
      }),
      
      // 按状态分组的用户投稿
      prisma.userSubmission.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      })
    ])

    // 计算成功率
    const completedSubmissions = submissionsByStatus.find(s => s.status === 'SUBMITTED')?._count.id || 0
    const successRate = totalUserSubmissions > 0 ? (completedSubmissions / totalUserSubmissions * 100).toFixed(1) : '0'

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSubmissions,
          activeSubmissions,
          totalUsers,
          totalUserSubmissions,
          recentSubmissions,
          successRate: parseFloat(successRate)
        },
        submissionsByType: submissionsByType.map(item => ({
          type: item.type,
          count: item._count.id
        })),
        usersByType: usersByType.map(item => ({
          type: item.userType,
          count: item._count.id
        })),
        submissionsByStatus: submissionsByStatus.map(item => ({
          status: item.status,
          count: item._count.id
        }))
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get stats:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
