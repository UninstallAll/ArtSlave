import { NextRequest, NextResponse } from 'next/server'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'

// n8n 进程状态管理
let n8nProcess: ChildProcess | null = null
let n8nStatus = {
  running: false,
  startTime: null as Date | null,
  port: 5678,
  url: 'http://localhost:5678',
  error: null as string | null,
  pid: null as number | null
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
      case 'workflows':
        return handleGetWorkflows()
      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('n8n API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    switch (action) {
      case 'start':
        return handleStartN8n()
      case 'stop':
        return handleStopN8n()
      case 'restart':
        return handleRestartN8n()
      case 'install':
        // npx 会自动下载 n8n，所以不需要单独安装
        return NextResponse.json({
          success: true,
          message: 'n8n 将在首次启动时自动下载',
          info: 'npx 会自动处理 n8n 的下载和运行'
        })
      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('n8n API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

async function handleGetStatus(): Promise<NextResponse> {
  const uptime = n8nStatus.startTime 
    ? Date.now() - n8nStatus.startTime.getTime()
    : 0

  return NextResponse.json({
    status: n8nStatus,
    uptime: uptime,
    uptimeFormatted: formatUptime(uptime),
    isInstalled: await checkN8nInstalled()
  })
}

async function handleGetLogs(): Promise<NextResponse> {
  return new Promise((resolve) => {
    const logPath = path.join(process.cwd(), 'n8n', 'n8n.log')
    
    try {
      if (fs.existsSync(logPath)) {
        const logs = fs.readFileSync(logPath, 'utf8')
        const logLines = logs.split('\n').slice(-100) // 最近100行
        resolve(NextResponse.json({ logs: logLines }))
      } else {
        resolve(NextResponse.json({ logs: ['n8n 日志文件不存在'] }))
      }
    } catch (error) {
      resolve(NextResponse.json({ 
        error: '读取日志失败', 
        details: error 
      }, { status: 500 }))
    }
  })
}

async function handleGetWorkflows(): Promise<NextResponse> {
  try {
    // 检查 n8n 是否运行
    if (!n8nStatus.running) {
      return NextResponse.json({
        error: 'n8n 未运行',
        workflows: []
      }, { status: 503 })
    }

    // 尝试从 n8n API 获取工作流列表
    const response = await fetch(`${n8nStatus.url}/rest/workflows`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      const workflows = Array.isArray(data) ? data : (data.data || [])
      return NextResponse.json({ workflows })
    } else {
      return NextResponse.json({
        error: '无法获取工作流列表',
        workflows: []
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      error: '获取工作流失败',
      details: error instanceof Error ? error.message : '未知错误',
      workflows: []
    }, { status: 500 })
  }
}

async function handleStartN8n(): Promise<NextResponse> {
  if (n8nProcess && !n8nProcess.killed) {
    return NextResponse.json({ 
      error: 'n8n 已在运行中' 
    }, { status: 409 })
  }

  return new Promise((resolve) => {
    try {
      // 使用快速启动脚本（检查已安装版本）
      const scriptPath = path.join(process.cwd(), 'scripts', 'n8n-quick-start.ps1')

      console.log('使用 PowerShell 脚本启动 n8n:', scriptPath)

      // 在新的 PowerShell 窗口中启动脚本
      n8nProcess = spawn('powershell', ['-Command', `Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', '${scriptPath}'`], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd()
      })

      n8nStatus = {
        running: true,
        startTime: new Date(),
        port: 5678,
        url: 'http://localhost:5678',
        error: null,
        pid: n8nProcess.pid || null
      }

      n8nProcess.on('close', (code: number) => {
        console.log(`启动脚本执行完成，代码: ${code}`)
      })

      n8nProcess.on('error', (error: Error) => {
        console.error('启动脚本执行失败:', error)
        n8nStatus.running = false
        n8nStatus.error = error.message
        n8nStatus.pid = null
        resolve(NextResponse.json({
          error: '启动脚本执行失败',
          details: error.message,
          suggestion: '请手动运行 scripts/start-n8n.bat'
        }, { status: 500 }))
      })

      // 立即返回成功，因为脚本会在新窗口中运行
      resolve(NextResponse.json({
        success: true,
        message: 'n8n 启动脚本已执行，请查看新打开的命令行窗口',
        status: n8nStatus,
        url: n8nStatus.url,
        info: '脚本正在新窗口中运行，请等待 n8n 启动完成'
      }))





    } catch (error) {
      n8nStatus.running = false
      n8nStatus.error = (error as Error).message
      resolve(NextResponse.json({ 
        error: '启动 n8n 失败', 
        details: error 
      }, { status: 500 }))
    }
  })
}

async function handleStopN8n(): Promise<NextResponse> {
  if (!n8nProcess || n8nProcess.killed) {
    return NextResponse.json({ 
      error: 'n8n 未在运行' 
    }, { status: 404 })
  }

  try {
    n8nProcess.kill('SIGTERM')
    
    // 等待进程结束
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (n8nProcess && !n8nProcess.killed) {
          n8nProcess.kill('SIGKILL') // 强制杀死
        }
        resolve(void 0)
      }, 10000) // 等待10秒

      n8nProcess?.on('close', () => {
        clearTimeout(timeout)
        resolve(void 0)
      })
    })

    n8nStatus.running = false
    n8nStatus.pid = null
    n8nProcess = null

    return NextResponse.json({ 
      success: true, 
      message: 'n8n 已停止' 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: '停止 n8n 失败', 
      details: error 
    }, { status: 500 })
  }
}

