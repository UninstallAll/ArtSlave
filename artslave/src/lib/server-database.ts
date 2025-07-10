// Server-side only database module
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

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

class SQLiteManager {
  private db: Database.Database
  private dbPath: string

  constructor() {
    // Ensure data directory exists
    const dbDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    this.dbPath = path.join(dbDir, 'artslave.db')
    this.db = new Database(this.dbPath)
    
    // Enable foreign key constraints
    this.db.pragma('foreign_keys = ON')
    
    // Initialize database tables
    this.initializeTables()
  }

  private initializeTables() {
    // Create submissions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('EXHIBITION', 'RESIDENCY', 'COMPETITION', 'GRANT', 'CONFERENCE')),
        organizer TEXT NOT NULL,
        location TEXT NOT NULL,
        country TEXT NOT NULL,
        deadline DATE NOT NULL,
        event_date DATE,
        fee REAL,
        prize TEXT,
        years_running INTEGER DEFAULT 1,
        description TEXT,
        website TEXT,
        email TEXT,
        phone TEXT,
        tags TEXT, -- JSON string
        requirements TEXT, -- JSON string
        is_gold BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        rating REAL,
        applicants INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
      CREATE INDEX IF NOT EXISTS idx_submissions_country ON submissions(country);
      CREATE INDEX IF NOT EXISTS idx_submissions_deadline ON submissions(deadline);
      CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_submissions_title ON submissions(title);
    `)
  }

  // Get all submissions
  getAllSubmissions(): SubmissionData[] {
    const stmt = this.db.prepare(`
      SELECT * FROM submissions 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC
    `)
    const rows = stmt.all()
    return rows.map(this.mapSubmissionRow)
  }

  // Get submission by ID
  getSubmissionById(id: string): SubmissionData | null {
    const stmt = this.db.prepare('SELECT * FROM submissions WHERE id = ?')
    const row = stmt.get(id)
    return row ? this.mapSubmissionRow(row) : null
  }

  // Add new submission
  addSubmission(submission: Omit<SubmissionData, 'id' | 'createdAt' | 'updatedAt'>): SubmissionData {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const now = new Date().toISOString()
    
    const stmt = this.db.prepare(`
      INSERT INTO submissions (
        id, title, type, organizer, location, country, deadline, event_date,
        fee, prize, years_running, description, website, email, phone,
        tags, requirements, is_gold, is_featured, is_active, rating, applicants,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id, submission.title, submission.type, submission.organizer,
      submission.location, submission.country, submission.deadline, submission.eventDate,
      submission.fee, submission.prize, submission.yearsRunning, submission.description,
      submission.website, submission.email, submission.phone,
      JSON.stringify(submission.tags || []), JSON.stringify(submission.requirements || {}),
      submission.isGold || false, submission.isFeatured || false, submission.isActive !== false,
      submission.rating, submission.applicants, now, now
    )

    return this.getSubmissionById(id)!
  }

  // Search submissions
  searchSubmissions(query: string): SubmissionData[] {
    const stmt = this.db.prepare(`
      SELECT * FROM submissions 
      WHERE (title LIKE ? OR organizer LIKE ? OR description LIKE ?) 
        AND is_active = TRUE
      ORDER BY created_at DESC
    `)
    const searchTerm = `%${query}%`
    const rows = stmt.all(searchTerm, searchTerm, searchTerm)
    return rows.map(this.mapSubmissionRow)
  }

  // Get submissions by type
  getSubmissionsByType(type: string): SubmissionData[] {
    const stmt = this.db.prepare(`
      SELECT * FROM submissions 
      WHERE type = ? AND is_active = TRUE 
      ORDER BY deadline ASC
    `)
    const rows = stmt.all(type)
    return rows.map(this.mapSubmissionRow)
  }

  // Get submissions by country
  getSubmissionsByCountry(country: string): SubmissionData[] {
    const stmt = this.db.prepare(`
      SELECT * FROM submissions 
      WHERE country = ? AND is_active = TRUE 
      ORDER BY deadline ASC
    `)
    const rows = stmt.all(country)
    return rows.map(this.mapSubmissionRow)
  }

