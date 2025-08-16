import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let workflowId: string | null = null
  try {
    const { id } = await context.params
    workflowId = id
    const n8nUrl = process.env.N8N_URL || 'http://localhost:5678'
    
    // 通过 n8n REST API 触发一次性执行
    const response = await fetch(`${n8nUrl}/rest/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workflowId }),
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      workflowId,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error(`Failed to execute workflow ${workflowId ?? 'unknown'}:`, error)
    
    return NextResponse.json({
      success: false,
      workflowId: workflowId ?? undefined,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
