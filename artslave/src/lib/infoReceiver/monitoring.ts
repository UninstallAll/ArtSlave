// InfoReceiver 监控和告警系统

import { InfoReceiverStats, MessageStatus, ResourceStatus } from './types'
import { InfoReceiverDatabase } from './database'

export interface MonitoringConfig {
  enableMetrics: boolean
  metricsInterval: number
  enableNotifications: boolean
  alertThresholds: {
    errorRate: number
    queueLength: number
    processingLatency: number
    diskUsage: number
    memoryUsage: number
  }
}

export interface SystemMetrics {
  timestamp: Date
  messageStats: {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
  }
  resourceStats: {
    total: number
    verified: number
    pending: number
    rejected: number
    duplicate: number
  }
  performance: {
    avgProcessingTime: number
    successRate: number
    errorRate: number
    queueLength: number
  }
  system: {
    memoryUsage: number
    diskUsage: number
    cpuUsage: number
  }
}

export interface Alert {
  id: string
  type: 'ERROR' | 'WARNING' | 'INFO'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
  metadata?: Record<string, any>
}

export class MonitoringService {
  private config: MonitoringConfig
  private database: InfoReceiverDatabase
  private metricsHistory: SystemMetrics[] = []
  private activeAlerts: Map<string, Alert> = new Map()
  private metricsInterval?: NodeJS.Timeout

  constructor(config: MonitoringConfig) {
    this.config = config
    this.database = new InfoReceiverDatabase()
    
    if (config.enableMetrics) {
      this.startMetricsCollection()
    }
  }