  // Get upcoming deadlines
  getUpcomingDeadlines(days: number = 30): SubmissionData[] {
    const stmt = this.db.prepare(`
      SELECT * FROM submissions 
      WHERE deadline BETWEEN date('now') AND date('now', '+' || ? || ' days')
        AND is_active = TRUE
      ORDER BY deadline ASC
    `)
    const rows = stmt.all(days)
    return rows.map(this.mapSubmissionRow)
  }

  // Update submission
  updateSubmission(id: string, updates: Partial<SubmissionData>): SubmissionData | null {
    const existing = this.getSubmissionById(id)
    if (!existing) return null

    const now = new Date().toISOString()
    const stmt = this.db.prepare(`
      UPDATE submissions SET
        title = ?, type = ?, organizer = ?, location = ?, country = ?,
        deadline = ?, event_date = ?, fee = ?, prize = ?, years_running = ?,
        description = ?, website = ?, email = ?, phone = ?, tags = ?,
        requirements = ?, is_gold = ?, is_featured = ?, is_active = ?,
        rating = ?, applicants = ?, updated_at = ?
      WHERE id = ?
    `)

    const merged = { ...existing, ...updates }
    stmt.run(
      merged.title, merged.type, merged.organizer, merged.location, merged.country,
      merged.deadline, merged.eventDate, merged.fee, merged.prize, merged.yearsRunning,
      merged.description, merged.website, merged.email, merged.phone,
      JSON.stringify(merged.tags || []), JSON.stringify(merged.requirements || {}),
      merged.isGold || false, merged.isFeatured || false, merged.isActive !== false,
      merged.rating, merged.applicants, now, id
    )

    return this.getSubmissionById(id)
  }

  // Delete submission
  deleteSubmission(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM submissions WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  // Get statistics
  getStatistics() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM submissions WHERE is_active = TRUE')
    const total = (totalStmt.get() as { count: number }).count

    const typeStmt = this.db.prepare(`
      SELECT type, COUNT(*) as count
      FROM submissions
      WHERE is_active = TRUE
      GROUP BY type
    `)
    const byType = typeStmt.all() as { type: string; count: number }[]

    const countryStmt = this.db.prepare(`
      SELECT country, COUNT(*) as count
      FROM submissions
      WHERE is_active = TRUE
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `)
    const byCountry = countryStmt.all() as { country: string; count: number }[]

    const featuredStmt = this.db.prepare('SELECT COUNT(*) as count FROM submissions WHERE is_featured = TRUE AND is_active = TRUE')
    const featured = (featuredStmt.get() as { count: number }).count

    const goldStmt = this.db.prepare('SELECT COUNT(*) as count FROM submissions WHERE is_gold = TRUE AND is_active = TRUE')
    const gold = (goldStmt.get() as { count: number }).count

    const freeStmt = this.db.prepare('SELECT COUNT(*) as count FROM submissions WHERE fee = 0 AND is_active = TRUE')
    const free = (freeStmt.get() as { count: number }).count

    return {
      total,
      byType: byType.reduce((acc, row) => ({ ...acc, [row.type]: row.count }), {}),
      byCountry: byCountry.reduce((acc, row) => ({ ...acc, [row.country]: row.count }), {}),
      featured,
      gold,
      free
    }
  }

  private mapSubmissionRow(row: any): SubmissionData {
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      organizer: row.organizer,
      location: row.location,
      country: row.country,
      deadline: row.deadline,
      eventDate: row.event_date,
      fee: row.fee,
      prize: row.prize,
      yearsRunning: row.years_running,
      description: row.description,
      website: row.website,
      email: row.email,
      phone: row.phone,
      tags: row.tags ? JSON.parse(row.tags) : [],
      requirements: row.requirements ? JSON.parse(row.requirements) : {},
      isGold: Boolean(row.is_gold),
      isFeatured: Boolean(row.is_featured),
      isActive: Boolean(row.is_active),
      rating: row.rating,
      applicants: row.applicants,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  // Close database connection
  close() {
    this.db.close()
  }
}

// Singleton instance
let dbInstance: SQLiteManager | null = null

export function getDatabase(): SQLiteManager {
  if (!dbInstance) {
    dbInstance = new SQLiteManager()
  }
  return dbInstance
}

export default SQLiteManager
