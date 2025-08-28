# ArtSlave 数据库架构设计

## 🏗️ 多数据库架构

### 1. SQLite (主数据库)
**用途**: 用户数据、投稿记录、系统配置
**位置**: `./data/artslave.db`

```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  profile_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 投稿记录表
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  title TEXT,
  type TEXT, -- exhibition, residency, competition, funding, conference
  status TEXT, -- draft, submitted, accepted, rejected
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 搜索历史表
CREATE TABLE search_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  query TEXT,
  results_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### 2. Neo4j (图数据库)
**用途**: 知识图谱、实体关系、深度搜索结果
**位置**: Docker容器或云服务

```cypher
-- 节点类型
(:Artist {name, nationality, birth_year, style, ...})
(:Exhibition {title, venue, start_date, end_date, ...})
(:Institution {name, type, location, ...})
(:Artwork {title, medium, year, dimensions, ...})
(:Curator {name, specialization, ...})
(:Movement {name, period, characteristics, ...})

-- 关系类型
(:Artist)-[:EXHIBITED_AT]->(:Exhibition)
(:Artist)-[:CREATED]->(:Artwork)
(:Artist)-[:INFLUENCED_BY]->(:Artist)
(:Exhibition)-[:HELD_AT]->(:Institution)
(:Curator)-[:CURATED]->(:Exhibition)
```

### 3. Redis (缓存数据库)
**用途**: 搜索结果缓存、会话存储、实时数据
**位置**: Docker容器

```
-- 搜索结果缓存
search:results:{hash} -> JSON
search:progress:{sessionId} -> JSON

-- 用户会话
session:{sessionId} -> JSON

-- 实时统计
stats:daily_searches -> Counter
stats:popular_artists -> SortedSet
```

## 📊 数据流架构

```
用户搜索 -> SQLite(记录) -> DeepSearch引擎 -> Neo4j(存储图谱) -> Redis(缓存) -> 前端展示
```

## 🔧 技术栈选择

- **SQLite**: 轻量级，适合用户数据
- **Neo4j**: 专业图数据库，强大的图查询能力
- **Redis**: 高性能缓存，提升响应速度
- **Prisma**: ORM工具，简化数据库操作
