const os = require('os')
const fs = require('fs')
const path = require('path')

class SystemMonitor {
  constructor() {
    this.startTime = Date.now()
  }

  // 获取系统信息
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: this.formatBytes(os.totalmem()),
      freeMemory: this.formatBytes(os.freemem()),
      uptime: this.formatUptime(os.uptime())
    }
  }

  // 获取内存使用情况
  getMemoryUsage() {
    const total = os.totalmem()
    const free = os.freemem()
    const used = total - free
    const usagePercent = ((used / total) * 100).toFixed(2)

    return {
      total: this.formatBytes(total),
      used: this.formatBytes(used),
      free: this.formatBytes(free),
      usagePercent: `${usagePercent}%`
    }
  }

  // 获取 CPU 使用情况
  getCPUUsage() {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type]
      }
      totalIdle += cpu.times.idle
    })

    const idle = totalIdle / cpus.length
    const total = totalTick / cpus.length
    const usage = 100 - ~~(100 * idle / total)

    return {
      cores: cpus.length,
      model: cpus[0].model,
      usage: `${usage}%`
    }
  }

  // 获取磁盘使用情况
  getDiskUsage() {
    try {
      const stats = fs.statSync(process.cwd())
      return {
        path: process.cwd(),
        // 注意：Node.js 无法直接获取磁盘空间，这里只是示例
        message: '磁盘信息需要系统级命令获取'
      }
    } catch (error) {
      return { error: '无法获取磁盘信息' }
    }
  }

  // 检查 SQLite 性能要求
  checkSQLiteRequirements() {
    const memory = os.totalmem()
    const cpus = os.cpus().length
    
    const requirements = {
      minimumMemory: 512 * 1024 * 1024, // 512MB
      recommendedMemory: 1024 * 1024 * 1024, // 1GB
      minimumCPU: 1
    }

    const analysis = {
      memoryStatus: memory >= requirements.recommendedMemory ? '✅ 充足' : 
                   memory >= requirements.minimumMemory ? '⚠️ 基本满足' : '❌ 不足',
      cpuStatus: cpus >= requirements.minimumCPU ? '✅ 满足' : '❌ 不足',
      overallStatus: memory >= requirements.minimumMemory && cpus >= requirements.minimumCPU ? 
                    '✅ 适合运行 SQLite' : '❌ 建议升级硬件'
    }

    return {
      current: {
        memory: this.formatBytes(memory),
        cpus: cpus
      },
      requirements: {
        minimumMemory: this.formatBytes(requirements.minimumMemory),
        recommendedMemory: this.formatBytes(requirements.recommendedMemory),
        minimumCPU: requirements.minimumCPU
      },
      analysis
    }
  }

  // 估算数据库性能
  estimatePerformance(recordCount) {
    const memory = os.totalmem()
    const cpus = os.cpus().length

    // 基于硬件配置估算性能
    let performanceLevel = 'low'
    if (memory >= 2 * 1024 * 1024 * 1024 && cpus >= 2) {
      performanceLevel = 'high'
    } else if (memory >= 1024 * 1024 * 1024 && cpus >= 1) {
      performanceLevel = 'medium'
    }

    const estimates = {
      low: {
        searchTime: Math.ceil(recordCount / 1000) * 10,
        insertTime: Math.ceil(recordCount / 10000) * 5,
        maxRecommended: 5000
      },
      medium: {
        searchTime: Math.ceil(recordCount / 2000) * 10,
        insertTime: Math.ceil(recordCount / 20000) * 5,
        maxRecommended: 20000
      },
      high: {
        searchTime: Math.ceil(recordCount / 5000) * 10,
        insertTime: Math.ceil(recordCount / 50000) * 5,
        maxRecommended: 100000
      }
    }

    const estimate = estimates[performanceLevel]
    
    return {
      performanceLevel,
      recordCount,
      estimatedSearchTime: `${estimate.searchTime}ms`,
      estimatedInsertTime: `${estimate.insertTime}ms`,
      maxRecommendedRecords: estimate.maxRecommended,
      recommendation: recordCount <= estimate.maxRecommended ? 
        '✅ 当前数据量适合' : '⚠️ 建议考虑优化或升级'
    }
  }

  // 格式化字节
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化运行时间
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}天 ${hours}小时 ${minutes}分钟`
  }

  // 生成完整报告
  generateReport(expectedRecords = 1000) {
    const systemInfo = this.getSystemInfo()
    const memoryUsage = this.getMemoryUsage()
    const cpuUsage = this.getCPUUsage()
    const sqliteCheck = this.checkSQLiteRequirements()
    const performance = this.estimatePerformance(expectedRecords)

    return {
      timestamp: new Date().toISOString(),
      system: systemInfo,
      memory: memoryUsage,
      cpu: cpuUsage,
      sqliteCompatibility: sqliteCheck,
      performanceEstimate: performance
    }
  }
}

// 命令行使用
if (require.main === module) {
  const monitor = new SystemMonitor()
  const report = monitor.generateReport(5000) // 假设 5000 条记录

  console.log('🖥️  ArtSlave 系统性能报告')
  console.log('=' * 50)
  
  console.log('\n📊 系统信息:')
  console.log(`   平台: ${report.system.platform}`)
  console.log(`   架构: ${report.system.arch}`)
  console.log(`   CPU 核心: ${report.system.cpus}`)
  console.log(`   总内存: ${report.system.totalMemory}`)
  
  console.log('\n💾 内存使用:')
  console.log(`   已使用: ${report.memory.used} (${report.memory.usagePercent})`)
  console.log(`   可用: ${report.memory.free}`)
  
  console.log('\n🔧 SQLite 兼容性检查:')
  console.log(`   内存状态: ${report.sqliteCompatibility.analysis.memoryStatus}`)
  console.log(`   CPU 状态: ${report.sqliteCompatibility.analysis.cpuStatus}`)
  console.log(`   总体评估: ${report.sqliteCompatibility.analysis.overallStatus}`)
  
  console.log('\n⚡ 性能估算 (5000条记录):')
  console.log(`   性能等级: ${report.performanceEstimate.performanceLevel}`)
  console.log(`   搜索时间: ${report.performanceEstimate.estimatedSearchTime}`)
  console.log(`   插入时间: ${report.performanceEstimate.estimatedInsertTime}`)
  console.log(`   建议: ${report.performanceEstimate.recommendation}`)
}

module.exports = SystemMonitor