  /**
   * 启动指标收集
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics()
        this.metricsHistory.push(metrics)
        
        // 保留最近24小时的数据
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
        this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoff)
        
        // 检查告警条件
        await this.checkAlerts(metrics)
        
      } catch (error) {
        console.error('Metrics collection failed:', error)
      }
    }, this.config.metricsInterval)
  }

  /**
   * 停止指标收集
   */
  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = undefined
    }
  }

  /**
   * 收集系统指标
   */
  async collectMetrics(): Promise<SystemMetrics> {
    const stats = await this.database.getStats()
    
    // 获取系统资源使用情况
    const systemStats = await this.getSystemStats()
    
    return {
      timestamp: new Date(),
      messageStats: {
        total: stats.totalMessages,
        pending: stats.pendingMessages,
        processing: stats.processingMessages,
        completed: stats.completedMessages,
        failed: stats.failedMessages
      },
      resourceStats: {
        total: stats.totalResources,
        verified: stats.verifiedResources,
        pending: stats.totalResources - stats.verifiedResources - stats.duplicateResources,
        rejected: 0, // TODO: 添加拒绝状态统计
        duplicate: stats.duplicateResources
      },
      performance: {
        avgProcessingTime: stats.averageProcessingTime || 0,
        successRate: stats.successRate,
        errorRate: 1 - stats.successRate,
        queueLength: stats.pendingMessages + stats.processingMessages
      },
      system: systemStats
    }
  }

  /**
   * 获取系统资源统计
   */
  private async getSystemStats(): Promise<{ memoryUsage: number; diskUsage: number; cpuUsage: number }> {
    try {
      // Node.js 环境下获取内存使用情况
      const memUsage = process.memoryUsage()
      const memoryUsage = memUsage.heapUsed / memUsage.heapTotal
      
      // TODO: 实现磁盘和CPU使用率监控
      // 这里返回模拟数据
      return {
        memoryUsage,
        diskUsage: 0.5, // 50%
        cpuUsage: 0.3   // 30%
      }
    } catch (error) {
      console.warn('Failed to get system stats:', error)
      return {
        memoryUsage: 0,
        diskUsage: 0,
        cpuUsage: 0
      }
    }
  }

  /**
   * 检查告警条件
   */
  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    const thresholds = this.config.alertThresholds

    // 检查错误率
    if (metrics.performance.errorRate > thresholds.errorRate) {
      await this.createAlert({
        type: 'ERROR',
        title: '错误率过高',
        message: `当前错误率 ${(metrics.performance.errorRate * 100).toFixed(1)}% 超过阈值 ${(thresholds.errorRate * 100).toFixed(1)}%`,
        metadata: { errorRate: metrics.performance.errorRate }
      })
    }

    // 检查队列长度
    if (metrics.performance.queueLength > thresholds.queueLength) {
      await this.createAlert({
        type: 'WARNING',
        title: '队列积压',
        message: `当前队列长度 ${metrics.performance.queueLength} 超过阈值 ${thresholds.queueLength}`,
        metadata: { queueLength: metrics.performance.queueLength }
      })
    }

    // 检查处理延迟
    if (metrics.performance.avgProcessingTime > thresholds.processingLatency) {
      await this.createAlert({
        type: 'WARNING',
        title: '处理延迟过高',
        message: `平均处理时间 ${metrics.performance.avgProcessingTime}ms 超过阈值 ${thresholds.processingLatency}ms`,
        metadata: { avgProcessingTime: metrics.performance.avgProcessingTime }
      })
    }

    // 检查内存使用率
    if (metrics.system.memoryUsage > thresholds.memoryUsage) {
      await this.createAlert({
        type: 'WARNING',
        title: '内存使用率过高',
        message: `当前内存使用率 ${(metrics.system.memoryUsage * 100).toFixed(1)}% 超过阈值 ${(thresholds.memoryUsage * 100).toFixed(1)}%`,
        metadata: { memoryUsage: metrics.system.memoryUsage }
      })
    }

    // 检查磁盘使用率
    if (metrics.system.diskUsage > thresholds.diskUsage) {
      await this.createAlert({
        type: 'WARNING',
        title: '磁盘使用率过高',
        message: `当前磁盘使用率 ${(metrics.system.diskUsage * 100).toFixed(1)}% 超过阈值 ${(thresholds.diskUsage * 100).toFixed(1)}%`,
        metadata: { diskUsage: metrics.system.diskUsage }
      })
    }
  }

  /**
   * 创建告警
   */
  private async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alertId = `${alertData.type}_${Date.now()}`
    const alert: Alert = {
      id: alertId,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    }

    this.activeAlerts.set(alertId, alert)

    // 发送通知
    if (this.config.enableNotifications) {
      await this.sendNotification(alert)
    }

    console.warn(`Alert created: ${alert.title} - ${alert.message}`)
  }

  /**
   * 发送通知
   */
  private async sendNotification(alert: Alert): Promise<void> {
    try {
      // TODO: 实现具体的通知发送逻辑
      // 可以发送邮件、Slack消息、微信通知等
      
      console.log(`Notification sent for alert: ${alert.title}`)
      
      // 记录通知日志
      await this.database.createNotificationLog({
        type: 'alert',
        recipient: 'admin',
        subject: alert.title,
        content: alert.message,
        status: 'sent',
        metadata: alert.metadata
      })
      
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  /**
   * 解决告警
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.resolved = true
      console.log(`Alert resolved: ${alert.title}`)
    }
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved)
  }

  /**
   * 获取历史指标
   */
  getMetricsHistory(hours = 24): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.metricsHistory.filter(m => m.timestamp > cutoff)
  }

  /**
   * 获取当前指标
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    return await this.collectMetrics()
  }

  /**
   * 生成健康检查报告
   */
  async getHealthReport(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    score: number
    issues: string[]
    recommendations: string[]
  }> {
    const metrics = await this.getCurrentMetrics()
    const activeAlerts = this.getActiveAlerts()
    
    let score = 100
    const issues: string[] = []
    const recommendations: string[] = []

    // 检查错误率
    if (metrics.performance.errorRate > 0.1) {
      score -= 30
      issues.push(`错误率过高: ${(metrics.performance.errorRate * 100).toFixed(1)}%`)
      recommendations.push('检查日志，修复导致错误的问题')
    }

    // 检查队列积压
    if (metrics.performance.queueLength > 50) {
      score -= 20
      issues.push(`队列积压: ${metrics.performance.queueLength} 条消息`)
      recommendations.push('增加处理并发数或优化处理逻辑')
    }

    // 检查资源使用
    if (metrics.system.memoryUsage > 0.8) {
      score -= 15
      issues.push(`内存使用率过高: ${(metrics.system.memoryUsage * 100).toFixed(1)}%`)
      recommendations.push('优化内存使用或增加服务器内存')
    }

    // 检查活跃告警
    if (activeAlerts.length > 0) {
      score -= activeAlerts.length * 5
      issues.push(`${activeAlerts.length} 个未解决的告警`)
      recommendations.push('处理所有活跃告警')
    }

    let status: 'healthy' | 'warning' | 'critical'
    if (score >= 80) {
      status = 'healthy'
    } else if (score >= 60) {
      status = 'warning'
    } else {
      status = 'critical'
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopMetricsCollection()
    this.activeAlerts.clear()
    this.metricsHistory = []
  }
}
