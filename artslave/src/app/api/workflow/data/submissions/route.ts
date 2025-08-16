import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    const active = searchParams.get('active')

    // 构建查询条件
    const where: any = {}
    if (type) {
      where.type = type
    }
    if (active !== null) {
      where.isActive = active === 'true'
    }

    // 获取投稿信息
    const submissions = await prisma.submissionInfo.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        userSubmissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true
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
    const total = await prisma.submissionInfo.count({ where })

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get submissions:', error)
    
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
    const { title, type, organizer, deadline } = body
    if (!title || !type || !organizer || !deadline) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, type, organizer, deadline'
      }, { status: 400 })
    }

    // 创建新的投稿信息
    const submission = await prisma.submissionInfo.create({
      data: {
        title,
        description: body.description,
        type,
        organizer,
        deadline: new Date(deadline),
        location: body.location,
        website: body.website,
        email: body.email,
        phone: body.phone,
        fee: body.fee ? parseFloat(body.fee) : null,
        prize: body.prize,
        requirements: body.requirements,
        tags: body.tags,
        isActive: body.isActive !== false
      }
    })

    return NextResponse.json({
      success: true,
      data: submission,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to create submission:', error)
    
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
        error: 'Missing submission ID'
      }, { status: 400 })
    }

    // 处理日期字段
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline)
    }
    
    // 处理数字字段
    if (updateData.fee) {
      updateData.fee = parseFloat(updateData.fee)
    }

    const submission = await prisma.submissionInfo.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: submission,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to update submission:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
