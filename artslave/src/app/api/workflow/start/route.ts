import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // 检查 n8n 是否已经在运行
    const n8nUrl = process.env.N8N_URL || 'http://localhost:5678'
    
    try {
      const response = await fetch(`${n8nUrl}/rest/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'n8n 已经在运行',
          url: n8nUrl,
          alreadyRunning: true
        })
      }
    } catch (error) {
      // n8n 未运行，继续启动流程
    }

    // 启动 n8n
    const projectRoot = path.join(process.cwd())
    
    // 使用 npx 启动 n8n（推荐方法）
    const n8nProcess = spawn('npx', ['n8n@latest', 'start'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        N8N_HOST: '0.0.0.0',
        N8N_PORT: '5678',
        N8N_PROTOCOL: 'http',
        WEBHOOK_URL: 'http://localhost:5678',
        N8N_BASIC_AUTH_ACTIVE: 'false',
        N8N_DISABLE_UI: 'false',
        N8N_METRICS: 'true',
        N8N_LOG_LEVEL: 'info',
        N8N_USER_FOLDER: path.join(projectRoot, 'n8n'),
        DB_TYPE: 'sqlite',
        DB_SQLITE_DATABASE: path.join(projectRoot, 'n8n', 'database.sqlite'),
        EXECUTIONS_PROCESS: 'main',
        EXECUTIONS_MODE: 'regular',
        N8N_DEFAULT_LOCALE: 'zh-CN'
      },
      detached: true,
      stdio: 'ignore'
    })

    // 分离进程，让它在后台运行
    n8nProcess.unref()

    // 等待一段时间让 n8n 启动
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 检查启动是否成功
    let startupSuccess = false
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts && !startupSuccess) {
      try {
        const response = await fetch(`${n8nUrl}/rest/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        
        if (response.ok) {
          startupSuccess = true
          break
        }
      } catch (error) {
        // 继续等待
      }
      
      attempts++
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    if (startupSuccess) {
      return NextResponse.json({
        success: true,
        message: 'n8n 启动成功',
        url: n8nUrl,
        pid: n8nProcess.pid,
        alreadyRunning: false
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'n8n 启动超时，请手动检查',
        url: n8nUrl,
        suggestion: '请在命令行中运行: npx n8n@latest start'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('启动 n8n 失败:', error)
    
    return NextResponse.json({
      success: false,
      message: '启动 n8n 失败',
      error: error instanceof Error ? error.message : String(error),
      suggestion: '请手动在命令行中运行: npx n8n@latest start'
    }, { status: 500 })
  }
}
