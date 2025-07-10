// Client-side database interface - uses API calls instead of direct database access

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
  email?: string
  phone?: string
  tags: string[]
  requirements?: Record<string, any>
  isGold?: boolean
  isFeatured?: boolean
  isActive?: boolean
  rating?: number
  applicants?: number
  createdAt: string
  updatedAt: string
}

export interface CrawlJob {
  id: string
  dataSourceName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  itemsFound?: number
  itemsAdded?: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface DataSource {
  id: string
  name: string
  url: string
  type: 'website' | 'api' | 'rss'
  config: Record<string, any>
  isActive: boolean
  lastCrawled?: string
  itemsFound?: number
  status: 'idle' | 'running' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

// Client-side API interface for database operations
export class DatabaseAPI {
  private baseUrl = '/api'

  // Get all submissions
  async getAllSubmissions(): Promise<SubmissionData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions`)
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
      return []
    }
  }

  // Search submissions
  async searchSubmissions(query: string): Promise<SubmissionData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions?action=search&query=${encodeURIComponent(query)}`)
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to search submissions:', error)
      return []
    }
  }

  // Get submissions by type
  async getSubmissionsByType(type: string): Promise<SubmissionData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions?action=filter-type&type=${encodeURIComponent(type)}`)
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to fetch submissions by type:', error)
      return []
    }
  }

  // Get submissions by country
  async getSubmissionsByCountry(country: string): Promise<SubmissionData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions?action=filter-country&country=${encodeURIComponent(country)}`)
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to fetch submissions by country:', error)
      return []
    }
  }

  // Get upcoming deadlines
  async getUpcomingDeadlines(days: number = 30): Promise<SubmissionData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions?action=upcoming&days=${days}`)
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to fetch upcoming deadlines:', error)
      return []
    }
  }

  // Get statistics
  async getStatistics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions?action=statistics`)
      const result = await response.json()
      return result.success ? result.data : {}
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
      return {}
    }
  }

  // Add new submission
  async addSubmission(submission: Omit<SubmissionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubmissionData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          data: submission
        })
      })
      const result = await response.json()
      return result.success ? result.data : null
    } catch (error) {
      console.error('Failed to add submission:', error)
      return null
    }
  }

  // Update submission
  async updateSubmission(id: string, updates: Partial<SubmissionData>): Promise<SubmissionData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          data: updates
        })
      })
      const result = await response.json()
      return result.success ? result.data : null
    } catch (error) {
      console.error('Failed to update submission:', error)
      return null
    }
  }

  // Delete submission
  async deleteSubmission(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/submissions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Failed to delete submission:', error)
      return false
    }
  }
}

// Singleton instance for client-side use
let dbApiInstance: DatabaseAPI | null = null

export function getDatabaseAPI(): DatabaseAPI {
  if (!dbApiInstance) {
    dbApiInstance = new DatabaseAPI()
  }
  return dbApiInstance
}

// For backward compatibility, export as getDatabase as well
export function getDatabase(): DatabaseAPI {
  return getDatabaseAPI()
}

// Export the API class as default
export default DatabaseAPI
