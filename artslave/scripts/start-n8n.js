#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// n8n 配置
const N8N_CONFIG = {
  N8N_HOST: '0.0.0.0',
  N8N_PORT: '5678',
  N8N_PROTOCOL: 'http',
  WEBHOOK_URL: 'http://localhost:5678',
  N8N_BASIC_AUTH_ACTIVE: 'false',
  N8N_DISABLE_UI: 'false',
  N8N_METRICS: 'true',
  N8N_LOG_LEVEL: 'info',
  N8N_USER_FOLDER: path.join(__dirname, '..', 'n8n'),
  N8N_CUSTOM_EXTENSIONS: path.join(__dirname, '..', 'n8n', 'custom'),
  DB_TYPE: 'sqlite',
  DB_SQLITE_DATABASE: path.join(__dirname, '..', 'n8n', 'database.sqlite'),
  EXECUTIONS_PROCESS: 'main',
  EXECUTIONS_MODE: 'regular',
  N8N_DEFAULT_LOCALE: 'zh-CN'
};

console.log('🚀 启动 n8n 工作流引擎...');
console.log('📁 工作目录:', N8N_CONFIG.N8N_USER_FOLDER);
console.log('🌐 访问地址: http://localhost:5678');

// 确保目录存在
const dirs = [
  N8N_CONFIG.N8N_USER_FOLDER,
  path.join(N8N_CONFIG.N8N_USER_FOLDER, 'workflows'),
  path.join(N8N_CONFIG.N8N_USER_FOLDER, 'credentials'),
  path.dirname(N8N_CONFIG.DB_SQLITE_DATABASE)
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('📂 创建目录:', dir);
  }
});

// 启动 n8n
const n8nProcess = spawn('npx', ['n8n', 'start'], {
  env: {
    ...process.env,
    ...N8N_CONFIG
  },
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

// 处理进程事件
n8nProcess.on('error', (error) => {
  console.error('❌ n8n 启动失败:', error.message);
  process.exit(1);
});

n8nProcess.on('close', (code) => {
  console.log(`🔄 n8n 进程退出，退出码: ${code}`);
  if (code !== 0) {
    console.error('❌ n8n 异常退出');
    process.exit(code);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭 n8n...');
  n8nProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭 n8n...');
  n8nProcess.kill('SIGTERM');
});

// 导入工作流
setTimeout(async () => {
  try {
    console.log('📥 检查工作流导入...');
    
    const workflowsDir = path.join(__dirname, '..', 'n8n', 'workflows');
    const workflowFiles = fs.readdirSync(workflowsDir).filter(file => file.endsWith('.json'));
    
    if (workflowFiles.length > 0) {
      console.log(`📋 发现 ${workflowFiles.length} 个工作流文件:`);
      workflowFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
      
      console.log('💡 提示: 请在 n8n 界面中手动导入这些工作流文件');
      console.log('   1. 访问 http://localhost:5678');
      console.log('   2. 点击 "Import from File"');
      console.log('   3. 选择工作流文件进行导入');
    }
  } catch (error) {
    console.warn('⚠️  工作流检查失败:', error.message);
  }
}, 5000);

console.log('✅ n8n 启动脚本运行中...');
console.log('💡 按 Ctrl+C 停止服务');
