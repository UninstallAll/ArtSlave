// 测试 DeepSeek API 连接
const fetch = require('node-fetch');

async function testDeepSeekAPI() {
  const apiKey = 'sk-6e0ef96ccf544752ba4adb41ad613cee';
  const baseUrl = 'https://api.deepseek.com';
  
  try {
    console.log('测试 DeepSeek API 连接...');
    
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: '你好，请回复"API连接成功"'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API 连接成功！');
    console.log('响应:', data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ API 连接失败:', error.message);
  }
}

testDeepSeekAPI();
