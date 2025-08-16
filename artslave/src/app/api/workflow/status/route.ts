import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 检查 n8n 服务状态
    const n8nUrl = process.env.N8N_URL || 'http://localhost:5678'

    const endpoints = ['/rest/healthz', '/rest/health', '/rest/workflows?limit=1', '/rest/active']
    let connected = false
    let lastError: string | null = null

    for (const ep of endpoints) {
      try {
        const response = await fetch(`${n8nUrl}${ep}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          connected = true
          break
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
      }
    }
    
    return NextResponse.json({
      success: true,
      connected,
      n8nUrl,
      error: connected ? undefined : lastError,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('n8n status check failed:', error)
    
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