async function handleRestartN8n(): Promise<NextResponse> {
  try {
    // 先停止
    if (n8nProcess && !n8nProcess.killed) {
      await handleStopN8n()
      // 等待一下确保完全停止
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 再启动
    return await handleStartN8n()
  } catch (error) {
    return NextResponse.json({ 
      error: '重启 n8n 失败', 
      details: error 
    }, { status: 500 })
  }
}

async function handleInstallN8n(): Promise<NextResponse> {
  return new Promise((resolve) => {
    // 尝试多种安装方式
    const installMethods = [
      // 方法1: 使用 npx（推荐）
      () => spawn('npm', ['install', '-g', 'n8n'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      }),
      // 方法2: 本地安装到项目
      () => spawn('npm', ['install', 'n8n'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd()
      })
    ]

    let currentMethod = 0

    function tryInstall() {
      if (currentMethod >= installMethods.length) {
        resolve(NextResponse.json({
          error: 'n8n 安装失败 - 已尝试所有安装方法',
          details: '请手动运行: npm install -g n8n',
          manualInstall: true
        }, { status: 500 }))
        return
      }

      const installProcess = installMethods[currentMethod]()
      let output = ''
      let errorOutput = ''

      installProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString()
        console.log(`n8n 安装输出 (方法${currentMethod + 1}):`, data.toString())
      })

      installProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString()
        console.error(`n8n 安装错误 (方法${currentMethod + 1}):`, data.toString())
      })

      installProcess.on('close', (code: number) => {
        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: `n8n 安装成功 (使用方法${currentMethod + 1})`,
            output: output,
            method: currentMethod + 1
          }))
        } else {
          console.log(`安装方法${currentMethod + 1}失败，尝试下一种方法...`)
          currentMethod++
          tryInstall()
        }
      })

      installProcess.on('error', (error: Error) => {
        console.error(`安装方法${currentMethod + 1}出错:`, error)
        currentMethod++
        tryInstall()
      })
    }

    tryInstall()
  })
}

async function checkN8nInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    // npx 总是可用的，因为它会自动下载 n8n
    // 我们只需要检查 npm 是否可用
    const checkProcess = spawn('npm', ['--version'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    })

    checkProcess.on('close', (code: number) => {
      // 如果 npm 可用，我们就认为 n8n 可以通过 npx 运行
      resolve(code === 0)
    })

    checkProcess.on('error', () => {
      resolve(false)
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
