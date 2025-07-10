const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 初始化 SQLite 数据库
const dbPath = path.join(dataDir, 'artslave.db')
const db = new Database(dbPath)

// 示例数据
const sampleSubmissions = [
  {
    id: '1',
    title: '2025年国际当代艺术展',
    type: 'EXHIBITION',
    organizer: '国际当代艺术基金会',
    location: '北京市朝阳区798艺术区',
    country: '中国',
    deadline: '2025-03-15',
    eventDate: '2025-05-01',
    fee: 0,
    prize: '最佳作品奖10万元',
    yearsRunning: 8,
    description: '展示全球当代艺术家的最新作品，涵盖绘画、雕塑、装置艺术等多种媒介。这是一个国际性的艺术盛会，旨在促进不同文化背景艺术家之间的交流与合作。',
    website: 'https://example.com/exhibition2025',
    tags: ['当代艺术', '国际展览', '多媒介', '文化交流'],
    isGold: true,
    isFeatured: true,
    rating: 4.8,
    applicants: 1250,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    title: '青年艺术家驻地项目',
    type: 'RESIDENCY',
    organizer: '上海当代艺术博物馆',
    location: '上海市黄浦区',
    country: '中国',
    deadline: '2025-02-28',
    eventDate: '2025-06-01',
    fee: 0,
    prize: '月补贴5000元',
    yearsRunning: 5,
    description: '为期3个月的艺术家驻地项目，提供工作室、材料费和生活补贴。项目旨在支持青年艺术家的创作实践，促进艺术创新。',
    website: 'https://example.com/residency',
    tags: ['驻地项目', '青年艺术家', '当代艺术', '创作支持'],
    isGold: false,
    isFeatured: true,
    rating: 4.6,
    applicants: 890,
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z'
  },
  {
    id: '3',
    title: '全国大学生艺术设计大赛',
    type: 'COMPETITION',
    organizer: '中国美术家协会',
    location: '全国',
    country: '中国',
    deadline: '2025-04-30',
    eventDate: '2025-07-15',
    fee: 100,
    prize: '一等奖5万元，二等奖3万元，三等奖1万元',
    yearsRunning: 12,
    description: '面向全国高校学生的艺术设计竞赛，包括平面设计、产品设计、环境设计等类别。比赛旨在发现和培养优秀的设计人才。',
    website: 'https://example.com/competition',
    tags: ['学生竞赛', '艺术设计', '全国性', '人才培养'],
    isGold: true,
    isFeatured: false,
    rating: 4.7,
    applicants: 2340,
    createdAt: '2025-01-03T00:00:00.000Z',
    updatedAt: '2025-01-03T00:00:00.000Z'
  },
  {
    id: '4',
    title: '艺术创新基金资助项目',
    type: 'GRANT',
    organizer: '文化部艺术发展中心',
    location: '北京市',
    country: '中国',
    deadline: '2025-03-31',
    fee: 0,
    prize: '资助金额10-50万元',
    yearsRunning: 15,
    description: '支持具有创新性的艺术项目，资助金额10-50万元不等。项目重点关注艺术与科技融合、跨界合作等创新形式。',
    website: 'https://example.com/grant',
    tags: ['政府资助', '艺术创新', '项目资助', '科技融合'],
    isGold: false,
    isFeatured: true,
    rating: 4.9,
    applicants: 567,
    createdAt: '2025-01-04T00:00:00.000Z',
    updatedAt: '2025-01-04T00:00:00.000Z'
  },
  {
    id: '5',
    title: '数字艺术与科技国际研讨会',
    type: 'CONFERENCE',
    organizer: '中央美术学院',
    location: '北京市朝阳区',
    country: '中国',
    deadline: '2025-02-15',
    eventDate: '2025-04-20',
    fee: 500,
    yearsRunning: 6,
    description: '探讨数字艺术与科技融合的最新趋势，邀请国内外专家学者参与。会议将涵盖AI艺术、VR/AR艺术、区块链艺术等前沿话题。',
    website: 'https://example.com/conference',
    tags: ['学术会议', '数字艺术', '国际交流', '前沿技术'],
    isGold: false,
    isFeatured: false,
    rating: 4.4,
    applicants: 234,
    createdAt: '2025-01-05T00:00:00.000Z',
    updatedAt: '2025-01-05T00:00:00.000Z'
  },
  {
    id: '6',
    title: '威尼斯双年展中国馆征集',
    type: 'EXHIBITION',
    organizer: '中国对外文化集团',
    location: '威尼斯，意大利',
    country: '意大利',
    deadline: '2025-01-31',
    eventDate: '2025-05-11',
    fee: 0,
    prize: '国际展览机会',
    yearsRunning: 25,
    description: '威尼斯双年展是世界最重要的艺术展览之一。中国馆征集代表中国当代艺术最高水平的作品参展。',
    website: 'https://example.com/venice',
    tags: ['国际双年展', '威尼斯', '中国馆', '当代艺术'],
    isGold: true,
    isFeatured: true,
    rating: 4.9,
    applicants: 456,
    createdAt: '2025-01-06T00:00:00.000Z',
    updatedAt: '2025-01-06T00:00:00.000Z'
  },
  {
    id: '7',
    title: 'MoMA PS1青年艺术家项目',
    type: 'RESIDENCY',
    organizer: 'MoMA PS1',
    location: '纽约，美国',
    country: '美国',
    deadline: '2025-03-01',
    eventDate: '2025-09-01',
    fee: 0,
    prize: '工作室+生活补贴$3000/月',
    yearsRunning: 20,
    description: '纽约现代艺术博物馆PS1分馆的国际艺术家驻地项目，为期6个月，提供世界级的创作环境和展示机会。',
    website: 'https://example.com/moma-ps1',
    tags: ['国际驻地', 'MoMA', '纽约', '青年艺术家'],
    isGold: true,
    isFeatured: true,
    rating: 4.8,
    applicants: 1890,
    createdAt: '2025-01-07T00:00:00.000Z',
    updatedAt: '2025-01-07T00:00:00.000Z'
  },
  {
    id: '8',
    title: '环保艺术创作大赛',
    type: 'COMPETITION',
    organizer: '联合国环境规划署',
    location: '全球',
    country: '国际',
    deadline: '2025-06-05',
    eventDate: '2025-09-15',
    fee: 0,
    prize: '冠军$50,000',
    yearsRunning: 3,
    description: '以环境保护为主题的国际艺术创作大赛，鼓励艺术家通过作品唤起公众对环境问题的关注。',
    website: 'https://example.com/eco-art',
    tags: ['环保主题', '国际大赛', '社会责任', '可持续发展'],
    isGold: false,
    isFeatured: true,
    rating: 4.5,
    applicants: 2100,
    createdAt: '2025-01-08T00:00:00.000Z',
    updatedAt: '2025-01-08T00:00:00.000Z'
  }
]

