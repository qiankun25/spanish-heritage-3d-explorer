/**
 * Environment Configuration
 * Handles environment variables and application configuration
 */

// 获取环境变量的辅助函数
const getEnvVar = (key, defaultValue = undefined) => {
  // 优先检查 Node.js 环境变量（用于测试）
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  // 然后检查 Vite 环境变量
  try {
    if (import.meta && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {
    // import.meta 在 Node.js 中可能不可用
  }

  return defaultValue;
};

export const config = {
  // AI Service Configuration
  ai: {
    baseUrl: getEnvVar('VITE_AI_API_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
    apiKey: getEnvVar('VITE_AI_API_KEY'),
    model: 'qwen-plus', // Default model for DashScope
    maxTokens: 2000,
    temperature: 0.7,
    timeout: 30000, // 30 seconds
  },

  // Application Configuration
  app: {
    name: getEnvVar('VITE_APP_NAME', 'Spanish Heritage 3D Explorer'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    isDevelopment: getEnvVar('NODE_ENV') === 'development' || getEnvVar('DEV') === 'true',
    isProduction: getEnvVar('NODE_ENV') === 'production' || getEnvVar('PROD') === 'true',
  },

  // Rate Limiting Configuration
  rateLimit: {
    maxRequestsPerMinute: getEnvVar('VITE_RATE_LIMIT_MINUTES', 20),
    maxRequestsPerHour: getEnvVar('VITE_RATE_LIMIT_HOURS', 100),
  },

  // Chat Configuration
  chat: {
    maxHistoryLength: 50,
    maxMessageLength: 1000,
    typingDelay: 100,
  }
};

/**
 * Validates that all required environment variables are present
 */
export const validateConfig = () => {
  const errors = [];

  if (!config.ai.apiKey) {
    errors.push('VITE_AI_API_KEY is required');
  }

  if (!config.ai.baseUrl) {
    errors.push('VITE_AI_API_BASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
};

/**
 * Gets the full API endpoint URL
 */
export const getApiEndpoint = (path = '') => {
  return `${config.ai.baseUrl}${path}`;
};

export default config;
