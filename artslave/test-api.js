// 简单的API测试脚本
const fetch = require('node-fetch');

async function testDeepSearchAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/deep-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coreNode: {
          name: 'David Hockney',
          type: 'artist'
        },
        preset: 'quick'
      })
    });

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

testDeepSearchAPI();
