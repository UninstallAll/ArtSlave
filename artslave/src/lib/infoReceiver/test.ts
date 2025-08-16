// InfoReceiver 测试和验证系统

import { InfoReceiverService, createInfoReceiverService } from './infoReceiverService'
import { MessageSource, SubmitMessageRequest } from './types'
import { testInfoReceiverConfig } from './config'

export interface TestCase {
  id: string
  name: string
  description: string
  input: SubmitMessageRequest
  expectedOutput: {
    success: boolean
    category?: string
    confidence?: number
    fields?: string[]
  }
}

export interface TestResult {
  testCase: TestCase
  success: boolean
  actualOutput: any
  errors: string[]
  duration: number
}

export class InfoReceiverTester {
  private service: InfoReceiverService

  constructor() {
    // 创建测试用的服务实例
    this.service = createInfoReceiverService(testInfoReceiverConfig)

  }

  /**
   * 获取预定义的测试用例
   */
  getTestCases(): TestCase[] {
    return [
      {
        id: 'exhibition-1',
        name: '艺术展览信息解析',
        description: '测试解析包含展览信息的文本',
        input: {
          source: MessageSource.WEB,
          content: `
            【征集通知】2024年国际当代艺术展
            
            主办方：北京当代艺术馆
            展览时间：2024年8月15日-10月15日
            申请截止：2024年6月30日
            地点：北京市朝阳区798艺术区
            
            征集要求：
            - 当代艺术作品
            - 作品尺寸不超过2x2米
            - 提交作品图片和艺术家简历
            
            联系方式：curator@bjcam.org
            官网：https://www.bjcam.org/exhibition2024
          `,
          links: ['https://www.bjcam.org/exhibition2024']
        },
        expectedOutput: {
          success: true,
          category: 'EXHIBITION',
          confidence: 0.8,
          fields: ['title', 'organizer', 'deadline', 'location', 'contact']
        }
      },
      {
        id: 'residency-1',
        name: '驻地项目信息解析',
        description: '测试解析驻地项目申请信息',
        input: {
          source: MessageSource.EMAIL,
          content: `
            Artist Residency Program 2024
            
            Location: Banff Centre for Arts and Creativity, Canada
            Duration: 3 months (September - November 2024)
            Application Deadline: March 15, 2024
            
            We provide:
            - Studio space
            - Accommodation
            - Monthly stipend of $2000 CAD
            
            Requirements:
            - Portfolio of recent work
            - Project proposal
            - Two references
            
            Apply at: https://banffcentre.ca/residency
            Contact: residency@banffcentre.ca
          `,
          links: ['https://banffcentre.ca/residency']
        },
        expectedOutput: {
          success: true,
          category: 'RESIDENCY',
          confidence: 0.8,
          fields: ['title', 'location', 'deadline', 'contact', 'requirements']
        }
      },
      {
        id: 'competition-1',
        name: '比赛征集信息解析',
        description: '测试解析艺术比赛征集信息',
        input: {
          source: MessageSource.SOCIAL,
          content: `
            🎨 第五届青年艺术家大赛开始征集！
            
            奖金：一等奖10万元，二等奖5万元，三等奖2万元
            主题：未来城市
            截止时间：2024年7月20日
            参赛要求：35岁以下艺术家
            
            作品形式：绘画、雕塑、装置、影像均可
            提交方式：线上提交 + 邮寄原作
            
            详情查看：www.youngartist.com
            咨询电话：010-12345678
          `,
          links: ['http://www.youngartist.com']
        },
        expectedOutput: {
          success: true,
          category: 'COMPETITION',
          confidence: 0.8,
          fields: ['title', 'deadline', 'prize', 'requirements']
        }
      },
      {
        id: 'grant-1',
        name: '资助项目信息解析',
        description: '测试解析艺术资助项目信息',
        input: {
          source: MessageSource.API,
          content: `
            Arts Council Grant Program 2024
            
            Grant Amount: Up to $50,000
            Project Duration: 12-18 months
            Application Deadline: April 30, 2024
            
            Eligible Projects:
            - Community art projects
            - Public art installations
            - Arts education programs
            
            Application Requirements:
            - Detailed project proposal
            - Budget breakdown
            - Community impact statement
            - Artist CV and portfolio
            
            Submit online: grants.artscouncil.org
            Questions: grants@artscouncil.org
          `,
          links: ['https://grants.artscouncil.org']
        },
        expectedOutput: {
          success: true,
          category: 'GRANT',
          confidence: 0.8,
          fields: ['title', 'deadline', 'fee', 'requirements', 'contact']
        }
      },
      {
        id: 'invalid-1',
        name: '无关内容测试',
        description: '测试过滤无关内容',
        input: {
          source: MessageSource.WEB,
          content: `
            今天天气真好，阳光明媚。
            我去超市买了一些水果和蔬菜。
            晚上准备做一顿丰盛的晚餐。
            
            明天计划去公园散步，呼吸新鲜空气。
            周末可能会和朋友聚会。
          `,
          links: []
        },
        expectedOutput: {
          success: false,
          confidence: 0.1
        }
      }
    ]
  }

  /**
   * 运行单个测试用例
   */
  async runTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let success = false
    let actualOutput: any = null

