// InfoReceiver 测试 API

import { NextRequest, NextResponse } from 'next/server'
import { InfoReceiverTester } from '@/lib/infoReceiver/test'

// POST 方法：运行测试
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'functional', options = {} } = body

    const tester = new InfoReceiverTester()

    switch (testType) {
      case 'functional':
        // 运行功能测试
        const functionalResults = await tester.runAllTests()
        const functionalReport = tester.generateReport(functionalResults)

        return NextResponse.json({
          success: true,
          testType: 'functional',
          report: functionalReport
        })

      case 'performance':
        // 运行性能测试
        const { concurrency = 3, messageCount = 10 } = options
        const performanceResult = await tester.runPerformanceTest(concurrency, messageCount)

        return NextResponse.json({
          success: true,
          testType: 'performance',
          result: performanceResult
        })

      case 'single':
        // 运行单个测试用例
        const { testCaseId } = options
        if (!testCaseId) {
          return NextResponse.json({
            success: false,
            error: '缺少testCaseId参数'
          }, { status: 400 })
        }

        const testCases = tester.getTestCases()
        const testCase = testCases.find(tc => tc.id === testCaseId)
        
        if (!testCase) {
          return NextResponse.json({
            success: false,
            error: '测试用例不存在'
          }, { status: 404 })
        }

        const singleResult = await tester.runTestCase(testCase)

        return NextResponse.json({
          success: true,
          testType: 'single',
          result: singleResult
        })

      default:
        return NextResponse.json({
          success: false,
          error: '不支持的测试类型'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Test API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '测试执行失败'
    }, { status: 500 })
  }
}

// GET 方法：获取测试信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const tester = new InfoReceiverTester()

    switch (action) {
      case 'test-cases':
        // 获取所有测试用例
        const testCases = tester.getTestCases()
        return NextResponse.json({
          success: true,
          data: testCases.map(tc => ({
            id: tc.id,
            name: tc.name,
            description: tc.description,
            source: tc.input.source,
            expectedCategory: tc.expectedOutput.category
          }))
        })

      case 'test-status':
        // 获取测试状态（简化版）
        return NextResponse.json({
          success: true,
          data: {
            available: true,
            testCaseCount: tester.getTestCases().length,
            supportedTypes: ['functional', 'performance', 'single']
          }
        })

      default:
        // 返回测试概览
        return NextResponse.json({
          success: true,
          data: {
            description: 'InfoReceiver 测试系统',
            features: [
              '功能测试 - 验证信息解析准确性',
              '性能测试 - 测试系统处理能力',
              '单元测试 - 测试特定功能模块'
            ],
            testTypes: {
              functional: {
                name: '功能测试',
                description: '测试信息解析的准确性和完整性',
                endpoint: 'POST /api/info-receiver/test',
                body: { testType: 'functional' }
              },
              performance: {
                name: '性能测试',
                description: '测试系统的处理能力和响应时间',
                endpoint: 'POST /api/info-receiver/test',
                body: { 
                  testType: 'performance', 
                  options: { concurrency: 3, messageCount: 10 } 
                }
              },
              single: {
                name: '单个测试',
                description: '运行指定的测试用例',
                endpoint: 'POST /api/info-receiver/test',
                body: { 
                  testType: 'single', 
                  options: { testCaseId: 'exhibition-1' } 
                }
              }
            },
            usage: [
              '1. 获取测试用例列表: GET /api/info-receiver/test?action=test-cases',
              '2. 运行功能测试: POST /api/info-receiver/test {"testType": "functional"}',
              '3. 运行性能测试: POST /api/info-receiver/test {"testType": "performance", "options": {"concurrency": 5}}',
              '4. 运行单个测试: POST /api/info-receiver/test {"testType": "single", "options": {"testCaseId": "exhibition-1"}}'
            ]
          }
        })
    }

  } catch (error) {
    console.error('Test API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取测试信息失败'
    }, { status: 500 })
  }
}
