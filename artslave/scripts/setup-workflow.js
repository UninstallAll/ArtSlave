#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 配置 ArtSlave 工作流环境...');

// 创建必要的目录结构
const directories = [
  'n8n/workflows',
  'n8n/credentials', 
  'n8n/config',
  'n8n/logs',
  'n8n/custom'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log('📁 创建目录:', dir);
  }
});

// 创建 package.json 如果不存在
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // 添加 n8n 相关脚本
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['n8n:start'] = 'node scripts/start-n8n.js';
  packageJson.scripts['n8n:dev'] = 'N8N_LOG_LEVEL=debug node scripts/start-n8n.js';
  packageJson.scripts['workflow:setup'] = 'node scripts/setup-workflow.js';
  
  // 确保 n8n 依赖存在
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  
  if (!packageJson.dependencies.n8n) {
    console.log('📦 添加 n8n 依赖到 package.json');
    packageJson.dependencies.n8n = '^1.0.0';
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ 更新 package.json');
}

// 创建环境变量模板
const envTemplatePath = path.join(__dirname, '..', '.env.workflow.example');
const envTemplate = `# n8n 工作流配置
N8N_URL=http://localhost:5678
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678

# 数据库配置 (n8n 使用)
N8N_DB_TYPE=sqlite
N8N_DB_SQLITE_DATABASE=./n8n/database.sqlite

# 日志配置
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console,file
N8N_LOG_FILE_LOCATION=./n8n/logs/

# 安全配置
N8N_BASIC_AUTH_ACTIVE=false
N8N_DISABLE_UI=false

# 执行配置
EXECUTIONS_PROCESS=main
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200

# 工作流配置
N8N_DEFAULT_LOCALE=zh-CN
N8N_METRICS=true
`;

if (!fs.existsSync(envTemplatePath)) {
  fs.writeFileSync(envTemplatePath, envTemplate);
  console.log('📝 创建环境变量模板:', '.env.workflow.example');
}

// 创建工作流说明文档
const workflowReadmePath = path.join(__dirname, '..', 'n8n', 'README.md');
const workflowReadme = `# ArtSlave 工作流配置

## 快速开始

### 1. 安装依赖
\`\`\`bash
npm install
\`\`\`

### 2. 启动 n8n
\`\`\`bash
npm run n8n:start
\`\`\`

### 3. 访问 n8n 界面
打开浏览器访问: http://localhost:5678

## 工作流说明

### 1. ArtSlave 数据同步工作流 (artslave-data-sync.json)
- **功能**: 同步投稿信息数据，生成统计报告
- **触发方式**: 手动触发或定时执行
- **API 端点**: 
  - GET /api/workflow/data/submissions
  - GET /api/workflow/data/stats

### 2. 信息投递自动化工作流 (submission-automation.json)
- **功能**: AI 匹配用户与投稿信息，自动发送推荐
- **触发方式**: 手动触发或事件驱动
- **API 端点**:
  - GET /api/workflow/data/submissions
  - GET /api/workflow/data/users
  - POST /api/ai-matches
  - POST /api/notifications

## 导入工作流

1. 在 n8n 界面中点击 "Import from File"
2. 选择 \`workflows/\` 目录下的 JSON 文件
3. 配置必要的凭据和连接
4. 激活工作流

## API 集成

工作流通过以下 API 与 ArtSlave 系统集成:

- \`/api/workflow/status\` - 检查 n8n 连接状态
- \`/api/workflow/list\` - 获取工作流列表
- \`/api/workflow/execute/{id}\` - 执行指定工作流
- \`/api/workflow/monitor\` - 获取执行监控数据
- \`/api/workflow/data/*\` - 数据访问接口

## 故障排除

### n8n 无法启动
1. 检查端口 5678 是否被占用
2. 确保有足够的磁盘空间
3. 检查 Node.js 版本 (推荐 18+)

### 工作流执行失败
1. 检查 API 端点是否可访问
2. 验证数据库连接
3. 查看 n8n 日志文件

### 数据同步问题
1. 确保数据库 schema 正确
2. 检查 API 权限配置
3. 验证数据格式

## 开发模式

启动开发模式 (详细日志):
\`\`\`bash
npm run n8n:dev
\`\`\`

## 生产部署

1. 设置环境变量
2. 配置反向代理
3. 启用 HTTPS
4. 设置监控和日志
`;

if (!fs.existsSync(workflowReadmePath)) {
  fs.writeFileSync(workflowReadmePath, workflowReadme);
  console.log('📚 创建工作流文档:', 'n8n/README.md');
}

console.log('\n✅ 工作流环境配置完成!');
console.log('\n📋 下一步操作:');
console.log('1. 运行 npm install 安装依赖');
console.log('2. 运行 npm run n8n:start 启动 n8n');
console.log('3. 访问 http://localhost:5678 配置工作流');
console.log('4. 在 ArtSlave 应用中访问 /workflow 页面管理工作流');
console.log('\n💡 查看 n8n/README.md 获取详细说明');
