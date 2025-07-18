# ArtSlave n8n 工作流集成

## 📋 概述

ArtSlave 集成了 n8n 工作流自动化平台，用于实现数据收集、AI 匹配、投稿流程等自动化任务。

## 🚀 功能特性

### 1. 自动化数据收集
- **定时爬虫执行**: 每6小时自动检查并运行需要更新的数据源
- **智能频率控制**: 根据数据源配置的爬取频率自动调度
- **状态监控**: 实时监控爬虫执行状态和结果
- **错误处理**: 自动处理爬虫失败情况并发送通知

### 2. AI 智能匹配
- **自动 AI 分析**: 对新收集的投稿信息进行 AI 匹配分析
- **推荐生成**: 基于用户偏好生成个性化推荐
- **数据更新**: 自动更新投稿记录的 AI 匹配结果

### 3. 通知系统
- **实时通知**: 爬虫完成、AI 匹配完成等事件通知
- **多渠道支持**: 支持邮件、Webhook、数据库记录等通知方式
- **状态跟踪**: 完整的任务执行历史记录

## 🛠️ 安装和配置

### 1. 启动 n8n

在 ArtSlave 数据收集管理页面中：

1. 点击 "安装 n8n" 按钮（如果未安装）
2. 点击 "启动 n8n" 按钮
3. 点击 "打开 n8n" 按钮访问 n8n 界面

### 2. 导入工作流

1. 在 n8n 界面中，点击 "Import from File"
2. 选择以下工作流文件：
   - `workflows/artslave-data-sync.json` - 数据同步工作流
   - `workflows/automated-crawler.json` - 自动化数据收集工作流

### 3. 配置 API 端点

确保以下 API 端点可访问：
- `http://localhost:3000/api/submissions` - 投稿数据 API
- `http://localhost:3000/api/datasources` - 数据源管理 API
- `http://localhost:3000/api/crawler` - 爬虫控制 API
- `http://localhost:3000/api/ai/match` - AI 匹配 API
- `http://localhost:3000/api/notifications` - 通知 API

## 📊 工作流详情

### 1. 数据同步工作流 (artslave-data-sync.json)

**触发方式**: 手动触发或 Webhook
**主要功能**:
- 获取投稿数据
- AI 匹配分析
- 更新投稿记录
- 发送完成通知

**执行流程**:
```
开始 → 获取投稿数据 → 检查响应 → 处理数据 → AI 匹配分析 → 更新投稿记录 → 发送通知 → 记录日志
```

### 2. 自动化数据收集工作流 (automated-crawler.json)

**触发方式**: 定时触发（每6小时）
**主要功能**:
- 自动检查数据源
- 启动爬虫任务
- 监控执行状态
- 更新数据源信息

**执行流程**:
```
定时触发器 → 获取数据源列表 → 筛选需要爬取的数据源 → 启动爬虫 → 等待完成 → 检查状态 → 更新数据源状态 → 发送通知
```

## 🔧 自定义配置

### 1. 修改爬取频率

在 `automated-crawler.json` 工作流中：
- 修改 "定时触发器" 节点的 `interval` 参数
- 默认为每6小时执行一次

### 2. 添加新的数据源

1. 在 ArtSlave 数据收集页面添加新数据源
2. 工作流会自动检测并包含新数据源

### 3. 自定义通知

修改工作流中的 "发送通知" 节点：
- 更改通知类型
- 添加邮件通知
- 集成 Slack、Discord 等

## 🔗 API 集成

### 数据源 API

```javascript
// 获取数据源列表
GET /api/datasources

// 更新数据源状态
PUT /api/datasources/{id}
{
  "lastCrawled": "2025-01-11T10:00:00Z",
  "itemsFound": 25,
  "status": "completed"
}
```

### 爬虫 API

```javascript
// 启动爬虫
POST /api/crawler
{
  "action": "run",
  "crawler": "demo"
}

// 获取爬虫状态
GET /api/crawler/status
```

### AI 匹配 API

```javascript
// AI 匹配分析
POST /api/ai/match
{
  "submissionId": "123",
  "submissionData": {...}
}
```

## 📝 最佳实践

### 1. 监控和日志
- 定期检查工作流执行历史
- 监控 n8n 日志文件
- 设置关键指标告警

### 2. 性能优化
- 合理设置爬取频率
- 避免同时运行过多爬虫
- 监控系统资源使用

### 3. 错误处理
- 为每个工作流添加错误处理节点
- 设置重试机制
- 记录详细的错误信息

## 🚨 故障排除

### 常见问题

1. **n8n 启动失败**
   - 检查端口 5678 是否被占用
   - 确保有足够的系统权限
   - 查看 n8n 日志文件

2. **工作流执行失败**
   - 检查 API 端点是否可访问
   - 验证请求参数格式
   - 查看 n8n 执行日志

3. **爬虫无法启动**
   - 确保 Python 环境正确配置
   - 检查爬虫脚本路径
   - 验证数据库连接

### 日志位置

- n8n 日志: `artslave/n8n/n8n.log`
- 爬虫日志: `artslave/crawler/crawler_detailed.log`
- 调度器日志: `artslave/crawler/crawler_scheduler.log`

## 🔄 更新和维护

### 定期维护任务

1. **清理旧日志**: 定期清理过期的日志文件
2. **更新工作流**: 根据需求更新工作流配置
3. **监控性能**: 检查工作流执行效率
4. **备份配置**: 定期备份 n8n 工作流配置

### 版本更新

1. 停止 n8n 服务
2. 更新 n8n 版本: `npm update -g n8n`
3. 重启 n8n 服务
4. 验证工作流正常运行

## 📞 支持

如有问题或建议，请：
1. 查看 n8n 官方文档: https://docs.n8n.io/
2. 检查 ArtSlave 项目文档
3. 提交 GitHub Issue
