// 数据库适配器 - 支持平滑升级
import { SubmissionData } from './dataManager'

export interface DatabaseAdapter {
  getAllSubmissions(): Promise<SubmissionData[]>
  addSubmission(submission: Omit<SubmissionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubmissionData>
  updateSubmission(id: string, updates: Partial<SubmissionData>): Promise<SubmissionData | null>
  deleteSubmission(id: string): Promise<boolean>
  searchSubmissions(query: string): Promise<SubmissionData[]>
  getSubmissionsByType(type: SubmissionData['type']): Promise<SubmissionData[]>
  getStatistics(): Promise<any>

  // Data Sources methods
  getDataSources(): Promise<any[]>
  getDataSource(id: string): Promise<any | null>
  createDataSource(dataSource: any): Promise<any>
  updateDataSource(id: string, updates: any): Promise<any>
  deleteDataSource(id: string): Promise<void>

  // Crawl Jobs methods
  createCrawlJob(dataSourceName: string): Promise<string>
  updateCrawlJob(jobId: string, status: string, errorMessage?: string): Promise<void>
  getCrawlJobs(limit?: number): Promise<any[]>
  getDataSourceStats(): Promise<any>
}

// JSON 文件适配器（当前使用）
export class JsonFileAdapter implements DatabaseAdapter {
  private dataManager: any

  constructor() {
    // 使用现有的 DataManager
    const { DataManager } = require('./dataManager')
    this.dataManager = new DataManager()
  }

  async getAllSubmissions(): Promise<SubmissionData[]> {
    return this.dataManager.getAllSubmissions()
  }

  async addSubmission(submission: Omit<SubmissionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubmissionData> {
    return this.dataManager.addSubmission(submission)
  }

  async updateSubmission(id: string, updates: Partial<SubmissionData>): Promise<SubmissionData | null> {
    return this.dataManager.updateSubmission(id, updates)
  }

  async deleteSubmission(id: string): Promise<boolean> {
    return this.dataManager.deleteSubmission(id)
  }

  async searchSubmissions(query: string): Promise<SubmissionData[]> {
    return this.dataManager.searchSubmissions(query)
  }

  async getSubmissionsByType(type: SubmissionData['type']): Promise<SubmissionData[]> {
    return this.dataManager.getSubmissionsByType(type)
  }

  async getStatistics(): Promise<any> {
    return this.dataManager.getStatistics()
  }

  // Data Sources methods
  async getDataSources(): Promise<any[]> {
    // Mock data for now - in real implementation, this would read from a file or database
    return [
      {
        id: '1',
        name: 'FilmFreeway 艺术节',
        url: 'https://filmfreeway.com/festivals',
        type: 'website',
        category: '艺术展览',
        isActive: true,
        crawlFreq: 24,
        itemsFound: 156,
        status: 'completed',
        config: {},
        createdAt: '2025-01-08T10:00:00Z',
        lastCrawled: '2025-01-08T10:30:00Z'
      },
      {
        id: '2',
        name: '中国美术馆展览',
        url: 'http://www.namoc.org',
        type: 'website',
        category: '艺术展览',
        isActive: true,
        crawlFreq: 12,
        itemsFound: 23,
        status: 'completed',
        config: {},
        createdAt: '2025-01-08T09:00:00Z',
        lastCrawled: '2025-01-08T09:15:00Z'
      },
      {
        id: '3',
        name: 'Artsy 展览信息',
        url: 'https://www.artsy.net',
        type: 'api',
        category: '艺术展览',
        isActive: false,
        crawlFreq: 6,
        itemsFound: 0,
        status: 'idle',
        config: {},
        createdAt: '2025-01-08T08:00:00Z',
        lastCrawled: null
      }
    ]
  }

  async getDataSource(id: string): Promise<any | null> {
    const sources = await this.getDataSources()
    return sources.find(source => source.id === id) || null
  }

  async createDataSource(dataSource: any): Promise<any> {
    // TODO: Implement actual file storage
    return dataSource
  }

  async updateDataSource(id: string, updates: any): Promise<any> {
    // TODO: Implement actual file storage
    const source = await this.getDataSource(id)
    return { ...source, ...updates }
  }

  async deleteDataSource(id: string): Promise<void> {
    // TODO: Implement actual file storage
  }

  // Crawl Jobs methods
  async createCrawlJob(dataSourceName: string): Promise<string> {
    // TODO: Implement actual file storage
    return Date.now().toString()
  }

  async updateCrawlJob(jobId: string, status: string, errorMessage?: string): Promise<void> {
    // TODO: Implement actual file storage
  }

  async getCrawlJobs(limit?: number): Promise<any[]> {
    // TODO: Implement actual file storage
    return []
  }

  async getDataSourceStats(): Promise<any> {
    const sources = await this.getDataSources()
    return {
      totalSources: sources.length,
      activeSources: sources.filter(s => s.isActive).length,
      totalJobs: 15,
      successfulJobs: 13,
      totalItemsCollected: sources.reduce((sum, s) => sum + s.itemsFound, 0)
    }
  }
}

// MongoDB 适配器（未来升级选项）
export class MongoDBAdapter implements DatabaseAdapter {
  private client: any
  private db: any
  private collection: any

  constructor(connectionString: string) {
    // MongoDB 连接逻辑
    console.log('MongoDB adapter initialized')
  }

