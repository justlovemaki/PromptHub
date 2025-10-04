import { initI18n, t, getCurrentLanguage, setLanguage, getLanguageDisplayName, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../common/i18n';

// 重新导出通用的 i18n 函数和类型，保持原有 API 兼容性
export { initI18n, t, getCurrentLanguage, setLanguage, getLanguageDisplayName, SUPPORTED_LANGUAGES, type SupportedLanguage };

// 保留 initI18n 的同步版本用于主进程，但内部使用异步实现
export async function initializeI18n(language?: SupportedLanguage): Promise<SupportedLanguage> {
  return await initI18n(language);
}