    try {
      // 提交消息
      const result = await this.service.submitMessage(testCase.input)
      actualOutput = result

      // 等待处理完成（简化版，实际应该轮询状态）
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 验证结果
      if (testCase.expectedOutput.success) {
        if (!result.success) {
          errors.push('期望成功但实际失败')
        } else {
          success = true
          // TODO: 验证具体字段和置信度
        }
      } else {
        if (result.success) {
          errors.push('期望失败但实际成功')
        } else {
          success = true
        }
      }

    } catch (error) {
      errors.push(`执行错误: ${error instanceof Error ? error.message : '未知错误'}`)
      actualOutput = { error: error instanceof Error ? error.message : '未知错误' }
    }

    return {
      testCase,
      success,
      actualOutput,
      errors,
      duration: Date.now() - startTime
    }
  }

  /**
   * 运行所有测试用例
   */
  async runAllTests(): Promise<TestResult[]> {
    const testCases = this.getTestCases()
    const results: TestResult[] = []

    console.log(`开始运行 ${testCases.length} 个测试用例...`)

    for (const testCase of testCases) {
      console.log(`运行测试: ${testCase.name}`)
      const result = await this.runTestCase(testCase)
      results.push(result)
      
      console.log(`测试 ${testCase.name} ${result.success ? '通过' : '失败'}`)
      if (!result.success) {
        console.log(`错误: ${result.errors.join(', ')}`)
      }
    }

    return results
  }

  /**
   * 生成测试报告
   */
  generateReport(results: TestResult[]): {
    summary: {
      total: number
      passed: number
      failed: number
      successRate: number
      totalDuration: number
    }
    details: TestResult[]
    recommendations: string[]
  } {
    const total = results.length
    const passed = results.filter(r => r.success).length
    const failed = total - passed
    const successRate = total > 0 ? passed / total : 0
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    const recommendations: string[] = []

    if (successRate < 0.8) {
      recommendations.push('测试通过率较低，需要检查和优化解析逻辑')
    }

    if (totalDuration > 30000) {
      recommendations.push('测试执行时间较长，考虑优化处理性能')
    }

    const failedTests = results.filter(r => !r.success)
    if (failedTests.length > 0) {
      recommendations.push(`以下测试失败: ${failedTests.map(t => t.testCase.name).join(', ')}`)
    }

    return {
      summary: {
        total,
        passed,
        failed,
        successRate,
        totalDuration
      },
      details: results,
      recommendations
    }
  }

  /**
   * 运行性能测试
   */
  async runPerformanceTest(concurrency = 5, messageCount = 20): Promise<{
    avgResponseTime: number
    maxResponseTime: number
    minResponseTime: number
    successRate: number
    throughput: number
  }> {
    console.log(`开始性能测试: ${concurrency} 并发, ${messageCount} 条消息`)

    const testMessage: SubmitMessageRequest = {
      source: MessageSource.API,
      content: '测试消息：这是一个性能测试消息，用于测试系统的处理能力和响应时间。',
      links: []
    }

    const startTime = Date.now()
    const results: { success: boolean; duration: number }[] = []

    // 分批并发执行
    const batches = Math.ceil(messageCount / concurrency)
    
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, messageCount - batch * concurrency)
      const promises: Promise<{ success: boolean; duration: number }>[] = []

      for (let i = 0; i < batchSize; i++) {
        promises.push(this.measureMessageProcessing(testMessage))
      }

      const batchResults = await Promise.all(promises)
      results.push(...batchResults)
    }

    const totalTime = Date.now() - startTime
    const responseTimes = results.map(r => r.duration)
    const successCount = results.filter(r => r.success).length

    return {
      avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      successRate: successCount / results.length,
      throughput: (results.length / totalTime) * 1000 // 每秒处理数
    }
  }

  /**
   * 测量单个消息处理时间
   */
  private async measureMessageProcessing(message: SubmitMessageRequest): Promise<{ success: boolean; duration: number }> {
    const startTime = Date.now()
    
    try {
      const result = await this.service.submitMessage(message)
      return {
        success: result.success,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime
      }
    }
  }
}

/**
 * 运行完整的测试套件
 */
export async function runFullTestSuite(): Promise<void> {
  const tester = new InfoReceiverTester()

  console.log('=== InfoReceiver 测试套件 ===\n')

  // 1. 功能测试
  console.log('1. 运行功能测试...')
  const functionalResults = await tester.runAllTests()
  const functionalReport = tester.generateReport(functionalResults)

  console.log('\n功能测试结果:')
  console.log(`总计: ${functionalReport.summary.total}`)
  console.log(`通过: ${functionalReport.summary.passed}`)
  console.log(`失败: ${functionalReport.summary.failed}`)
  console.log(`成功率: ${(functionalReport.summary.successRate * 100).toFixed(1)}%`)
  console.log(`总耗时: ${functionalReport.summary.totalDuration}ms`)

  if (functionalReport.recommendations.length > 0) {
    console.log('\n建议:')
    functionalReport.recommendations.forEach(rec => console.log(`- ${rec}`))
  }

  // 2. 性能测试
  console.log('\n2. 运行性能测试...')
  const performanceResult = await tester.runPerformanceTest(3, 10)

  console.log('\n性能测试结果:')
  console.log(`平均响应时间: ${performanceResult.avgResponseTime.toFixed(1)}ms`)
  console.log(`最大响应时间: ${performanceResult.maxResponseTime}ms`)
  console.log(`最小响应时间: ${performanceResult.minResponseTime}ms`)
  console.log(`成功率: ${(performanceResult.successRate * 100).toFixed(1)}%`)
  console.log(`吞吐量: ${performanceResult.throughput.toFixed(2)} 消息/秒`)

  console.log('\n=== 测试完成 ===')
}
