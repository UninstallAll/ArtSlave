import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userType = searchParams.get('userType')

    // 构建查询条件
    const where: any = {}
    if (userType) {
      where.userType = userType
    }

    // 获取用户信息
    const users = await prisma.user.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        experienceLevel: true,
        location: true,
        artFields: true,
        createdAt: true,
        submissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            submissionInfo: {
              select: {
                title: true,
                type: true
              }
            }
          }
        },
        aiMatches: {
          select: {
            id: true,
            matchScore: true,
            isRecommended: true
          }
        }
      }
    })

    // 获取总数
    const total = await prisma.user.count({ where })

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get users:', error)
    
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
    const { email } = body
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: email'
      }, { status: 400 })
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists'
      }, { status: 409 })
    }

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        phone: body.phone,
        userType: body.userType,
        experienceLevel: body.experienceLevel,
        location: body.location,
        languages: body.languages,
        website: body.website,
        socialMedia: body.socialMedia,
        artistStatement: body.artistStatement,
        artFields: body.artFields,
        education: body.education,
        exhibitions: body.exhibitions,
        awards: body.awards
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to create user:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