// 初始化数据库表
function initializeTables() {
  console.log('🔧 初始化数据库表...')

  // 创建投稿信息表
  db.exec(`
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
      tags TEXT,
      requirements TEXT,
      is_gold BOOLEAN DEFAULT FALSE,
      is_featured BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      rating REAL,
      applicants INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建数据源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('website', 'api', 'rss')),
      config TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      last_crawled DATETIME,
      items_found INTEGER DEFAULT 0,
      status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建爬虫任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS crawl_jobs (
      id TEXT PRIMARY KEY,
      data_source_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
      started_at DATETIME NOT NULL,
      completed_at DATETIME,
      items_found INTEGER DEFAULT 0,
      items_added INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
    CREATE INDEX IF NOT EXISTS idx_submissions_country ON submissions(country);
    CREATE INDEX IF NOT EXISTS idx_submissions_deadline ON submissions(deadline);
    CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
  `)

  console.log('✅ 数据库表创建完成')
}

// 插入示例数据
function insertSampleData() {
  console.log('📊 插入示例数据...')

  // 检查是否已有数据
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM submissions')
  const existingCount = countStmt.get().count

  if (existingCount > 0) {
    console.log(`⚠️  数据库中已有 ${existingCount} 条数据，跳过插入`)
    return existingCount
  }

  const insertStmt = db.prepare(`
    INSERT INTO submissions (
      id, title, type, organizer, location, country, deadline, event_date,
      fee, prize, years_running, description, website, tags, is_gold, is_featured,
      rating, applicants, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let insertedCount = 0
  for (const item of sampleSubmissions) {
    try {
      insertStmt.run(
        item.id, item.title, item.type, item.organizer, item.location,
        item.country, item.deadline, item.eventDate, item.fee, item.prize,
        item.yearsRunning, item.description, item.website,
        JSON.stringify(item.tags), item.isGold ? 1 : 0, item.isFeatured ? 1 : 0,
        item.rating, item.applicants, item.createdAt, item.updatedAt
      )
      insertedCount++
    } catch (error) {
      console.error(`❌ 插入数据失败: ${item.title}`, error.message)
    }
  }

  console.log(`✅ 成功插入 ${insertedCount} 条投稿信息`)
  return insertedCount
}

// 插入示例数据源
function insertSampleDataSources() {
  console.log('🔗 插入示例数据源...')

  const dataSources = [
    {
      id: '1',
      name: 'FilmFreeway 艺术节',
      url: 'https://filmfreeway.com/festivals',
      type: 'website',
      config: JSON.stringify({
        selectors: {
          title: '.festival-title',
          deadline: '.deadline-date',
          description: '.festival-description'
        },
        pagination: true,
        maxPages: 10
      }),
      isActive: true
    },
    {
      id: '2',
      name: '中国美术馆展览',
      url: 'http://www.namoc.org',
      type: 'website',
      config: JSON.stringify({
        selectors: {
          title: '.exhibition-title',
          date: '.exhibition-date',
          description: '.exhibition-content'
        },
        encoding: 'utf-8'
      }),
      isActive: true
    },
    {
      id: '3',
      name: 'Artsy 展览信息',
      url: 'https://www.artsy.net/api/exhibitions',
      type: 'api',
      config: JSON.stringify({
        apiKey: 'your_api_key_here',
        rateLimit: 100,
        format: 'json'
      }),
      isActive: false
    }
  ]

  const insertDataSourceStmt = db.prepare(`
    INSERT OR REPLACE INTO data_sources (
      id, name, url, type, config, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)

  let insertedSources = 0
  for (const source of dataSources) {
    try {
      insertDataSourceStmt.run(
        source.id, source.name, source.url, source.type,
        source.config, source.isActive ? 1 : 0
      )
      insertedSources++
    } catch (error) {
      console.error(`❌ 插入数据源失败: ${source.name}`, error.message)
    }
  }

  console.log(`✅ 成功插入 ${insertedSources} 个数据源`)
  return insertedSources
}

// 主函数
function main() {
  try {
    console.log('🚀 开始初始化 ArtSlave SQLite 数据库')
    console.log('=' * 50)

    // 初始化表
    initializeTables()

    // 插入示例数据
    const submissionCount = insertSampleData()
    const sourceCount = insertSampleDataSources()

    console.log('\n' + '=' * 50)
    console.log('🎉 数据库初始化完成！')
    console.log(`📊 投稿信息: ${submissionCount} 条`)
    console.log(`🔗 数据源: ${sourceCount} 个`)
    console.log(`💾 数据库文件: ${dbPath}`)
    console.log('🚀 现在可以启动项目了！')

  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

// 运行初始化
main()
