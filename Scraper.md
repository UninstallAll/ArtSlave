# ArtSlave 爬虫功能开发文档

## 📋 项目概述

ArtSlave 爬虫系统是一个专业的艺术投稿信息自动收集平台，用于自动抓取各类艺术展览、驻地项目、比赛征集、资助项目等信息，为艺术家提供全面的投稿机会数据库。

## 🏗️ 现有功能分析

### ✅ 已实现功能

#### 1. 后端爬虫框架 (Python)
- **位置**: `artslave/crawler/`
- **核心组件**:
  - `base_crawler.py`: 基础爬虫类
  - `crawler_manager.py`: 爬虫管理器
  - `demo_crawler.py`: 演示爬虫
  - `database.py`: 数据库操作
  - `config.py`: 配置管理

#### 2. 前端管理界面 (Next.js)
- **数据收集页面** (`/data-collection`):
  - 数据源状态监控
  - 爬虫任务启动/停止
  - 任务历史记录
  - 实时状态更新

- **数据管理页面** (`/data-management`):
  - 投稿信息查看
  - 数据搜索和过滤
  - 手动添加/编辑/删除
  - 数据导出功能

#### 3. API 接口
- **位置**: `artslave/src/app/api/crawler/route.ts`
- **支持操作**:
  - 获取爬虫列表
  - 启动单个爬虫
  - 运行所有爬虫
  - 停止爬虫
  - 获取统计信息

#### 4. 数据结构
- **支持的投稿类型**:
  - 艺术展览 (EXHIBITION)
  - 驻地项目 (RESIDENCY)
  - 比赛征集 (COMPETITION)
  - 资助项目 (GRANT)
  - 学术会议 (CONFERENCE)

## 🛠️ 需要完善的功能

### 1. 数据源管理模块 ⚠️

#### 当前状态
- 前端硬编码了几个示例数据源
- 缺少动态添加/编辑数据源的功能

#### 需要开发
```typescript
// 需要在 data-collection 页面添加
- 数据源CRUD操作界面
- 数据源配置表单（URL、类型、爬取频率等）
- 数据源验证和测试功能
- 数据源分类管理
```

### 2. 爬虫设置模块 ⚠️

#### 当前状态
- 只有基础的启动/停止功能
- 配置参数固定在 `config.py` 中

#### 需要开发
```typescript
// 需要新建 /crawler-settings 页面
- 爬虫参数配置界面
- 定时任务设置
- 爬取频率控制
- 代理设置
- 请求头配置
- 错误处理策略
```

### 3. 爬虫结果展示模块 ⚠️

#### 当前状态
- 基础的任务历史记录
- 简单的成功/失败状态

#### 需要开发
```typescript
// 需要增强现有功能
- 详细的爬取日志查看
- 数据质量分析
- 重复数据检测
- 错误日志详情
- 性能统计图表
```

### 4. 数据库导入优化 ⚠️

#### 当前状态
- 基础的数据保存功能
- 简单的重复检测

#### 需要开发
```typescript
// 需要优化现有功能
- 智能数据去重
- 数据清洗和验证
- 批量导入优化
- 数据同步机制
- 冲突处理策略
```

## 📅 开发计划

### Phase 1: 数据源管理完善 (1-2周)

#### 1.1 数据源配置数据模型
```sql
-- 需要在 Prisma Schema 中添加
model DataSource {
  id          String   @id @default(cuid())
  name        String
  url         String
  type        String   // website, api, rss
  category    String   // 数据源分类
  isActive    Boolean  @default(true)
  crawlFreq   Int      @default(24) // 爬取频率(小时)
  lastCrawl   DateTime?
  config      Json?    // 额外配置
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 1.2 数据源管理API
```typescript
// 需要创建 /api/datasources/route.ts
- GET: 获取数据源列表
- POST: 创建新数据源
- PUT: 更新数据源
- DELETE: 删除数据源
- POST /test: 测试数据源连接
```

#### 1.3 数据源管理界面
```typescript
// 需要在 data-collection 页面添加
- 数据源表格显示
- 添加/编辑数据源对话框
- 数据源状态监控
- 批量操作功能
```

### Phase 2: 爬虫设置中心 (1-2周)

#### 2.1 爬虫配置页面
```typescript
// 需要创建 /crawler-settings 页面
- 全局爬虫设置
- 单个爬虫配置
- 定时任务管理
- 性能监控设置
```

#### 2.2 定时任务系统
```typescript
// 需要添加 node-cron 或类似定时任务
- 定时爬虫执行
- 任务队列管理
- 任务失败重试
- 并发控制
```

#### 2.3 爬虫配置API
```typescript
// 需要创建 /api/crawler-config/route.ts
- 获取/更新爬虫配置
- 定时任务CRUD
- 爬虫性能统计
```

### Phase 3: 结果展示优化 (1周)

#### 3.1 详细日志系统
```python
# 需要在 Python 爬虫中添加
- 结构化日志记录
- 日志等级管理
- 日志存储和查询
```

#### 3.2 数据质量分析
```typescript
// 需要在数据管理页面添加
- 数据完整性检查
- 重复数据统计
- 数据质量评分
- 异常数据标记
```

#### 3.3 可视化图表
```typescript
// 使用 Recharts 添加
- 爬取数量趋势图
- 数据源贡献比例
- 成功率统计
- 性能监控图表
```

### Phase 4: 高级功能 (2-3周)

#### 4.1 智能数据处理
```python
# 需要集成 AI 功能
- 投稿信息分类
- 内容质量评估
- 关键词提取
- 相似度检测
```

#### 4.2 用户个性化
```typescript
// 需要添加用户相关功能
- 个人关注数据源
- 自定义爬虫规则
- 个性化推荐
- 订阅通知
```

#### 4.3 数据导出增强
```typescript
// 需要在数据管理页面添加
- 多格式导出 (Excel, CSV, JSON)
- 定制化导出模板
- 自动化报告生成
- 数据同步到外部系统
```

## 🔧 技术实现细节

### 1. 数据源管理实现

#### 前端组件结构
```typescript
// 需要创建的组件
components/
├── DataSourceManager/
│   ├── DataSourceList.tsx
│   ├── DataSourceForm.tsx
│   ├── DataSourceTest.tsx
│   └── DataSourceStatus.tsx
```

#### 数据源配置表单
```typescript
// DataSourceForm.tsx 需要的字段
interface DataSourceConfig {
  name: string
  url: string
  type: 'website' | 'api' | 'rss'
  category: string
  crawlFreq: number
  headers?: Record<string, string>
  params?: Record<string, string>
  selector?: string // CSS选择器
  pagination?: {
    enabled: boolean
    maxPages: number
    nextSelector: string
  }
}
```

### 2. 爬虫设置实现

#### 配置管理系统
```python
# config.py 需要扩展
class CrawlerConfig:
    def __init__(self):
        self.global_settings = {
            'delay': 1.0,
            'timeout': 30,
            'retries': 3,
            'concurrent_limit': 5,
            'user_agent': 'ArtSlave-Bot/1.0'
        }
        
    def get_crawler_config(self, crawler_name: str):
        # 获取特定爬虫配置
        pass
        
    def update_config(self, config: dict):
        # 更新配置
        pass
