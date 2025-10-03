import { SupportedLanguage } from './utils/i18n';

// 环境判断
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// 定义不同环境和语言对应的API基础URL映射
const DEVELOPMENT_LANGUAGE_BASE_URLS: Record<SupportedLanguage, string> = {
  'en': 'http://localhost:3000',
  'zh-CN': 'http://localhost:3000/zh-CN',
  'ja': 'http://localhost:3000/ja',
};

const PRODUCTION_LANGUAGE_BASE_URLS: Record<SupportedLanguage, string> = {
  'en': 'https://prompt.hubtoday.app',
  'zh-CN': 'https://prompt.hubtoday.app/zh-CN',
  'ja':'https://prompt.hubtoday.app/ja',
};

// 通用的API基础URL（默认）
const DEFAULT_BASE_URL = isProduction ? 'https://prompt.hubtoday.app' : 'http://localhost:3000';

export const API_CONFIG = {
  BASE_URL: DEFAULT_BASE_URL,
  ENDPOINTS: {
    PROMPTS_LIST: `/api/prompts/list`,
    PROMPTS_CREATE: `/api/prompts/create`,
    PROMPTS_UPDATE: `/api/prompts/update`,
    PROMPTS_DELETE: `/api/prompts/delete`,
    PROMPTS_USE: `/api/prompts/use`,
    PROMPTS_TAGS: `/api/prompts/tags`,
    USER_STATS: `/api/dashboard/stats`,
    USER_INFO: `/api/auth/me`,
  },
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: isDevelopment,
};

/**
 * 根据指定的语言返回对应的API基础URL
 * @param language - 目标语言
 * @returns 对应语言的API基础URL
 */
export function getBaseUrlByLanguage(language: SupportedLanguage): string {
  const languageUrls = isProduction ? PRODUCTION_LANGUAGE_BASE_URLS : DEVELOPMENT_LANGUAGE_BASE_URLS;
  return languageUrls[language] || DEFAULT_BASE_URL;
}

/**
 * 获取当前语言对应的API基础URL
 * @param currentLanguage - 当前语言，默认为 'en'
 * @returns 当前语言的API基础URL
 */
export function getCurrentLanguageBaseUrl(currentLanguage: SupportedLanguage = 'en'): string {
  return getBaseUrlByLanguage(currentLanguage);
}