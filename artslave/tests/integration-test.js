#!/usr/bin/env node
/**
 * ArtSlave 集成测试套件
 * 测试整个系统的功能完整性
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  retries: 3
};

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 测试工具函数
async function makeRequest(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${TEST_CONFIG.baseUrl}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      timeout: TEST_CONFIG.timeout,
      ...options
    });
    
    const data = await response.json();
    return { response, data, status: response.status };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function runTest(testName, testFunction) {
  testResults.total++;
  
  try {
    logInfo(`Running: ${testName}`);
    await testFunction();
    testResults.passed++;
    logSuccess(`PASSED: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    logError(`FAILED: ${testName} - ${error.message}`);
  }
}

// 测试用例

async function testHomePage() {
  const { response } = await makeRequest('/');
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
}

async function testSubmissionsAPI() {
  const { data, status } = await makeRequest('/api/submissions');
  if (status !== 200) {
    throw new Error(`Expected status 200, got ${status}`);
  }
  if (!data.success) {
    throw new Error('API response indicates failure');
  }
  if (!Array.isArray(data.data)) {
    throw new Error('Expected data.data to be an array');
  }
}

async function testDataSourcesAPI() {
  const { data, status } = await makeRequest('/api/datasources');
  if (status !== 200) {
    throw new Error(`Expected status 200, got ${status}`);
  }
  if (!data.success) {
    throw new Error('API response indicates failure');
  }
  if (!Array.isArray(data.data)) {
    throw new Error('Expected data.data to be an array');
  }
}

async function testCrawlerAPI() {
  // 测试获取爬虫列表
  const { data, status } = await makeRequest('/api/crawler?action=list');
  if (status !== 200) {
    throw new Error(`Expected status 200, got ${status}`);
  }
  if (!data.success) {
    throw new Error('API response indicates failure');
  }
}

async function testSchedulerAPI() {
  // 测试获取调度器状态
  const { data, status } = await makeRequest('/api/scheduler?action=status');
  if (status !== 200) {
    throw new Error(`Expected status 200, got ${status}`);
  }
  if (!data.status) {
    throw new Error('Expected status object in response');
  }
}

async function testN8nAPI() {
  // 测试获取 n8n 状态
  const { data, status } = await makeRequest('/api/n8n?action=status');
  if (status !== 200) {
    throw new Error(`Expected status 200, got ${status}`);
  }
  if (!data.status) {
    throw new Error('Expected status object in response');
  }
}

async function testDatabaseOperations() {
  // 测试创建投稿
  const testSubmission = {
    title: 'Test Submission',
    type: 'EXHIBITION',
    organizer: 'Test Organizer',
    location: 'Test Location',
    country: 'Test Country',
    deadline: '2025-12-31',
    description: 'Test description'
  };

  const { data: createData, status: createStatus } = await makeRequest('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testSubmission)
  });

  if (createStatus !== 201) {
    throw new Error(`Expected status 201, got ${createStatus}`);
  }

  const submissionId = createData.data.id;

  // 测试获取投稿
  const { data: getData, status: getStatus } = await makeRequest(`/api/submissions/${submissionId}`);
  if (getStatus !== 200) {
    throw new Error(`Expected status 200, got ${getStatus}`);
  }

  // 测试更新投稿
  const updateData = { title: 'Updated Test Submission' };
  const { status: updateStatus } = await makeRequest(`/api/submissions/${submissionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });

  if (updateStatus !== 200) {
    throw new Error(`Expected status 200, got ${updateStatus}`);
  }

  // 测试删除投稿
  const { status: deleteStatus } = await makeRequest(`/api/submissions/${submissionId}`, {
    method: 'DELETE'
  });

  if (deleteStatus !== 200) {
    throw new Error(`Expected status 200, got ${deleteStatus}`);
  }
}

async function testFileSystemStructure() {
  const requiredPaths = [
    'src/app/page.tsx',
    'src/app/submissions/page.tsx',
    'src/app/data-collection/page.tsx',
    'src/app/data-management/page.tsx',
    'src/app/api/submissions/route.ts',
    'src/app/api/datasources/route.ts',
    'src/app/api/crawler/route.ts',
    'src/app/api/scheduler/route.ts',
    'src/app/api/n8n/route.ts',
    'crawler/crawler_manager.py',
    'crawler/scheduler.py',
    'crawler/database.py',
    'n8n/workflows/artslave-data-sync.json',
    'n8n/workflows/automated-crawler.json'
  ];

  for (const filePath of requiredPaths) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required file missing: ${filePath}`);
    }
  }
}

async function testPythonCrawlerSystem() {
  // 检查 Python 环境
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['--version']);
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Python not available'));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Python check failed: ${error.message}`));
    });
  });
}

async function testDatabaseConnection() {
  // 测试数据库连接
  const { data, status } = await makeRequest('/api/submissions?limit=1');
  if (status !== 200) {
    throw new Error('Database connection test failed');
  }
}

// 性能测试
async function testPerformance() {
  const startTime = Date.now();
  
  // 并发请求测试
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest('/api/submissions'));
  }
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (duration > 5000) { // 5秒超时
    throw new Error(`Performance test failed: ${duration}ms > 5000ms`);
  }
  
  logInfo(`Performance test completed in ${duration}ms`);
}

// 主测试函数
async function runAllTests() {
  log('🚀 Starting ArtSlave Integration Tests', 'blue');
  log('=' * 50, 'blue');

  // 基础功能测试
  await runTest('Homepage Access', testHomePage);
  await runTest('File System Structure', testFileSystemStructure);
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Python Crawler System', testPythonCrawlerSystem);

  // API 测试
  await runTest('Submissions API', testSubmissionsAPI);
  await runTest('Data Sources API', testDataSourcesAPI);
  await runTest('Crawler API', testCrawlerAPI);
  await runTest('Scheduler API', testSchedulerAPI);
  await runTest('n8n API', testN8nAPI);

  // 数据库操作测试
  await runTest('Database CRUD Operations', testDatabaseOperations);

  // 性能测试
  await runTest('Performance Test', testPerformance);

  // 输出测试结果
  log('\n📊 Test Results:', 'blue');
  log('=' * 30, 'blue');
  log(`Total Tests: ${testResults.total}`);
  logSuccess(`Passed: ${testResults.passed}`);
  logError(`Failed: ${testResults.failed}`);

  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.errors.forEach(error => {
      log(`  • ${error.test}: ${error.error}`, 'red');
    });
  }

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'red');

  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    results: testResults,
    successRate: parseFloat(successRate),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      baseUrl: TEST_CONFIG.baseUrl
    }
  };

  fs.writeFileSync(
    path.join(__dirname, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );

  log('\n📄 Test report saved to: tests/test-report.json', 'blue');

  // 退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};
