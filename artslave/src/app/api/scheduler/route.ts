import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// 调度器状态管理
let schedulerProcess: any = null
let schedulerStatus = {
  running: false,
  startTime: null as Date | null,
  lastCheck: null as Date | null,
  error: null as string | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    switch (action) {
      case 'status':
        return handleGetStatus()
      case 'logs':
        return handleGetLogs()
      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('调度器API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'start':
        return handleStartScheduler()
      case 'stop':
        return handleStopScheduler()
      case 'restart':
        return handleRestartScheduler()
      case 'force-check':
        return handleForceCheck()
      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('调度器API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

async function handleGetStatus(): Promise<NextResponse> {
  const uptime = schedulerStatus.startTime 
    ? Date.now() - schedulerStatus.startTime.getTime()
    : 0

  return NextResponse.json({
    status: schedulerStatus,
    uptime: uptime,
    uptimeFormatted: formatUptime(uptime)
  })
}

async function handleGetLogs(): Promise<NextResponse> {
  return new Promise((resolve) => {
    const logPath = path.join(process.cwd(), 'crawler', 'crawler_scheduler.log')
    const fs = require('fs')
    
    try {
      if (fs.existsSync(logPath)) {
        const logs = fs.readFileSync(logPath, 'utf8')
        const logLines = logs.split('\n').slice(-100) // 最近100行
        resolve(NextResponse.json({ logs: logLines }))
      } else {
        resolve(NextResponse.json({ logs: ['日志文件不存在'] }))
      }
    } catch (error) {
      resolve(NextResponse.json({ 
        error: '读取日志失败', 
        details: error 
      }, { status: 500 }))
    }
  })
}

async function handleStartScheduler(): Promise<NextResponse> {
  if (schedulerProcess && !schedulerProcess.killed) {
    return NextResponse.json({ 
      error: '调度器已在运行中' 
    }, { status: 409 })
  }

  return new Promise((resolve) => {
    const schedulerPath = path.join(process.cwd(), 'crawler', 'scheduler.py')
    
    try {
      schedulerProcess = spawn('python', [schedulerPath], {
        cwd: path.join(process.cwd(), 'crawler'),
        stdio: ['pipe', 'pipe', 'pipe']
      })

      schedulerStatus = {
        running: true,
        startTime: new Date(),
        lastCheck: new Date(),
        error: null
      }

      let output = ''
      let errorOutput = ''

      schedulerProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString()
        console.log('调度器输出:', data.toString())
        schedulerStatus.lastCheck = new Date()
      })

      schedulerProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
        console.error('调度器错误:', data.toString())
      })

      schedulerProcess.on('close', (code: number) => {
        schedulerStatus.running = false
        if (code !== 0) {
          schedulerStatus.error = `调度器异常退出，代码: ${code}`
          console.error('调度器异常退出:', code, errorOutput)
        }
      })

      schedulerProcess.on('error', (error: Error) => {
        schedulerStatus.running = false
        schedulerStatus.error = error.message
        console.error('调度器启动失败:', error)
      })

      // 等待一下确保启动成功
      setTimeout(() => {
        if (schedulerProcess && !schedulerProcess.killed) {
          resolve(NextResponse.json({ 
            success: true, 
            message: '调度器启动成功',
            status: schedulerStatus
          }))
        } else {
          resolve(NextResponse.json({ 
            error: '调度器启动失败',
            details: errorOutput
          }, { status: 500 }))
        }
      }, 2000)

    } catch (error) {
      schedulerStatus.running = false
      schedulerStatus.error = (error as Error).message
      resolve(NextResponse.json({ 
        error: '启动调度器失败', 
        details: error 
      }, { status: 500 }))
    }
  })
}

async function handleStopScheduler(): Promise<NextResponse> {
  if (!schedulerProcess || schedulerProcess.killed) {
    return NextResponse.json({ 
      error: '调度器未在运行' 
    }, { status: 404 })
  }

  try {
    schedulerProcess.kill('SIGTERM')
    
    // 等待进程结束
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (schedulerProcess && !schedulerProcess.killed) {
          schedulerProcess.kill('SIGKILL') // 强制杀死
        }
        resolve(void 0)
      }, 5000)

      schedulerProcess.on('close', () => {
        clearTimeout(timeout)
        resolve(void 0)
      })
    })

    schedulerStatus.running = false
    schedulerProcess = null

    return NextResponse.json({ 
      success: true, 
      message: '调度器已停止' 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: '停止调度器失败', 
      details: error 
    }, { status: 500 })
  }
}

async function handleRestartScheduler(): Promise<NextResponse> {
  try {
    // 先停止
    if (schedulerProcess && !schedulerProcess.killed) {
      await handleStopScheduler()
      // 等待一下确保完全停止
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 再启动
    return await handleStartScheduler()
  } catch (error) {
    return NextResponse.json({ 
      error: '重启调度器失败', 
      details: error 
    }, { status: 500 })
  }
}

async function handleForceCheck(): Promise<NextResponse> {
  return new Promise((resolve) => {
    const crawlerPath = path.join(process.cwd(), 'crawler', 'crawler_manager.py')
    const checkProcess = spawn('python', [crawlerPath, 'run-all'], {
      cwd: path.join(process.cwd(), 'crawler')
    })

    let output = ''
    let errorOutput = ''

    checkProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })

    checkProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString()
    })

    checkProcess.on('close', (code: number) => {
      if (code === 0) {
        resolve(NextResponse.json({ 
          success: true, 
          message: '强制检查完成',
          output: output
        }))
      } else {
        resolve(NextResponse.json({ 
          error: '强制检查失败', 
          details: errorOutput 
        }, { status: 500 }))
      }
    })
  })
}

function formatUptime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}