```

#### 定时任务管理
```typescript
// 需要创建 /api/scheduler/route.ts
- 任务创建和管理
- Cron 表达式验证
- 任务执行监控
- 任务历史记录
```

### 3. 结果展示优化

#### 日志查看组件
```typescript
// 需要创建 LogViewer.tsx
- 实时日志流
- 日志过滤和搜索
- 日志等级显示
- 错误日志高亮
```

#### 数据质量分析
```python
# 需要添加 data_quality.py
class DataQualityAnalyzer:
    def analyze_completeness(self, data: dict):
        # 数据完整性分析
        pass
        
    def detect_duplicates(self, submissions: list):
        # 重复数据检测
        pass
        
    def calculate_quality_score(self, submission: dict):
        # 质量评分计算
        pass
```

## 🚀 快速开始指南

### 1. 环境准备
```bash
# 1. 安装 Python 依赖
cd artslave/crawler
pip install -r requirements.txt

# 2. 安装 Node.js 依赖
cd ..
npm install

# 3. 数据库设置
npx prisma db push
```

### 2. 开发步骤

#### Step 1: 完善数据源管理
1. 更新 Prisma Schema 添加 DataSource 模型
2. 创建数据源管理API
3. 修改前端数据收集页面
4. 添加数据源 CRUD 功能

#### Step 2: 添加爬虫设置
1. 创建爬虫设置页面
2. 实现配置API
3. 添加定时任务系统
4. 完善爬虫配置管理

#### Step 3: 优化结果展示
1. 添加详细日志系统
2. 实现数据质量分析
3. 添加可视化图表
4. 完善错误处理

### 3. 测试验证
```bash
# 测试爬虫功能
python crawler/test_crawler.py

# 测试API接口
npm run test:api

# 端到端测试
npm run test:e2e
```

## 📊 性能优化建议

### 1. 爬虫性能
- 使用异步请求池
- 实现智能延迟控制
- 添加请求缓存机制
- 优化数据解析算法

### 2. 数据库性能
- 添加适当的索引
- 实现分页查询
- 使用数据库连接池
- 优化批量插入操作

### 3. 前端性能
- 实现虚拟滚动
- 添加数据懒加载
- 优化图表渲染
- 使用 Web Worker 处理大量数据

## 🔒 安全考虑

### 1. 爬虫合规
- 遵守 robots.txt
- 实现合理的请求频率
- 添加用户代理标识
- 避免过度请求

### 2. 数据安全
- 敏感配置加密存储
- API 接口权限控制
- 数据访问日志记录
- 定期安全审计

## 📈 监控和维护

### 1. 监控指标
- 爬虫成功率
- 数据收集量
- 响应时间
- 错误率统计

### 2. 维护计划
- 定期清理旧数据
- 更新爬虫规则
- 性能调优
- 安全更新

## 🎯 总结

该爬虫系统已经有了良好的基础架构，主要需要完善的是：

1. **数据源管理** - 从硬编码改为动态配置
2. **爬虫设置** - 添加可视化配置界面
3. **结果展示** - 增强日志和分析功能
4. **数据处理** - 优化去重和质量控制

按照上述开发计划，预计 4-6 周可以完成全部功能的开发和测试。建议优先完成 Phase 1 和 Phase 2，确保核心功能稳定后再添加高级功能。
