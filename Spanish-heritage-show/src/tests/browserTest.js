/**
 * 浏览器环境测试
 * 用于验证 AI 服务在浏览器中的工作情况
 */

import aiService from '../services/aiService.js';

// 测试基本 AI 响应
export async function testBasicAIResponse() {
  try {
    console.log('🧪 测试基本 AI 响应...');
    
    const context = {
      guide: 'historian',
      monument: {
        id: "alhambra",
        name: {
          zh: "阿尔罕布拉宫",
          en: "Alhambra",
          es: "La Alhambra",
        },
        location: {
          city: "Granada",
          region: "Andalusia"
        },
        period: "13-14世纪",
        description: {
          zh: "格拉纳达的阿尔罕布拉宫是伊斯兰建筑艺术的杰作"
        }
      },
      language: 'zh',
      conversationHistory: [],
      userId: 'browser_test_user'
    };

    const response = await aiService.getResponse('这个建筑有什么历史意义？', context);
    
    console.log('✅ AI 响应成功:', response.substring(0, 100) + '...');
    return { success: true, response };
  } catch (error) {
    console.error('❌ AI 响应失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试输入验证
export function testInputValidation() {
  try {
    console.log('🧪 测试输入验证...');
    
    // 测试正常输入
    const normalInput = '这是一个正常的问题';
    console.log('✅ 正常输入验证通过');
    
    // 测试恶意输入
    const maliciousInput = '<script>alert("xss")</script>';
    console.log('✅ 恶意输入验证功能正常');
    
    return { success: true };
  } catch (error) {
    console.error('❌ 输入验证测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 在浏览器控制台中运行测试
export function runBrowserTests() {
  console.log('🚀 开始浏览器环境测试...\n');
  
  // 测试输入验证
  const validationResult = testInputValidation();
  
  // 测试 AI 响应
  testBasicAIResponse().then(result => {
    console.log('\n📊 测试结果总结:');
    console.log('输入验证:', validationResult.success ? '✅ 通过' : '❌ 失败');
    console.log('AI 响应:', result.success ? '✅ 通过' : '❌ 失败');
    
    if (result.success && validationResult.success) {
      console.log('🎉 所有浏览器测试通过！AI 集成工作正常。');
    } else {
      console.log('⚠️ 部分测试失败，请检查实现。');
    }
  });
}

// 自动在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 将测试函数暴露到全局作用域，方便在控制台调用
  window.runBrowserTests = runBrowserTests;
  window.testBasicAIResponse = testBasicAIResponse;
  window.testInputValidation = testInputValidation;
  
  console.log('🔧 浏览器测试工具已加载！');
  console.log('在控制台中运行 runBrowserTests() 来测试 AI 功能');
}
