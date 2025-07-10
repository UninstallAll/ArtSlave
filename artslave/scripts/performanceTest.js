const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

// 生成测试数据
function generateTestData(count) {
  const types = ['EXHIBITION', 'RESIDENCY', 'COMPETITION', 'GRANT', 'CONFERENCE']
  const countries = ['中国', '美国', '英国', '法国', '德国', '日本', '意大利']
  const data = []

  for (let i = 0; i < count; i++) {
    data.push({
      id: i.toString(),
      title: `测试投稿信息 ${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      organizer: `机构 ${i}`,
      location: `城市 ${i}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      deadline: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `这是第 ${i} 个测试投稿信息的描述，包含一些关键词用于搜索测试。`,
      website: `https://example${i}.com`,
      tags: [`标签${i}`, `关键词${i}`],
      fee: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : 0,
      rating: 3 + Math.random() * 2,
      applicants: Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
  return data
}

// JSON 文件性能测试
class JsonPerformanceTest {
  constructor(dataCount) {
    this.dataCount = dataCount
    this.dataFile = path.join(__dirname, `test_data_${dataCount}.json`)
    this.data = generateTestData(dataCount)
    fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2))
  }

  testRead() {
    const start = Date.now()
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'))
    const end = Date.now()
    return { operation: 'JSON读取', time: end - start, count: data.length }
  }

  testSearch(query) {
    const start = Date.now()
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'))
    const results = data.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    )
    const end = Date.now()
    return { operation: 'JSON搜索', time: end - start, results: results.length }
  }

  testFilter(type) {
    const start = Date.now()
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'))
    const results = data.filter(item => item.type === type)
    const end = Date.now()
    return { operation: 'JSON筛选', time: end - start, results: results.length }
  }

  cleanup() {
    if (fs.existsSync(this.dataFile)) {
      fs.unlinkSync(this.dataFile)
    }
  }
}

// SQLite 性能测试
class SqlitePerformanceTest {
  constructor(dataCount) {
    this.dataCount = dataCount
    this.dbFile = path.join(__dirname, `test_${dataCount}.db`)
    this.db = new sqlite3.Database(this.dbFile)
    this.setupDatabase()
    this.insertTestData()
  }

  setupDatabase() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        title TEXT,
        type TEXT,
        organizer TEXT,
        location TEXT,
        country TEXT,
        deadline DATE,
        description TEXT,
        website TEXT,
        tags TEXT,
        fee REAL,
        rating REAL,
        applicants INTEGER,
        created_at DATETIME,
        updated_at DATETIME
      )
    `)

    // 创建索引
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_title ON submissions(title)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_type ON submissions(type)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_deadline ON submissions(deadline)`)
  }

  insertTestData() {
    const data = generateTestData(this.dataCount)
    const stmt = this.db.prepare(`
      INSERT INTO submissions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    data.forEach(item => {
      stmt.run(
        item.id, item.title, item.type, item.organizer, item.location,
        item.country, item.deadline, item.description, item.website,
        JSON.stringify(item.tags), item.fee, item.rating, item.applicants,
        item.createdAt, item.updatedAt
      )
    })
    stmt.finalize()
  }

  testRead() {
    return new Promise((resolve) => {
      const start = Date.now()
      this.db.all(`SELECT COUNT(*) as count FROM submissions`, (err, rows) => {
        const end = Date.now()
        resolve({ operation: 'SQLite读取', time: end - start, count: rows[0].count })
      })
    })
  }

  testSearch(query) {
    return new Promise((resolve) => {
      const start = Date.now()
      this.db.all(
        `SELECT COUNT(*) as count FROM submissions WHERE title LIKE ? OR description LIKE ?`,
        [`%${query}%`, `%${query}%`],
        (err, rows) => {
          const end = Date.now()
          resolve({ operation: 'SQLite搜索', time: end - start, results: rows[0].count })
        }
      )
    })
  }

  testFilter(type) {
    return new Promise((resolve) => {
      const start = Date.now()
      this.db.all(
        `SELECT COUNT(*) as count FROM submissions WHERE type = ?`,
        [type],
        (err, rows) => {
          const end = Date.now()
          resolve({ operation: 'SQLite筛选', time: end - start, results: rows[0].count })
        }
      )
    })
  }

  cleanup() {
    this.db.close()
    if (fs.existsSync(this.dbFile)) {
      fs.unlinkSync(this.dbFile)
    }
  }
}

// 运行性能测试
async function runPerformanceTest() {
  const testSizes = [100, 1000, 5000, 10000]
  
  console.log('🚀 开始性能测试...\n')
  
  for (const size of testSizes) {
    console.log(`📊 测试数据量: ${size} 条`)
    console.log('=' * 50)
    
    // JSON 测试
    const jsonTest = new JsonPerformanceTest(size)
    const jsonRead = jsonTest.testRead()
    const jsonSearch = jsonTest.testSearch('测试')
    const jsonFilter = jsonTest.testFilter('EXHIBITION')
    
    console.log(`${jsonRead.operation}: ${jsonRead.time}ms`)
    console.log(`${jsonSearch.operation}: ${jsonSearch.time}ms (找到 ${jsonSearch.results} 条)`)
    console.log(`${jsonFilter.operation}: ${jsonFilter.time}ms (找到 ${jsonFilter.results} 条)`)
    
    // SQLite 测试
    const sqliteTest = new SqlitePerformanceTest(size)
    const sqliteRead = await sqliteTest.testRead()
    const sqliteSearch = await sqliteTest.testSearch('测试')
    const sqliteFilter = await sqliteTest.testFilter('EXHIBITION')
    
    console.log(`${sqliteRead.operation}: ${sqliteRead.time}ms`)
    console.log(`${sqliteSearch.operation}: ${sqliteSearch.time}ms (找到 ${sqliteSearch.results} 条)`)
    console.log(`${sqliteFilter.operation}: ${sqliteFilter.time}ms (找到 ${sqliteFilter.results} 条)`)
    
    // 性能对比
    const searchSpeedup = jsonSearch.time / sqliteSearch.time
    const filterSpeedup = jsonFilter.time / sqliteFilter.time
    
    console.log(`\n⚡ 性能提升:`)
    console.log(`   搜索速度提升: ${searchSpeedup.toFixed(2)}x`)
    console.log(`   筛选速度提升: ${filterSpeedup.toFixed(2)}x`)
    
    // 清理
    jsonTest.cleanup()
    sqliteTest.cleanup()
    
    console.log('\n' + '=' * 50 + '\n')
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runPerformanceTest().catch(console.error)
}

module.exports = { runPerformanceTest }
