import fs from 'fs'
import path from 'path'

export interface SubmissionData {
  id: string
  title: string
  type: 'EXHIBITION' | 'RESIDENCY' | 'COMPETITION' | 'GRANT' | 'CONFERENCE'
  organizer: string
  location: string
  country: string
  deadline: string
  eventDate?: string
  fee?: number
  prize?: string
  yearsRunning: number
  description: string
  website: string
  tags: string[]
  isGold?: boolean
  isFeatured?: boolean
  rating?: number
  applicants?: number
  createdAt: string
  updatedAt: string
}

export class DataManager {
  private dataDir: string
  private submissionsFile: string

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data')
    this.submissionsFile = path.join(this.dataDir, 'submissions.json')
    this.ensureDataDirectory()
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }

  private loadSubmissions(): SubmissionData[] {
    try {
      if (fs.existsSync(this.submissionsFile)) {
        const data = fs.readFileSync(this.submissionsFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
    return []
  }

  private saveSubmissions(submissions: SubmissionData[]) {
    try {
      fs.writeFileSync(this.submissionsFile, JSON.stringify(submissions, null, 2))
    } catch (error) {
      console.error('Error saving submissions:', error)
      throw error
    }
  }

  // 获取所有投稿信息
  getAllSubmissions(): SubmissionData[] {
    return this.loadSubmissions()
  }

  // 添加新的投稿信息
  addSubmission(submission: Omit<SubmissionData, 'id' | 'createdAt' | 'updatedAt'>): SubmissionData {
    const submissions = this.loadSubmissions()
    const now = new Date().toISOString()
    
    const newSubmission: SubmissionData = {
      ...submission,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    }

    submissions.push(newSubmission)
    this.saveSubmissions(submissions)
    
    return newSubmission
  }

  // 更新投稿信息
  updateSubmission(id: string, updates: Partial<SubmissionData>): SubmissionData | null {
    const submissions = this.loadSubmissions()
    const index = submissions.findIndex(s => s.id === id)
    
    if (index === -1) {
      return null
    }

    submissions[index] = {
      ...submissions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.saveSubmissions(submissions)
    return submissions[index]
  }

  // 删除投稿信息
  deleteSubmission(id: string): boolean {
    const submissions = this.loadSubmissions()
    const index = submissions.findIndex(s => s.id === id)
    
    if (index === -1) {
      return false
    }

    submissions.splice(index, 1)
    this.saveSubmissions(submissions)
    return true
  }

  // 搜索投稿信息
  searchSubmissions(query: string): SubmissionData[] {
    const submissions = this.loadSubmissions()
    const lowerQuery = query.toLowerCase()
    
    return submissions.filter(submission =>
      submission.title.toLowerCase().includes(lowerQuery) ||
      submission.organizer.toLowerCase().includes(lowerQuery) ||
      submission.description.toLowerCase().includes(lowerQuery) ||
      submission.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // 按类型筛选
  getSubmissionsByType(type: SubmissionData['type']): SubmissionData[] {
    const submissions = this.loadSubmissions()
    return submissions.filter(submission => submission.type === type)
  }

  // 按国家筛选
  getSubmissionsByCountry(country: string): SubmissionData[] {
    const submissions = this.loadSubmissions()
    return submissions.filter(submission => submission.country === country)
  }

  // 获取即将截止的投稿
  getUpcomingDeadlines(days: number = 30): SubmissionData[] {
    const submissions = this.loadSubmissions()
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return submissions.filter(submission => {
      const deadline = new Date(submission.deadline)
      return deadline >= now && deadline <= futureDate
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  }

  // 获取统计信息
  getStatistics() {
    const submissions = this.loadSubmissions()
    
    const typeCount = submissions.reduce((acc, submission) => {
      acc[submission.type] = (acc[submission.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const countryCount = submissions.reduce((acc, submission) => {
      acc[submission.country] = (acc[submission.country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: submissions.length,
      byType: typeCount,
      byCountry: countryCount,
      featured: submissions.filter(s => s.isFeatured).length,
      gold: submissions.filter(s => s.isGold).length,
      free: submissions.filter(s => s.fee === 0).length
    }
  }

  // 批量导入数据
  importSubmissions(submissions: SubmissionData[]): number {
    const existingSubmissions = this.loadSubmissions()
    const now = new Date().toISOString()
    
    const newSubmissions = submissions.map(submission => ({
      ...submission,
      id: submission.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: submission.createdAt || now,
      updatedAt: now
    }))

    const allSubmissions = [...existingSubmissions, ...newSubmissions]
    this.saveSubmissions(allSubmissions)
    
    return newSubmissions.length
  }

  // 导出数据
  exportSubmissions(): SubmissionData[] {
    return this.loadSubmissions()
  }
}
