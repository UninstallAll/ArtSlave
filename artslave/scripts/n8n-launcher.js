#!/usr/bin/env node

/**
 * n8n 独立启动器
 * 避免与 ArtSlave 项目依赖冲突
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_DIR = path.join(__dirname, '..', 'n8n');

console.log('🚀 启动 n8n 独立进程...');
console.log(`📁 工作目录: ${N8N_DIR}`);
console.log(`🌐 端口: ${N8N_PORT}`);

// 确保目录存在
if (!fs.existsSync(N8N_DIR)) {
  fs.mkdirSync(N8N_DIR, { recursive: true });
}

// 设置环境变量
const env = {
  ...process.env,
  N8N_PORT: N8N_PORT,
  N8N_HOST: '0.0.0.0',
  N8N_USER_FOLDER: N8N_DIR,
  N8N_ENCRYPTION_KEY: 'artslave-n8n-key-2025',
  // 禁用遥测
  N8N_DIAGNOSTICS_ENABLED: 'false',
  // 使用简单的数据库配置
  DB_TYPE: 'sqlite',
  DB_SQLITE_DATABASE: path.join(N8N_DIR, 'database.sqlite')
};

// 启动方法
const startMethods = [
  // 方法1: 全局 n8n
  {
    name: '全局 n8n',
    command: 'n8n',
    args: ['start']
  },
  // 方法2: npx 最新版
  {
    name: 'npx 最新版',
    command: 'npx',
    args: ['n8n@latest', 'start']
  },
  // 方法3: npx 当前版本
  {
    name: 'npx 当前版本',
    command: 'npx',
    args: ['n8n', 'start']
  }
];

let currentMethod = 0;

function tryStart() {
  if (currentMethod >= startMethods.length) {
    console.error('❌ 所有启动方法都失败了');
    process.exit(1);
  }

  const method = startMethods[currentMethod];
  console.log(`\n🔄 尝试方法 ${currentMethod + 1}: ${method.name}`);
  
  const n8nProcess = spawn(method.command, method.args, {
    cwd: N8N_DIR,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: env
  });

  let hasStarted = false;

  n8nProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // 检查启动成功的标志
    if (output.includes('Editor is now accessible') || 
        output.includes('n8n ready') ||
        output.includes('Server started') ||
        output.includes(`localhost:${N8N_PORT}`)) {
      hasStarted = true;
      console.log('✅ n8n 启动成功！');
      console.log(`🌐 访问地址: http://localhost:${N8N_PORT}`);
    }
  });

  n8nProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(error);
    
    // 检查是否是致命错误
    if (error.includes('Cannot read properties of undefined') ||
        error.includes('TypeError') ||
        error.includes('EADDRINUSE')) {
      console.log(`⚠️ 方法 ${currentMethod + 1} 失败，尝试下一种方法...`);
      n8nProcess.kill();
    }
  });

  n8nProcess.on('close', (code) => {
    if (code !== 0 && !hasStarted) {
      console.log(`❌ 方法 ${currentMethod + 1} 失败 (退出代码: ${code})`);
      currentMethod++;
      setTimeout(tryStart, 1000); // 等待1秒后尝试下一种方法
    } else if (hasStarted) {
      console.log('n8n 进程已退出');
    }
  });

  n8nProcess.on('error', (error) => {
    console.error(`❌ 方法 ${currentMethod + 1} 出错:`, error.message);
    currentMethod++;
    setTimeout(tryStart, 1000);
  });

  // 超时检查
  setTimeout(() => {
    if (!hasStarted && !n8nProcess.killed) {
      console.log(`⏱️ 方法 ${currentMethod + 1} 超时，尝试下一种方法...`);
      n8nProcess.kill();
      currentMethod++;
      setTimeout(tryStart, 1000);
    }
  }, 30000); // 30秒超时
}

// 处理退出信号
process.on('SIGINT', () => {
  console.log('\n👋 正在停止 n8n...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 正在停止 n8n...');
  process.exit(0);
});

// 开始启动
tryStart();
