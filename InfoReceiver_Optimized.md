# 🎯 ArtSlave 信息接收器 (InfoReceiver) 实现方案

## 📋 目标概述

用户通过多种渠道（邮箱、微信、网页等）发送「链接/网页/小红书分享」后，系统自动：

1. **收集原始信息** - 统一接收各@种格式的内容
2. **智能解析提取** - 使用 LLM + 规则提取结构化字段  
3. **内容分类判别** - 自动识别投稿信息/数据源/活动等类型
4. **数据库存储** - 去重后写入对应数据表，供查询展示

---

## 🚪 1. 信息入口层（多渠道统一收集）

### 1.1 📧 邮箱接收
```javascript
// 专用邮箱地址
const INTAKE_EMAIL = "intake@artslave.com"

// 实现方案
- 使用 IMAP 轮询检测新邮件 (简单实现)
- 或配置邮件服务商 Webhook (推荐，实时性好)
- 解析邮件内容：正文、附件、链接
- 统一推送到内部 API 处理队列
```

### 1.2 💬 微信/微信群
```javascript
// 使用 WeChaty 机器人
- 监听指定微信群或私聊消息
- 捕获类型：文本、链接、图片、小程序分享
- 自动回复确认收到信息
- 上传到统一处理 API
```

### 1.3 🌐 网页分享入口
```javascript
// Web 表单提交
- 提供简单的网页表单 (/submit 页面)
- 用户可直接粘贴链接或文本
- 支持批量提交多个链接
- 移动端友好的响应式设计
```

### 1.4 🔗 其他平台分享
```javascript
// 社交媒体链接处理
- 小红书：检测短链后自动爬取完整内容
- 微博：解析微博链接获取正文  
- 公众号：提取文章链接和内容
- Instagram/Facebook：处理分享链接
```

### 📤 统一输出格式
```typescript
interface RawMessage {
  id: string
  source: 'email' | 'wechat' | 'web' | 'social'
  content: string
  links: string[]
  images: string[]
  attachments: string[]
  metadata: {
    sender?: string
    timestamp: Date
    platform?: string
  }
}
```

---

## ⚡ 2. 消息队列 & 工作流触发

### 2.1 🔄 Redis Streams 队列
```javascript
// 高性能消息队列
- 使用 Redis Streams 存储待处理消息
- 支持消息持久化和重试机制
- 低延迟，高吞吐量
- 支持消费者组，可水平扩展
```

### 2.2 🎛️ n8n 工作流集成
```javascript
// 可视化工作流
- n8n 监听 Redis Stream 触发器
- 新消息自动进入解析流程
- 可视化调试和监控
- 非技术人员可自行调整流程
```

### 2.3 ⚠️ 错误处理机制
```javascript
// 失败重试策略
- 解析失败消息进入死信队列
- 指数退避重试机制
- 超过重试次数后人工审核
- 实时告警通知
```

---

## 🧠 3. 智能解析服务（LLM + 规则引擎）

### 3.1 🔍 预处理阶段
```javascript
// 内容预处理
- URL链接 → 使用 Playwright 爬取页面内容
- 图片内容 → 使用 Tesseract.js OCR 识别文字
- 文档附件 → 解析 PDF/Word 等格式
- 清理和标准化文本内容
```

### 3.2 🤖 LLM 智能解析
```javascript
// Prompt 模板设计
const PARSE_PROMPT = `
请从以下内容中提取投稿信息，返回JSON格式：

内容：{content}

请提取以下字段：
- title: 活动/投稿标题
- category: 类型 (exhibition|residency|competition|funding|conference)
- deadline: 截止日期 (YYYY-MM-DD格式)
- location: 地点信息
- organizer: 主办方
- description: 详细描述
- requirements: 申请要求
- fee: 费用信息
- contact: 联系方式
- originalUrl: 原始链接
- confidence: 置信度 (0-1)

如果无法确定某个字段，请返回null。
`

// 多模型支持
- 主要使用 GPT-4 或 Claude
- 备用 Gemini Pro
- 本地模型作为后备 (Llama2/Qwen)
```

### 3.3 📏 规则引擎后备
```javascript
// 关键词匹配规则
const CATEGORY_RULES = {
  exhibition: ['展览', '画展', '艺术展', 'exhibition'],
  residency: ['驻地', '驻留', 'residency', 'artist in residence'],
  competition: ['比赛', '竞赛', '征集', 'competition', 'contest'],
  funding: ['资助', '基金', '奖学金', 'grant', 'funding'],
  conference: ['会议', '论坛', '研讨会', 'conference', 'symposium']
}

// 置信度评估
- LLM置信度 > 0.8 → 直接采用
- 0.6-0.8 → 规则验证
- < 0.6 → 人工审核队列
```

### 3.4 🗺️ 地理编码服务
```javascript
// 地址标准化
- 使用高德地图 API 进行地址解析
- 获取经纬度坐标
- 标准化城市/国家信息
- 支持多语言地址识别
```

---

## 🗄️ 4. 数据分类存储 & 去重

