// 简单的AI服务测试
import aiService from './src/services/aiService.js';

async function testAI() {
  try {
    console.log('🧪 开始测试AI服务...');
    
    const context = {
      guide: 'historian',
      monument: {
        name: { zh: '阿尔罕布拉宫' },
        location: { city: 'Granada' },
        period: '13-14世纪'
      },
      language: 'zh',
      conversationHistory: []
    };

    const response = await aiService.getResponse('这个建筑有什么历史意义？', context);
    
    console.log('✅ AI响应成功:');
    console.log(response);
    
  } catch (error) {
    console.error('❌ AI测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testAI();
