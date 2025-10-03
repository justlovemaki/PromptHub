import { SupportedLanguage } from './utils/i18n';

// 定义不同语言对应的API基础URL映射
const LANGUAGE_BASE_URLS: Record<SupportedLanguage, string> = {
  'en': 'http://localhost:3000',
  'zh-CN': 'http://localhost:3000/zh-CN',
  'ja': 'http://localhost:3000/ja',
};

// 通用的API基础URL（默认）
const DEFAULT_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

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
  }
};

/**
 * 根据指定的语言返回对应的API基础URL
 * @param language - 目标语言
 * @returns 对应语言的API基础URL
 */
export function getBaseUrlByLanguage(language: SupportedLanguage): string {
  return LANGUAGE_BASE_URLS[language] || DEFAULT_BASE_URL;
}

/**
 * 获取当前语言对应的API基础URL
 * @param currentLanguage - 当前语言，默认为 'en'
 * @returns 当前语言的API基础URL
 */
export function getCurrentLanguageBaseUrl(currentLanguage: SupportedLanguage = 'en'): string {
  return getBaseUrlByLanguage(currentLanguage);
}