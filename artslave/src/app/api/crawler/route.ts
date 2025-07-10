import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// 爬虫状态管理
const runningCrawlers = new Map<string, any>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    switch (action) {
      case 'list':
        return handleListCrawlers()
      case 'stats':
        return handleGetStats()
      case 'status':
        return handleGetStatus()
      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, crawler } = body
    
    switch (action) {
      case 'run':
        return handleRunCrawler(crawler)
      case 'run-all':
        return handleRunAllCrawlers()
      case 'stop':
        return handleStopCrawler(crawler)
      default:
        return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

async function handleListCrawlers(): Promise<NextResponse> {
  return new Promise((resolve) => {
    const crawlerPath = path.join(process.cwd(), 'crawler', 'crawler_manager.py')
    const pythonProcess = spawn('python', [crawlerPath, 'list'])
    
    let output = ''
    let error = ''
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        // 解析输出，提取爬虫列表
        const crawlers = [
          { name: 'demo', description: '演示爬虫 - 生成模拟数据', status: 'idle' },
          // 可以根据实际输出解析更多爬虫
        ]
        
        resolve(NextResponse.json({ crawlers }))
      } else {
        resolve(NextResponse.json({ error: error || '获取爬虫列表失败' }, { status: 500 }))
      }
    })
  })
}

async function handleRunCrawler(crawlerName: string): Promise<NextResponse> {
  if (!crawlerName) {
    return NextResponse.json({ error: '请指定爬虫名称' }, { status: 400 })
  }
  
  if (runningCrawlers.has(crawlerName)) {
    return NextResponse.json({ error: '爬虫已在运行中' }, { status: 409 })
  }
  
  return new Promise((resolve) => {
    const crawlerPath = path.join(process.cwd(), 'crawler', 'crawler_manager.py')
    const pythonProcess = spawn('python', [crawlerPath, 'run', '--crawler', crawlerName])
    
    // 记录运行中的爬虫
    runningCrawlers.set(crawlerName, {
      process: pythonProcess,
      startTime: new Date(),
      status: 'running'
    })
    
    let output = ''
    let error = ''
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
      console.log(`爬虫 ${crawlerName} 输出:`, data.toString())
    })
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString()
      console.error(`爬虫 ${crawlerName} 错误:`, data.toString())
    })
    
    pythonProcess.on('close', (code) => {
      // 移除运行记录
      runningCrawlers.delete(crawlerName)
      
      if (code === 0) {
        resolve(NextResponse.json({ 
          success: true, 
          message: `爬虫 ${crawlerName} 运行完成`,
          output 
        }))
      } else {
        resolve(NextResponse.json({ 
          error: `爬虫 ${crawlerName} 运行失败`, 
          details: error 
        }, { status: 500 }))
      }
    })
    
    // 立即返回开始运行的响应
    setTimeout(() => {
      resolve(NextResponse.json({ 
        success: true, 
        message: `爬虫 ${crawlerName} 开始运行`,
        status: 'started'
      }))
    }, 100)
  })
}

async function handleRunAllCrawlers(): Promise<NextResponse> {
  return new Promise((resolve) => {
    const crawlerPath = path.join(process.cwd(), 'crawler', 'crawler_manager.py')
    const pythonProcess = spawn('python', [crawlerPath, 'run-all'])
    
    let output = ''
    let error = ''
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
      console.log('全部爬虫输出:', data.toString())
    })
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString()
      console.error('全部爬虫错误:', data.toString())
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ 
          success: true, 
          message: '所有爬虫运行完成',
          output 
        }))
      } else {
        resolve(NextResponse.json({ 
          error: '部分爬虫运行失败', 
          details: error 
        }, { status: 500 }))
      }
    })
  })
}

async function handleStopCrawler(crawlerName: string): Promise<NextResponse> {
  const crawlerInfo = runningCrawlers.get(crawlerName)
  
  if (!crawlerInfo) {
    return NextResponse.json({ error: '爬虫未在运行' }, { status: 404 })
  }
  
  try {
    crawlerInfo.process.kill('SIGTERM')
    runningCrawlers.delete(crawlerName)
    
    return NextResponse.json({ 
      success: true, 
      message: `爬虫 ${crawlerName} 已停止` 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: `停止爬虫 ${crawlerName} 失败` 
    }, { status: 500 })
  }
}

async function handleGetStats(): Promise<NextResponse> {
  return new Promise((resolve) => {
    const crawlerPath = path.join(process.cwd(), 'crawler', 'crawler_manager.py')
    const pythonProcess = spawn('python', [crawlerPath, 'stats'])
    
    let output = ''
    let error = ''
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ stats: output }))
      } else {
        resolve(NextResponse.json({ error: error || '获取统计信息失败' }, { status: 500 }))
      }
    })
  })
}

async function handleGetStatus(): Promise<NextResponse> {
  const status = Array.from(runningCrawlers.entries()).map(([name, info]) => ({
    name,
    status: info.status,
    startTime: info.startTime,
    duration: Date.now() - info.startTime.getTime()
  }))
  
  return NextResponse.json({ runningCrawlers: status })
}
