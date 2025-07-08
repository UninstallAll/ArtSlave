# ArtSlave 技术栈架构文档

## 架构演进策略

### 渐进式技术栈演进
```
Phase 1: Next.js 单体应用 (MVP)
    ↓
Phase 2: Next.js + Python 爬虫服务
    ↓  
Phase 3: 微服务架构 (按需拆分)
```

## Phase 1: MVP 技术栈 (推荐起步)

### 前端技术栈
```typescript
框架: Next.js 14 (App Router)
语言: TypeScript
样式: Tailwind CSS + Shadcn/ui
状态管理: Zustand 或 React Query
表单处理: React Hook Form + Zod
图表: Recharts
文件上传: React Dropzone
```

### 后端技术栈
```typescript
运行时: Node.js 18+
框架: Next.js API Routes
ORM: Prisma (类型安全)
数据库: PostgreSQL (Supabase)
认证: Supabase Auth
文件存储: Supabase Storage
缓存: Redis (Upstash)
```

### AI 集成
```typescript
大语言模型: OpenAI GPT-4 / Claude API
AI 工作流: LangChain.js
向量数据库: Supabase Vector (pgvector)
文本嵌入: OpenAI Embeddings API
```

### 数据收集 (简单版)
```typescript
网页爬虫: Puppeteer + Cheerio
HTTP 请求: Axios
定时任务: node-cron
任务队列: Bull Queue + Redis
```

### 部署和运维
```yaml
应用部署: Vercel
数据库: Supabase
缓存/队列: Upstash Redis
监控: Vercel Analytics + Sentry
域名/CDN: Vercel
```

## Phase 2: 混合架构 (扩展阶段)

### 保留 Next.js 主应用
```typescript
// 主应用继续使用 Next.js
// 处理用户界面、认证、基础业务逻辑
```

### 添加 Python 爬虫服务
```python
框架: FastAPI
爬虫: Scrapy + BeautifulSoup
任务队列: Celery + Redis
数据处理: Pandas + NumPy
部署: Docker + Railway/Render
```

### 服务间通信
```yaml
协议: REST API / GraphQL
认证: JWT Token 共享
数据同步: 消息队列 (Redis Pub/Sub)
```

## Phase 3: 微服务架构 (大规模)

### 核心服务拆分
```yaml
用户服务: Next.js (用户管理、认证)
内容服务: Node.js/Go (投稿信息管理)
匹配服务: Python (AI 算法和推荐)
爬虫服务: Python (数据收集)
通知服务: Node.js (邮件、推送)
文件服务: Go/Rust (文件处理)
```

### 基础设施
```yaml
容器化: Docker + Kubernetes
API 网关: Kong / Traefik
服务发现: Consul / etcd
消息队列: RabbitMQ / Apache Kafka
监控: Prometheus + Grafana
日志: ELK Stack
```

## 技术选择理由

### 为什么选择 Next.js 作为主框架？
- **全栈能力**: 前后端一体化开发
- **TypeScript 原生支持**: 类型安全，减少 bug
- **优秀的开发体验**: 热重载、自动优化
- **部署简单**: Vercel 一键部署
- **SEO 友好**: SSR/SSG 支持
- **生态丰富**: npm 包生态完善

### 为什么选择 Supabase？
- **PostgreSQL**: 功能强大的关系型数据库
- **实时功能**: WebSocket 支持
- **认证系统**: 开箱即用
- **文件存储**: S3 兼容
- **向量搜索**: AI 功能支持
- **免费额度**: 适合 MVP 阶段

### AI 功能技术选择
```typescript
// 简单 AI 调用
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 复杂 AI 工作流
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
```

### 后期扩展能力
```python
# 当需要复杂 AI 功能时，添加 Python 服务
from langchain.llms import OpenAI
from transformers import pipeline
import torch

# 本地模型推理
model = pipeline("text-classification", 
                model="bert-base-uncased")
```

## 开发工具链

### 开发环境
```json
{
  "editor": "VS Code + 扩展包",
  "包管理": "pnpm (性能最佳)",
  "代码格式": "Prettier + ESLint",
  "Git 工作流": "GitHub Flow",
  "API 测试": "Postman / Insomnia"
}
```

### CI/CD 流程
```yaml
代码提交: GitHub
自动测试: GitHub Actions
部署: Vercel (自动部署)
数据库迁移: Prisma Migrate
环境管理: Vercel Environment Variables
```

## 成本估算 (MVP 阶段)

### 免费额度
```yaml
Vercel: 免费版足够 MVP
Supabase: 免费版 (2个项目，500MB数据库)
OpenAI API: 按使用量付费
Upstash Redis: 免费版 (10K 请求/天)
```

### 预期月成本 (1000 活跃用户)
```yaml
Vercel Pro: $20/月
Supabase Pro: $25/月  
OpenAI API: $50-100/月 (取决于使用量)
总计: ~$100/月
```

## 迁移策略

### 从 Next.js 到微服务
```typescript
// 1. 保持 Next.js 作为主应用
// 2. 逐步抽取独立服务
// 3. 通过 API 网关统一入口
// 4. 数据库按服务拆分
```

### 数据迁移
```sql
-- 使用 Prisma 管理数据库 schema
-- 支持平滑迁移和回滚
npx prisma migrate dev
npx prisma migrate deploy
```

这个架构的最大优势是**可以从简单开始，按需复杂化**。您觉得这个技术栈规划如何？需要我详细解释某个部分吗？
