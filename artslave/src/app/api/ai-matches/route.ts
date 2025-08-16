import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const recommended = searchParams.get('recommended')

    // 构建查询条件
    const where: any = {}
    if (userId) {
      where.userId = userId
    }
    if (recommended !== null) {
      where.isRecommended = recommended === 'true'
    }

    // 获取AI匹配记录
    const matches = await prisma.aIMatch.findMany({
      where,
      take: limit,
      orderBy: {
        matchScore: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userType: true
          }
        },
        submissionInfo: {
          select: {
            id: true,
            title: true,
            type: true,
            organizer: true,
            deadline: true,
            location: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: matches,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get AI matches:', error)
    
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
    const { userId, submissionInfoId, matchScore } = body
    if (!userId || !submissionInfoId || matchScore === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, submissionInfoId, matchScore'
      }, { status: 400 })
    }

    // 检查是否已存在匹配记录
    const existingMatch = await prisma.aIMatch.findUnique({
      where: {
        userId_submissionInfoId: {
          userId,
          submissionInfoId
        }
      }
    })

    let match
    if (existingMatch) {
      // 更新现有记录
      match = await prisma.aIMatch.update({
        where: {
          userId_submissionInfoId: {
            userId,
            submissionInfoId
          }
        },
        data: {
          matchScore,
          reasons: body.reasons,
          isRecommended: body.isRecommended || false,
          isViewed: false // 重置查看状态
        }
      })
    } else {
      // 创建新记录
      match = await prisma.aIMatch.create({
        data: {
          userId,
          submissionInfoId,
          matchScore,
          reasons: body.reasons,
          isRecommended: body.isRecommended || false,
          isViewed: false,
          isApplied: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: match,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to create/update AI match:', error)
    
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
    const { userId, submissionInfoId, ...updateData } = body
    
    if (!userId || !submissionInfoId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId or submissionInfoId'
      }, { status: 400 })
    }

    const match = await prisma.aIMatch.update({
      where: {
        userId_submissionInfoId: {
          userId,
          submissionInfoId
        }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: match,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to update AI match:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
