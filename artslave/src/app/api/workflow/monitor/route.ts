import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const n8nUrl = process.env.N8N_URL || 'http://localhost:5678'
    
    // 获取最近的执行记录
    const execResponse = await fetch(`${n8nUrl}/rest/executions?limit=20`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!execResponse.ok) {
      throw new Error(`n8n API error: ${execResponse.status}`)
    }

    const executions = await execResponse.json()
    const executionList = Array.isArray(executions) ? executions : (executions.data || [])
    
    // 获取活跃工作流
    const workflowResponse = await fetch(`${n8nUrl}/rest/workflows?active=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    let activeWorkflows = [] as any[]
    if (workflowResponse.ok) {
      const workflowData = await workflowResponse.json()
      const rawList = Array.isArray(workflowData) ? workflowData : (workflowData.data || [])
      activeWorkflows = rawList.filter((w: any) => w.active)
    }

    // 处理执行记录
    const processedExecutions = executionList.map((execution: any) => ({
      id: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflowData?.name || '未知工作流',
      status: execution.finished ? (execution.stoppedAt ? 'success' : 'error') : 'running',
      startedAt: execution.startedAt,
      stoppedAt: execution.stoppedAt,
      executionTime: execution.executionTime,
      mode: execution.mode
    }))

    // 统计信息
    const stats = {
      totalExecutions: (executions.count ?? processedExecutions.length ?? 0),
      activeWorkflows: activeWorkflows.length,
      runningExecutions: processedExecutions.filter((e: any) => e.status === 'running').length,
      successfulExecutions: processedExecutions.filter((e: any) => e.status === 'success').length,
      failedExecutions: processedExecutions.filter((e: any) => e.status === 'error').length,
      averageExecutionTime: processedExecutions.length > 0 
        ? processedExecutions.reduce((sum: number, e: any) => sum + (e.executionTime || 0), 0) / processedExecutions.length
        : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        executions: processedExecutions,
        activeWorkflows,
        stats
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get workflow monitor data:', error)
    
    // 返回模拟数据
    const mockData = {
      executions: [
        {
          id: 'exec-1',
          workflowId: 'artslave-data-sync',
          workflowName: 'ArtSlave 数据同步',
          status: 'success',
          startedAt: new Date(Date.now() - 300000).toISOString(),
          stoppedAt: new Date(Date.now() - 240000).toISOString(),
          executionTime: 60000,
          mode: 'trigger'
        },
        {
          id: 'exec-2',
          workflowId: 'submission-automation',
          workflowName: '信息投递自动化工作流',
          status: 'running',
          startedAt: new Date(Date.now() - 120000).toISOString(),
          stoppedAt: null,
          executionTime: null,
          mode: 'manual'
        }
      ],
      activeWorkflows: [
        {
          id: 'artslave-data-sync',
          name: 'ArtSlave 数据同步',
          active: true
        },
        {
          id: 'submission-automation',
          name: '信息投递自动化工作流',
          active: true
        }
      ],
      stats: {
        totalExecutions: 25,
        activeWorkflows: 2,
        runningExecutions: 1,
        successfulExecutions: 20,
        failedExecutions: 4,
        averageExecutionTime: 45000
      }
    }

    return NextResponse.json({
      success: false,
      data: mockData,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

// 获取特定工作流的执行历史
export async function POST(request: NextRequest) {
  try {
    const { workflowId, limit = 10 } = await request.json()
    
    if (!workflowId) {
      return NextResponse.json({
        success: false,
        error: 'Missing workflowId'
      }, { status: 400 })
    }

    const n8nUrl = process.env.N8N_URL || 'http://localhost:5678'
    
    const response = await fetch(
      `${n8nUrl}/rest/executions?filter={"workflowId":"${workflowId}"}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      }
    )

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`)
    }

    const executions = await response.json()
    const execList = Array.isArray(executions) ? executions : (executions.data || [])
    
    const processedExecutions = execList.map((execution: any) => ({
      id: execution.id,
      status: execution.finished ? (execution.stoppedAt ? 'success' : 'error') : 'running',
      startedAt: execution.startedAt,
      stoppedAt: execution.stoppedAt,
      executionTime: execution.executionTime,
      mode: execution.mode,
      data: execution.data
    }))

    return NextResponse.json({
      success: true,
      data: {
        workflowId,
        executions: processedExecutions,
        total: (executions.count ?? processedExecutions.length ?? 0)
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get workflow execution history:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
