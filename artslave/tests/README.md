# ArtSlave 测试框架

## 📋 概述

ArtSlave 项目包含完整的测试框架，涵盖单元测试、集成测试和端到端测试，确保系统的稳定性和可靠性。

## 🧪 测试类型

### 1. 单元测试 (Unit Tests)
- **文件**: `tests/components.test.tsx`
- **框架**: Jest + React Testing Library
- **覆盖范围**: React 组件、工具函数、业务逻辑

### 2. 集成测试 (Integration Tests)
- **文件**: `tests/integration-test.js`
- **框架**: Node.js + Fetch API
- **覆盖范围**: API 端点、数据库操作、系统集成

### 3. Python 爬虫测试
- **文件**: `crawler/test_crawler.py`
- **框架**: Python unittest
- **覆盖范围**: 爬虫管理器、数据库连接、调度器

## 🚀 运行测试

### 安装依赖
```bash
npm install
```

### 运行所有测试
```bash
npm run test:all
```

### 运行单元测试
```bash
npm run test
```

### 运行集成测试
```bash
npm run test:integration
```

### 运行测试覆盖率
```bash
npm run test:coverage
```

### 监视模式运行测试
```bash
npm run test:watch
```

### CI/CD 测试
```bash
npm run test:ci
```

## 📊 测试覆盖率

目标覆盖率：
- **分支覆盖率**: 70%
- **函数覆盖率**: 70%
- **行覆盖率**: 70%
- **语句覆盖率**: 70%

## 🔧 测试配置

### Jest 配置 (`jest.config.js`)
- 测试环境: jsdom
- 模块映射: `@/` → `src/`
- 覆盖率收集: `src/**/*.{js,jsx,ts,tsx}`
- 测试超时: 10秒

### 测试设置 (`jest.setup.js`)
- 全局 Mock: IntersectionObserver, ResizeObserver, matchMedia
- 存储 Mock: localStorage, sessionStorage
- 控制台警告抑制

## 📝 测试用例

### React 组件测试

#### HomePage
- ✅ 渲染主要导航卡片
- ✅ 显示统计数据
- ✅ 主题切换功能

#### SubmissionsPage
- ✅ 渲染投稿列表
- ✅ 搜索功能
- ✅ 类型筛选
- ✅ 分页功能

#### DataCollectionPage
- ✅ 数据源管理界面
- ✅ 调度器状态显示
- ✅ n8n 集成控制
- ✅ 爬虫启动/停止

#### DataManagementPage
- ✅ 数据库管理界面
- ✅ CRUD 操作
- ✅ 表单验证

### API 端点测试

#### /api/submissions
- ✅ GET: 获取投稿列表
- ✅ POST: 创建新投稿
- ✅ PUT: 更新投稿
- ✅ DELETE: 删除投稿

#### /api/datasources
- ✅ GET: 获取数据源列表
- ✅ POST: 创建数据源
- ✅ PUT: 更新数据源
- ✅ DELETE: 删除数据源

#### /api/crawler
- ✅ GET: 获取爬虫状态
- ✅ POST: 启动爬虫

#### /api/scheduler
- ✅ GET: 获取调度器状态
- ✅ POST: 控制调度器

#### /api/n8n
- ✅ GET: 获取 n8n 状态
- ✅ POST: 控制 n8n 服务

### 系统集成测试

#### 基础功能
- ✅ 主页访问
- ✅ 文件系统结构
- ✅ 数据库连接
- ✅ Python 爬虫系统

#### 数据库操作
- ✅ CRUD 操作完整性
- ✅ 数据验证
- ✅ 错误处理

#### 性能测试
- ✅ 并发请求处理
- ✅ 响应时间测试
- ✅ 资源使用监控

## 🐛 错误处理测试

### 网络错误
- ✅ API 请求失败处理
- ✅ 超时处理
- ✅ 网络中断恢复

### 数据错误
- ✅ 无效数据格式
- ✅ 缺失字段处理
- ✅ 类型错误处理

### 用户错误
- ✅ 表单验证
- ✅ 权限检查
- ✅ 输入清理

## 📈 测试报告

测试运行后会生成以下报告：

### 覆盖率报告
- **位置**: `coverage/lcov-report/index.html`
- **内容**: 详细的代码覆盖率分析

### 集成测试报告
- **位置**: `tests/test-report.json`
- **内容**: 
  ```json
  {
    "timestamp": "2025-01-11T10:00:00.000Z",
    "results": {
      "total": 15,
      "passed": 14,
      "failed": 1,
      "errors": [...]
    },
    "successRate": 93.3,
    "environment": {
      "nodeVersion": "v18.17.0",
      "platform": "win32",
      "baseUrl": "http://localhost:3000"
    }
  }
  ```

## 🔄 持续集成

### GitHub Actions 配置
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
```

### 测试流水线
1. **代码检查**: ESLint + TypeScript
2. **单元测试**: Jest + React Testing Library
3. **集成测试**: API 端点测试
4. **覆盖率检查**: 最低 70% 覆盖率
5. **性能测试**: 响应时间验证

## 🛠️ 测试工具

### 前端测试
- **Jest**: JavaScript 测试框架
- **React Testing Library**: React 组件测试
- **@testing-library/jest-dom**: DOM 断言扩展
- **@testing-library/user-event**: 用户交互模拟

### 后端测试
- **Node.js**: 集成测试运行环境
- **node-fetch**: HTTP 请求测试
- **Python unittest**: Python 爬虫测试

### Mock 工具
- **Jest Mocks**: 函数和模块 Mock
- **MSW**: API Mock 服务
- **Test Fixtures**: 测试数据生成

## 📚 最佳实践

### 测试编写原则
1. **AAA 模式**: Arrange, Act, Assert
2. **单一职责**: 每个测试只验证一个功能
3. **独立性**: 测试之间不相互依赖
4. **可读性**: 清晰的测试名称和描述

### 测试数据管理
1. **使用 Mock 数据**: 避免依赖真实数据
2. **数据隔离**: 每个测试使用独立数据
3. **清理机制**: 测试后清理临时数据

### 性能优化
1. **并行执行**: 利用 Jest 并行能力
2. **选择性运行**: 只运行相关测试
3. **缓存利用**: 复用测试环境设置

## 🚨 故障排除

### 常见问题

#### 测试超时
```bash
# 增加超时时间
jest --testTimeout=30000
```

#### 模块解析错误
```bash
# 检查 Jest 配置中的 moduleNameMapping
```

#### React 组件渲染错误
```bash
# 确保正确导入 @testing-library/jest-dom
```

### 调试技巧

#### 调试单个测试
```bash
npm test -- --testNamePattern="specific test name"
```

#### 查看测试输出
```bash
npm test -- --verbose
```

#### 生成调试信息
```bash
npm test -- --debug
```

## 📞 支持

如有测试相关问题：
1. 查看测试日志和错误信息
2. 检查测试配置文件
3. 参考 Jest 和 React Testing Library 文档
4. 提交 GitHub Issue
