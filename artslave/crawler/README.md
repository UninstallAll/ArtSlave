# ArtSlave 数据收集爬虫系统

## 概述

ArtSlave 爬虫系统负责自动收集各类艺术投稿信息，包括：
- 艺术展览（个展、群展、主题展）
- 驻地项目（国内外艺术驻地）
- 比赛征集（艺术比赛、奖项申请）
- 资助项目（政府资助、基金会支持）
- 学术会议（研讨会、论坛）

## 系统架构

```
Frontend (Next.js) 
    ↓ API调用
Next.js API Routes (/api/crawler)
    ↓ 进程调用
Python 爬虫管理器 (crawler_manager.py)
    ↓ 协调
各种爬虫类 (demo_crawler.py, ...)
    ↓ 数据存储
PostgreSQL 数据库
```

## 安装和配置

### 1. 安装 Python 依赖

```bash
cd crawler
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/artslave
```

### 3. 数据库初始化

确保 PostgreSQL 数据库已创建，并且 Prisma schema 已同步：

```bash
cd ..
npx prisma db push
```

## 使用方法

### 命令行使用

```bash
# 列出所有可用爬虫
python crawler_manager.py list

# 运行指定爬虫
python crawler_manager.py run --crawler demo

# 运行所有爬虫
python crawler_manager.py run-all

# 查看今日统计
python crawler_manager.py stats

# 清理旧任务记录
python crawler_manager.py cleanup --days 7
```

### Web界面使用

1. 启动 Next.js 开发服务器：
```bash
npm run dev
```

2. 访问数据收集管理页面：
```
http://localhost:3000/data-collection
```

3. 在界面上可以：
   - 查看数据源状态
   - 启动单个爬虫
   - 运行所有爬虫
   - 查看任务历史

## 爬虫开发

### 创建新爬虫

1. 继承 `BaseCrawler` 类：

```python
from base_crawler import BaseCrawler

class MyCustomCrawler(BaseCrawler):
    def __init__(self):
        super().__init__("我的爬虫", "https://example.com")
    
    def crawl(self):
        # 实现具体的爬取逻辑
        response = self.make_request(self.base_url)
        if response:
            # 解析页面内容
            # 提取投稿信息
            # 调用 self.save_submission_info(data) 保存
            pass
```

2. 在 `crawler_manager.py` 中注册：

```python
from my_custom_crawler import MyCustomCrawler

class CrawlerManager:
    def __init__(self):
        self.crawlers = {
            'demo': DemoCrawler,
            'my_custom': MyCustomCrawler,  # 添加新爬虫
        }
```

### 数据格式

爬虫保存的数据应符合以下格式：

```python
data = {
    'title': '投稿标题',
    'description': '详细描述',
    'type': 'EXHIBITION',  # EXHIBITION, RESIDENCY, COMPETITION, GRANT, CONFERENCE
    'organizer': '主办方',
    'deadline': '2025-12-31',  # 截止日期
    'location': '地点',
    'website': 'https://example.com',
    'contact': 'contact@example.com, +86-123-4567-8900',
    'fee': 100.00,  # 报名费（可选）
    'prize': '奖金或奖品描述',
    'requirements': {},  # 要求详情（JSON格式）
    'tags': ['标签1', '标签2']
}
```

## 监控和维护

### 日志查看

爬虫运行日志会输出到控制台，可以通过以下方式查看：

```bash
# 运行爬虫并保存日志
python crawler_manager.py run --crawler demo > crawler.log 2>&1
```

### 性能优化

- 调整 `config.py` 中的 `CRAWL_DELAY` 来控制请求频率
- 使用 `MAX_RETRIES` 设置重试次数
- 定期清理旧的任务记录

### 错误处理

- 网络错误：自动重试机制
- 数据解析错误：记录错误日志，跳过问题数据
- 数据库错误：事务回滚，保证数据一致性

## 扩展功能

### 计划任务

可以使用 cron 或其他任务调度器定期运行爬虫：

```bash
# 每天凌晨2点运行所有爬虫
0 2 * * * cd /path/to/artslave/crawler && python crawler_manager.py run-all
```

### 通知系统

可以在爬虫完成后发送通知：

```python
# 在 crawler_manager.py 中添加
def send_notification(message):
    # 发送邮件、微信、Slack等通知
    pass
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确认数据库服务正在运行

2. **爬虫运行失败**
   - 检查目标网站是否可访问
   - 验证网站结构是否发生变化

3. **API调用失败**
   - 确认 Next.js 服务器正在运行
   - 检查 Python 环境和依赖

### 调试模式

在开发时可以启用详细日志：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```
