#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 测试 n8n 启动...\n');

// 测试 1: 检查 npx 是否可用
console.log('1. 检查 npx 版本...');
const npxCheck = spawn('npx', ['--version'], { shell: true });

npxCheck.on('close', (code) => {
  if (code === 0) {
    console.log('✅ npx 可用\n');
    
    // 测试 2: 检查 n8n 版本
    console.log('2. 检查 n8n 版本...');
    const n8nCheck = spawn('npx', ['n8n', '--version'], { shell: true });
    
    n8nCheck.stdout.on('data', (data) => {
      console.log(`✅ n8n 版本: ${data.toString().trim()}\n`);
    });
    
    n8nCheck.on('close', (versionCode) => {
      if (versionCode === 0) {
        // 测试 3: 尝试启动 n8n（5秒后自动停止）
        console.log('3. 测试启动 n8n (5秒后自动停止)...');
        
        const n8nDir = path.join(__dirname, '..', 'n8n');
        const testProcess = spawn('npx', ['n8n', 'start', '--tunnel'], {
          cwd: n8nDir,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            N8N_PORT: '5679', // 使用不同端口避免冲突
            N8N_USER_FOLDER: n8nDir,
            N8N_ENCRYPTION_KEY: 'test-key'
          }
        });
        
        let output = '';
        let hasStarted = false;
        
        testProcess.stdout.on('data', (data) => {
          output += data.toString();
          console.log('📝 输出:', data.toString().trim());
          
          // 检查是否成功启动
          if (data.toString().includes('Editor is now accessible') || 
              data.toString().includes('n8n ready') ||
              data.toString().includes('Server started')) {
            hasStarted = true;
            console.log('✅ n8n 启动成功！');
          }
        });
        
        testProcess.stderr.on('data', (data) => {
          console.log('⚠️ 错误:', data.toString().trim());
        });
        
        testProcess.on('close', (code) => {
          if (code === 0 || hasStarted) {
            console.log('\n🎉 测试结果: n8n 可以正常启动！');
            console.log('💡 建议: 在 ArtSlave 中点击"启动 n8n"按钮');
          } else {
            console.log(`\n❌ 测试结果: n8n 启动失败 (退出代码: ${code})`);
            console.log('💡 建议: 检查错误信息或尝试手动启动');
          }
        });
        
        testProcess.on('error', (error) => {
          console.log(`\n❌ 启动错误: ${error.message}`);
        });
        
        // 5秒后停止测试
        setTimeout(() => {
          if (!testProcess.killed) {
            testProcess.kill();
            if (hasStarted) {
              console.log('\n✅ 测试完成: n8n 可以正常启动');
            } else {
              console.log('\n⏱️ 测试超时: n8n 可能需要更长时间启动');
            }
          }
        }, 5000);
        
      } else {
        console.log('❌ 无法获取 n8n 版本');
      }
    });
    
  } else {
    console.log('❌ npx 不可用，请检查 Node.js 安装');
  }
});

npxCheck.on('error', (error) => {
  console.log(`❌ npx 检查失败: ${error.message}`);
});
