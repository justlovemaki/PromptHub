import { initI18n as commonInitI18n, t, getCurrentLanguage, setLanguage as commonSetLanguage, getLanguageDisplayName, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../../common/i18n';

// 用于与主进程通信的函数
async function getLanguageFromMain(): Promise<SupportedLanguage> {
  try {
    const { ipcRenderer } = (window as any).electron;
    return await ipcRenderer.invoke('get-language');
  } catch (error) {
    console.error('Failed to get language from main process:', error);
    return 'en'; // 默认返回英语
  }
}

async function setLanguageToMain(language: SupportedLanguage): Promise<void> {
  try {
    const { ipcRenderer } = (window as any).electron;
    await ipcRenderer.invoke('set-language', language);
  } catch (error) {
    console.error('Failed to set language to main process:', error);
  }
}

// 重新导出通用的 i18n 函数和类型，保持原有 API 兼容性
export { t, getCurrentLanguage, getLanguageDisplayName, SUPPORTED_LANGUAGES, type SupportedLanguage };

// 包装 initI18n 和 setLanguage 以处理 IPC 通信
export async function initI18n(language?: SupportedLanguage): Promise<SupportedLanguage> {
  return await commonInitI18n(language, getLanguageFromMain, setLanguageToMain);
}

export async function setLanguage(language: SupportedLanguage): Promise<void> {
  await commonSetLanguage(language, setLanguageToMain);
}