### 4.1 📊 数据库模型优化
```typescript
// 基础资源模型
model BaseResource {
  id          String   @id @default(cuid())
  title       String
  category    Category // enum: EXHIBITION | RESIDENCY | COMPETITION | FUNDING | CONFERENCE
  deadline    DateTime?
  location    String?
  city        String?
  country     String?
  latitude    Float?
  longitude   Float?
  organizer   String?
  description String?
  requirements String?
  fee         String?
  contact     String?
  originalUrl String?
  
  // 元数据
  source      String   // 来源渠道
  confidence  Float    // AI解析置信度
  status      Status   // PENDING | VERIFIED | REJECTED
  
  // 去重和版本控制
  contentHash String   @unique // 内容哈希
  version     Int      @default(1)
  
  // 时间戳
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category, deadline])
  @@index([city, category])
}

// 原始消息存储
model RawMessage {
  id          String   @id @default(cuid())
  source      String
  content     String
  metadata    Json
  processed   Boolean  @default(false)
  resourceId  String?
  createdAt   DateTime @default(now())
}
```

### 4.2 🔄 智能去重策略
```javascript
// 多层去重机制
1. 内容哈希去重：hash(title + deadline + location)
2. 相似度检测：使用向量相似度比较
3. URL去重：相同原始链接自动合并
4. 人工确认：相似度高但不完全相同的记录

// 更新策略
- 相同内容 → 忽略
- 内容更新 → 版本递增
- 补充信息 → 字段合并
```

---

## 📊 5. 监控告警 & 质量控制

### 5.1 📈 性能监控
```javascript
// 关键指标监控
- 消息处理速度 (msg/min)
- LLM 调用成功率和延迟
- 解析准确率 (人工验证样本)
- 队列堆积长度
- 系统资源使用率
```

### 5.2 🚨 告警机制
```javascript
// 多渠道告警
- Slack/钉钉机器人通知
- 邮件告警 (严重错误)
- 短信通知 (系统宕机)
- Dashboard 可视化监控
```

### 5.3 ✅ 质量控制
```javascript
// 数据质量保证
- 随机抽样人工验证
- 用户反馈收集
- A/B测试不同解析策略
- 持续优化 Prompt 模板
```

---

## 🚀 6. 部署架构 & 技术选型

### 6.1 🐳 容器化部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  info-receiver:
    build: ./services/info-receiver
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/artslave
    depends_on:
      - redis
      - postgres
  
  wechaty-bot:
    build: ./services/wechaty-bot
    volumes:
      - ./data/wechaty:/app/data
  
  n8n:
    image: n8nio/n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - ./data/n8n:/home/node/.n8n
  
  redis:
    image: redis:7-alpine
    volumes:
      - ./data/redis:/data
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=artslave
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```

### 6.2 🔧 技术栈选择
```javascript
// 后端服务
- Node.js + TypeScript
- Prisma ORM + PostgreSQL
- Redis Streams
- n8n 工作流引擎

// AI/ML 服务
- OpenAI GPT-4 API
- Google Gemini Pro (备用)
- Tesseract.js (OCR)
- 向量数据库 (Pinecone/Weaviate)

// 爬虫服务
- Playwright (动态页面)
- Cheerio (静态页面)
- Puppeteer (备用)

// 监控运维
- Prometheus + Grafana
- Winston 日志
- PM2 进程管理
```

---

## 📅 7. 开发里程碑 & 时间规划

### 🎯 M0: 基础框架 (3天)
```javascript
- [x] 项目初始化和基础架构
- [x] 数据库模型设计
- [x] 基础 API 接口
- [x] 简单的邮箱接收功能
```

### 🎯 M1: 核心解析 (5天)
```javascript
- [ ] Redis Streams 消息队列
- [ ] n8n 工作流集成
- [ ] LLM 解析服务
- [ ] 基础去重逻辑
```

### 🎯 M2: 多渠道接入 (5天)
```javascript
- [ ] WeChaty 微信机器人
- [ ] 网页提交表单
- [ ] URL 爬虫服务
- [ ] OCR 图片识别
```

### 🎯 M3: 智能优化 (7天)
```javascript
- [ ] 规则引擎后备
- [ ] 地理编码服务
- [ ] 高级去重算法
- [ ] 质量控制机制
```

### 🎯 M4: 监控部署 (3天)
```javascript
- [ ] 监控告警系统
- [ ] Docker 容器化
- [ ] 生产环境部署
- [ ] 文档和培训
```

---

## ⚠️ 风险评估 & 解决方案

### 🚨 技术风险
1. **LLM API 限制** → 多模型备用 + 本地模型
2. **微信封号风险** → 多账号轮换 + 官方API
3. **爬虫反爬** → 代理池 + 请求频率控制
4. **数据质量** → 人工验证 + 持续优化

### 💰 成本控制
1. **LLM 调用费用** → 缓存 + 批量处理
2. **服务器成本** → 按需扩容 + 资源优化
3. **第三方API** → 免费额度 + 多供应商

### 📈 扩展性考虑
1. **消息量增长** → 水平扩展 + 负载均衡
2. **新平台接入** → 插件化架构
3. **多语言支持** → 国际化框架

---

## 🎉 总结

这个方案具有以下优势：

✅ **多渠道统一接入** - 支持邮箱、微信、网页等多种方式
✅ **智能解析** - LLM + 规则引擎双重保障
✅ **高可靠性** - 消息队列 + 重试机制
✅ **可视化管理** - n8n 工作流可视化调试
✅ **质量控制** - 多层去重 + 人工验证
✅ **易于扩展** - 模块化设计，支持新功能接入

**建议优先实现 M0-M1，快速验证核心功能，然后逐步完善其他模块。**
