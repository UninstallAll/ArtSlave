/**
 * ArtSlave 数据库初始化脚本
 * 初始化 SQLite、Neo4j 和 Redis 数据库
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据目录路径
const dataDir = path.join(__dirname, '..', 'data');

// 初始化 SQLite 数据库
function initSQLite() {
  console.log('🗄️ 初始化 SQLite 数据库...');

  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'artslave.db');
  const db = new Database(dbPath);

  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile_data JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建投稿记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('exhibition', 'residency', 'competition', 'funding', 'conference')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected', 'pending')),
      data JSON NOT NULL,
      deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // 创建搜索历史表
  db.exec(`
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      search_type TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );
  `);

  // 创建机会信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('exhibition', 'residency', 'competition', 'funding', 'conference')),
      organization TEXT,
      location TEXT,
      deadline DATE,
      description TEXT,
      requirements TEXT,
      url TEXT,
      tags JSON,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'draft')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建用户收藏表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opportunity_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities (id) ON DELETE CASCADE,
      UNIQUE(user_id, opportunity_id)
    );
  `);

  // 创建索引
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);');
  } catch (error) {
    console.warn('⚠️ 索引创建警告:', error.message);
  }

  // 插入示例数据
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, profile_data) 
    VALUES (?, ?, ?, ?)
  `);

  insertUser.run(
    'demo_user',
    'demo@artslave.com',
    'hashed_password_placeholder',
    JSON.stringify({
      name: '演示用户',
      bio: '这是一个演示账户',
      specialization: ['当代艺术', '装置艺术'],
      location: '北京'
    })
  );

  const insertOpportunity = db.prepare(`
    INSERT OR IGNORE INTO opportunities (title, type, organization, location, deadline, description, requirements, url, tags) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 插入示例机会
  const sampleOpportunities = [
    {
      title: '2024年威尼斯双年展征集',
      type: 'exhibition',
      organization: '威尼斯双年展组委会',
      location: '威尼斯, 意大利',
      deadline: '2024-03-15',
      description: '第60届威尼斯国际艺术双年展作品征集',
      requirements: '当代艺术作品，需提供作品集和艺术家陈述',
      url: 'https://www.labiennale.org',
      tags: JSON.stringify(['当代艺术', '国际展览', '双年展'])
    },
    {
      title: 'ISCP国际艺术家驻地项目',
      type: 'residency',
      organization: 'International Studio & Curatorial Program',
      location: '纽约, 美国',
      deadline: '2024-02-28',
      description: '为期6个月的国际艺术家驻地项目',
      requirements: '艺术家作品集、项目提案、推荐信',
      url: 'https://www.iscp-nyc.org',
      tags: JSON.stringify(['驻地项目', '纽约', '国际交流'])
    }
  ];

  sampleOpportunities.forEach(opp => {
    insertOpportunity.run(
      opp.title, opp.type, opp.organization, opp.location, 
      opp.deadline, opp.description, opp.requirements, opp.url, opp.tags
    );
  });

  db.close();
  console.log('✅ SQLite 数据库初始化完成');
}

// 生成 Neo4j 初始化脚本
function generateNeo4jScript() {
  console.log('📊 生成 Neo4j 初始化脚本...');
  
  const neo4jScript = `
// ArtSlave 知识图谱初始化脚本
// 在 Neo4j Browser 中运行此脚本

// 创建约束
CREATE CONSTRAINT artist_name IF NOT EXISTS FOR (a:Artist) REQUIRE a.name IS UNIQUE;
CREATE CONSTRAINT exhibition_title IF NOT EXISTS FOR (e:Exhibition) REQUIRE (e.title, e.year) IS UNIQUE;
CREATE CONSTRAINT institution_name IF NOT EXISTS FOR (i:Institution) REQUIRE i.name IS UNIQUE;
CREATE CONSTRAINT artwork_title IF NOT EXISTS FOR (w:Artwork) REQUIRE (w.title, w.artist) IS UNIQUE;

// 创建示例节点
CREATE (picasso:Artist {
  name: "巴勃罗·毕加索",
  birth_year: 1881,
  death_year: 1973,
  nationality: "西班牙",
  style: ["立体主义", "蓝色时期", "玫瑰时期"],
  bio: "20世纪最具影响力的艺术家之一"
});

CREATE (cubism:Movement {
  name: "立体主义",
  period: "1907-1920",
  characteristics: ["几何形状", "多视角", "解构重组"],
  description: "20世纪初的革命性艺术运动"
});

CREATE (guernica:Artwork {
  title: "格尔尼卡",
  year: 1937,
  medium: "布面油画",
  dimensions: "349.3 × 776.6 cm",
  description: "反战主题的立体主义杰作"
});

CREATE (moma:Institution {
  name: "现代艺术博物馆",
  type: "博物馆",
  location: "纽约",
  founded: 1929,
  description: "世界著名的现代艺术博物馆"
});

CREATE (picasso_retro:Exhibition {
  title: "毕加索回顾展",
  year: 2023,
  venue: "现代艺术博物馆",
  duration: "6个月",
  description: "毕加索作品大型回顾展"
});

// 创建关系
CREATE (picasso)-[:FOUNDED]->(cubism);
CREATE (picasso)-[:CREATED]->(guernica);
CREATE (guernica)-[:BELONGS_TO]->(cubism);
CREATE (guernica)-[:COLLECTED_BY]->(moma);
CREATE (picasso_retro)-[:HELD_AT]->(moma);
CREATE (picasso_retro)-[:FEATURES]->(picasso);
CREATE (picasso_retro)-[:DISPLAYS]->(guernica);

// 创建索引
CREATE INDEX artist_name_index IF NOT EXISTS FOR (a:Artist) ON (a.name);
CREATE INDEX exhibition_year_index IF NOT EXISTS FOR (e:Exhibition) ON (e.year);
CREATE INDEX artwork_year_index IF NOT EXISTS FOR (w:Artwork) ON (w.year);
`;

  const scriptPath = path.join(dataDir, 'neo4j-init.cypher');
  fs.writeFileSync(scriptPath, neo4jScript);
  console.log('✅ Neo4j 初始化脚本已生成:', scriptPath);
}

// 生成 Redis 配置
function generateRedisConfig() {
  console.log('🔴 生成 Redis 配置...');
  
  const redisConfig = `
# ArtSlave Redis 配置文件
port 6379
bind 127.0.0.1
protected-mode yes
timeout 0
databases 16

# 内存配置
maxmemory 256mb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 日志配置
loglevel notice
logfile ""

# 缓存键命名规范
# search:results:{hash} - 搜索结果缓存
# search:progress:{sessionId} - 搜索进度
# session:{sessionId} - 用户会话
# stats:daily_searches - 每日搜索统计
# stats:popular_artists - 热门艺术家排行
`;

  const configPath = path.join(dataDir, 'redis.conf');
  fs.writeFileSync(configPath, redisConfig);
  console.log('✅ Redis 配置文件已生成:', configPath);
}

// 生成 Docker Compose 文件
function generateDockerCompose() {
  console.log('🐳 生成 Docker Compose 配置...');
  
  const dockerCompose = `
version: '3.8'

services:
  neo4j:
    image: neo4j:5.15-community
    container_name: artslave-neo4j
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/artslave123
      - NEO4J_PLUGINS=["apoc"]
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
      - ./data/neo4j-init.cypher:/var/lib/neo4j/import/init.cypher
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: artslave-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./data/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped

volumes:
  neo4j_data:
  neo4j_logs:
  redis_data:
`;

  const composePath = path.join(__dirname, '..', 'docker-compose.yml');
  fs.writeFileSync(composePath, dockerCompose);
  console.log('✅ Docker Compose 文件已生成:', composePath);
}

// 主函数
function main() {
  console.log('🚀 开始初始化 ArtSlave 数据库...\n');
  
  try {
    initSQLite();
    generateNeo4jScript();
    generateRedisConfig();
    generateDockerCompose();
    
    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 下一步操作:');
    console.log('1. 启动 Docker 服务: docker-compose up -d');
    console.log('2. 访问 Neo4j Browser: http://localhost:7474');
    console.log('3. 在 Neo4j Browser 中运行: data/neo4j-init.cypher');
    console.log('4. Redis 将在端口 6379 上运行');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  initSQLite,
  generateNeo4jScript,
  generateRedisConfig,
  generateDockerCompose
};