  async getAllSubmissions(): Promise<SubmissionData[]> {
    // return await this.collection.find({}).toArray()
    throw new Error('MongoDB adapter not implemented yet')
  }

  async addSubmission(submission: Omit<SubmissionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubmissionData> {
    // MongoDB 实现
    throw new Error('MongoDB adapter not implemented yet')
  }

  async updateSubmission(id: string, updates: Partial<SubmissionData>): Promise<SubmissionData | null> {
    // MongoDB 实现
    throw new Error('MongoDB adapter not implemented yet')
  }

  async deleteSubmission(id: string): Promise<boolean> {
    // MongoDB 实现
    throw new Error('MongoDB adapter not implemented yet')
  }

  async searchSubmissions(query: string): Promise<SubmissionData[]> {
    // MongoDB 全文搜索
    throw new Error('MongoDB adapter not implemented yet')
  }

  async getSubmissionsByType(type: SubmissionData['type']): Promise<SubmissionData[]> {
    // MongoDB 查询
    throw new Error('MongoDB adapter not implemented yet')
  }

  async getStatistics(): Promise<any> {
    // MongoDB 聚合查询
    throw new Error('MongoDB adapter not implemented yet')
  }

  // Data Sources methods
  async getDataSources(): Promise<any[]> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  async getDataSource(id: string): Promise<any | null> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  async createDataSource(dataSource: any): Promise<any> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  async updateDataSource(id: string, updates: any): Promise<any> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  async deleteDataSource(id: string): Promise<void> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  // Crawl Jobs methods
  async createCrawlJob(dataSourceName: string): Promise<string> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  async updateCrawlJob(jobId: string, status: string, errorMessage?: string): Promise<void> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  async getCrawlJobs(limit?: number): Promise<any[]> {
    throw new Error('MongoDB adapter not implemented yet')
  }

  async getDataSourceStats(): Promise<any> {
    throw new Error('MongoDB adapter not implemented yet')
  }
}

// MySQL 适配器（未来升级选项）
export class MySQLAdapter implements DatabaseAdapter {
  private connection: any

  constructor(config: any) {
    // MySQL 连接逻辑
    console.log('MySQL adapter initialized')
  }

  async getAllSubmissions(): Promise<SubmissionData[]> {
    // MySQL 查询实现
    throw new Error('MySQL adapter not implemented yet')
  }

  async addSubmission(submission: Omit<SubmissionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubmissionData> {
    // MySQL 插入实现
    throw new Error('MySQL adapter not implemented yet')
  }

  async updateSubmission(id: string, updates: Partial<SubmissionData>): Promise<SubmissionData | null> {
    // MySQL 更新实现
    throw new Error('MySQL adapter not implemented yet')
  }

  async deleteSubmission(id: string): Promise<boolean> {
    // MySQL 删除实现
    throw new Error('MySQL adapter not implemented yet')
  }

  async searchSubmissions(query: string): Promise<SubmissionData[]> {
    // MySQL 全文搜索
    throw new Error('MySQL adapter not implemented yet')
  }

  async getSubmissionsByType(type: SubmissionData['type']): Promise<SubmissionData[]> {
    // MySQL 查询
    throw new Error('MySQL adapter not implemented yet')
  }

  async getStatistics(): Promise<any> {
    // MySQL 统计查询
    throw new Error('MySQL adapter not implemented yet')
  }

  // Data Sources methods
  async getDataSources(): Promise<any[]> {
    throw new Error('MySQL adapter not implemented yet')
  }

  async getDataSource(id: string): Promise<any | null> {
    throw new Error('MySQL adapter not implemented yet')
  }

  async createDataSource(dataSource: any): Promise<any> {
    throw new Error('MySQL adapter not implemented yet')
  }

  async updateDataSource(id: string, updates: any): Promise<any> {
    throw new Error('MySQL adapter not implemented yet')
  }

  async deleteDataSource(id: string): Promise<void> {
    throw new Error('MySQL adapter not implemented yet')
  }

  // Crawl Jobs methods
  async createCrawlJob(dataSourceName: string): Promise<string> {
    throw new Error('MySQL adapter not implemented yet')
  }

  async updateCrawlJob(jobId: string, status: string, errorMessage?: string): Promise<void> {
    throw new Error('MySQL adapter not implemented yet')
  }

  async getCrawlJobs(limit?: number): Promise<any[]> {
    throw new Error('MySQL adapter not implemented yet')
  }

  async getDataSourceStats(): Promise<any> {
    throw new Error('MySQL adapter not implemented yet')
  }
}

// 数据库工厂 - 根据配置选择适配器
export class DatabaseFactory {
  static createAdapter(type: 'json' | 'mongodb' | 'mysql', config?: any): DatabaseAdapter {
    switch (type) {
      case 'json':
        return new JsonFileAdapter()
      case 'mongodb':
        return new MongoDBAdapter(config.connectionString)
      case 'mysql':
        return new MySQLAdapter(config)
      default:
        throw new Error(`Unsupported database type: ${type}`)
    }
  }
}

// 使用示例
export function getDatabaseAdapter(): DatabaseAdapter {
  const dbType = process.env.DATABASE_TYPE || 'json'
  
  switch (dbType) {
    case 'mongodb':
      return DatabaseFactory.createAdapter('mongodb', {
        connectionString: process.env.MONGODB_URL
      })
    case 'mysql':
      return DatabaseFactory.createAdapter('mysql', {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
      })
    default:
      return DatabaseFactory.createAdapter('json')
  }
}
