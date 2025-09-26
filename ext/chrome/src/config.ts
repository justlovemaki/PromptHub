// 配置文件

export const CONFIG = {
  // Web应用基础URL
  //WEB_APP_BASE_URL: 'http://localhost:3000',              // 开发环境URL
  
  // 扩展设置
  EXTENSION_NAME: 'PromptHub',
  EXTENSION_VERSION: '1.0.0',
  
  // API端点
  ENDPOINTS: {
    PROMPTS_LIST: '/api/prompts/list',
    PROMPTS_CREATE: '/api/prompts/create',
    PROMPTS_UPDATE: '/api/prompts/update',
    PROMPTS_DELETE: '/api/prompts/delete',
    PROMPTS_USE: '/api/prompts/use',
    PROMPTS_TAGS: '/api/prompts/tags',
    USER_STATS: '/api/dashboard/stats',
    USER_INFO: '/api/auth/me',
    USER_UPDATE: '/api/user/update',
    
    USER_SUBSCRIPTION: '/api/user/subscription',
    USER_AI_POINTS: '/api/user/ai-points',
    USER_PURCHASE_AI_POINTS: '/api/user/purchase-ai-points'
  }
};