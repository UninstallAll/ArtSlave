import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const n8nUrl = process.env.N8N_URL || 'http://localhost:5678'
    
    // 获取所有工作流
    const response = await fetch(`${n8nUrl}/rest/workflows`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`)
    }

    const workflows = await response.json()
    const workflowList = Array.isArray(workflows) ? workflows : (workflows.data || [])
    
    // 获取工作流执行状态
    const workflowsWithStatus = await Promise.all(
      workflowList?.map(async (workflow: any) => {
        try {
          // 获取最近的执行记录
          const execResponse = await fetch(
            `${n8nUrl}/rest/executions?filter={"workflowId":"${workflow.id}"}&limit=1`,
            {
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000)
            }
          )
          
          let lastExecution = null
          let executionCount = 0
          
          if (execResponse.ok) {
            const execData = await execResponse.json()
            const execList = Array.isArray(execData) ? execData : (execData.data || [])
            lastExecution = execList?.[0]
            executionCount = (execData.count ?? execList?.length ?? 0)
          }

          const tags = Array.isArray(workflow.tags)
            ? workflow.tags.map((t: any) => (typeof t === 'string' ? t : (t?.name ?? ''))).filter(Boolean)
            : []

          return {
            id: workflow.id,
            name: workflow.name || '未命名工作流',
            status: workflow.active ? 'running' : 'stopped',
            lastRun: lastExecution?.startedAt,
            nextRun: null, // n8n 不直接提供下次运行时间
            executions: executionCount,
            description: tags.length ? tags.join(', ') : (workflow.notes || '无描述')
          }
        } catch (error) {
          console.error(`Error getting status for workflow ${workflow.id}:`, error)
          return {
            id: workflow.id,
            name: workflow.name || '未命名工作流',
            status: 'error',
            lastRun: null,
            nextRun: null,
            executions: 0,
            description: '状态获取失败'
          }
        }
      }) || []
    )

    return NextResponse.json({
      success: true,
      workflows: workflowsWithStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get workflows:', error)
    
    // 返回模拟数据以便开发测试
    const mockWorkflows = [
      {
        id: 'artslave-data-sync',
        name: 'ArtSlave 数据同步',
        status: 'idle',
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        nextRun: null,
        executions: 15,
        description: '同步投稿信息到数据库'
      },
      {
        id: 'auto-submission',
        name: '自动投稿工作流',
        status: 'stopped',
        lastRun: new Date(Date.now() - 7200000).toISOString(),
        nextRun: null,
        executions: 8,
        description: '自动化投稿流程'
      },
      {
        id: 'notification-sender',
        name: '通知发送器',
        status: 'running',
        lastRun: new Date(Date.now() - 300000).toISOString(),
        nextRun: null,
        executions: 42,
        description: '发送投稿状态通知'
      }
    ]

    return NextResponse.json({
      success: false,
      workflows: mockWorkflows,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
