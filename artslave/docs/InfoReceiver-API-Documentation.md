# InfoReceiver API 系统文档

## 📖 概述

InfoReceiver 是为 ArtSlave 平台开发的智能信息接收和处理系统，专门为艺术家和研究者设计，用来自动化处理各种投稿信息。

## 🎯 核心功能

### 1. 多渠道信息接收
- **邮件接收** (`/api/info-receiver/email`)：处理邮箱中的投稿通知
- **微信接收** (`/api/info-receiver/wechat`)：处理微信群/公众号的投稿信息
- **社交媒体** (`/api/info-receiver/social`)：处理社交平台的投稿信息
- **网页抓取** (`/api/info-receiver/resources`)：自动抓取网站投稿信息
- **手动提交** (`/api/info-receiver/submit`)：用户手动输入信息

### 2. 智能内容解析
使用 LLM（大语言模型）自动从非结构化文本中提取：
- 投稿标题
- 主办方信息
- 截止日期
- 地点信息
- 投稿要求
- 联系方式
- 奖金/资助金额
- 投稿类型（展览/驻地/比赛/资助/会议）

### 3. 数据标准化
将各种格式的信息统一转换为结构化数据，存储到数据库中。

## 🏗️ 技术架构

### 核心组件
```
src/lib/infoReceiver/
├── infoReceiverService.ts    # 主服务协调器
├── llmParser.ts             # LLM 智能解析器
├── contentCrawler.ts        # 网页内容爬虫
├── database.ts              # 数据库操作层
├── monitoring.ts            # 系统监控
├── test.ts                  # 测试工具
├── types.ts                 # 类型定义
└── deduplication.ts         # 去重处理
```

### API 路由
```
src/app/api/info-receiver/
├── email/route.ts           # 邮件接收处理
├── wechat/route.ts          # 微信消息处理
├── social/route.ts          # 社交媒体处理
├── submit/route.ts          # 手动提交
├── resources/route.ts       # 资源管理
└── test/route.ts            # 测试接口
```

## 🌊 工作流程

1. **信息输入** → 多渠道接收原始信息
2. **内容预处理** → 清理和格式化文本
3. **LLM 解析** → AI 提取结构化数据
4. **数据验证** → 验证解析结果的准确性
5. **去重检查** → 避免重复信息
6. **存储到数据库** → 持久化存储
7. **质量检查** → 自动质量评估
8. **用户界面展示** → 在前端展示结果

## 📊 数据模型

### 原始消息 (RawMessage)
```typescript
{
  id: string
  source: MessageSource  // EMAIL, WECHAT, SOCIAL, WEB, API
  content: string        // 原始内容
  links: string[]        // 链接列表
  images: string[]       // 图片列表
  attachments: string[]  // 附件列表
  metadata: Json         // 元数据
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 处理后资源 (ProcessedResource)
```typescript
{
  id: string
  messageId: string      // 关联原始消息
  title: string          // 投稿标题
  organizer: string      // 主办方
  deadline: DateTime     // 截止日期
  location: string       // 地点
  type: SubmissionType   // 投稿类型
  requirements: Json     // 投稿要求
  contactInfo: Json      // 联系信息
  status: ResourceStatus // 处理状态
  confidence: number     // 解析置信度
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🔧 API 接口

### 1. 手动提交接口
```http
POST /api/info-receiver/submit
Content-Type: application/json

{
  "source": "WEB",
  "content": "投稿信息文本内容",
  "links": ["https://example.com"],
  "metadata": {
    "testMode": true
  }
}
```

### 2. 邮件接收接口
```http
POST /api/info-receiver/email
Content-Type: application/json

{
  "from": "sender@example.com",
  "subject": "投稿通知",
  "body": "邮件正文内容",
  "attachments": []
}
```

### 3. 测试接口
```http
POST /api/info-receiver/test
Content-Type: application/json

{
  "testType": "functional" | "performance",
  "options": {
    "concurrency": 3,
    "messageCount": 10
  }
}
```

## 🎛️ 配置选项

### 环境变量
```bash
# AI Services
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENAI_API_KEY=your_openai_api_key_backup

# Database
DATABASE_URL="file:./dev.db"

# External Integrations
CHERRYSTUDIO_API_URL=http://localhost:8000
N8N_WEBHOOK_URL=your_n8n_webhook_url

# Email Service
RESEND_API_KEY=your_resend_api_key
```

### LLM 配置
```typescript
const llmConfig: LLMConfig = {
  provider: 'openai' | 'anthropic' | 'google' | 'local',
  model: 'gpt-4' | 'claude-3-sonnet' | 'gemini-pro',
  apiKey: process.env.OPENAI_API_KEY,
  maxTokens: 4000,
  temperature: 0.1,
  timeout: 30000
}
```

## 📈 监控和测试

### 系统监控
- 处理成功率统计
- 响应时间监控
- 错误率追踪
- 资源使用情况

### 测试工具
- **功能测试**：验证解析准确性
- **性能测试**：测试并发处理能力
- **集成测试**：端到端流程验证

## 🚀 使用示例

### 场景1：邮箱自动处理
```
输入：
"【征集通知】2024年国际当代艺术展
主办方：北京当代艺术馆
展览时间：2024年8月15日-10月15日
申请截止：2024年6月30日..."

输出：
{
  "title": "2024年国际当代艺术展",
  "organizer": "北京当代艺术馆",
  "deadline": "2024-06-30",
  "type": "EXHIBITION",
  "confidence": 0.95
}
```

### 场景2：微信群信息处理
```
输入：
"🎨 第五届青年艺术家大赛开始征集！
奖金：一等奖10万元
截止时间：2024年7月20日..."

输出：
{
  "title": "第五届青年艺术家大赛",
  "type": "COMPETITION",
  "deadline": "2024-07-20",
  "prize": "一等奖10万元",
  "confidence": 0.92
}
```

## 🔗 相关链接

- 测试界面：`http://localhost:3001/test-info-receiver`
- 数据管理：`http://localhost:3001/data-management`
- API 文档：本文档
- 源码位置：`src/lib/infoReceiver/`

## 📝 更新日志

- **v1.0.0** (2024-01-25)：初始版本，完成基础框架
- 支持多渠道信息接收
- 集成 LLM 智能解析
- 实现数据库存储和管理
- 提供测试和监控工具

---

*最后更新：2024-01-25*
*文档版本：v1.0.0*
