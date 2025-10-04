// 支持的语言列表
export const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ja'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// 默认语言
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// 当前语言
let currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

// 消息缓存
let messagesCache: Record<string, Record<string, any>> = {};

/**
 * 加载指定语言的消息文件
 */
async function loadMessages(language: SupportedLanguage): Promise<void> {
  if (messagesCache[language]) {
    return; // 已经加载过了
  }

  try {
    // 检测是否在主进程
    const isMainProcess = typeof process !== 'undefined' && process.type === 'browser';

    if (isMainProcess) {
      // 主进程：使用 fs 模块
      const fs = await import('fs');
      const path = await import('path');
      const { app } = await import('electron');

      let messagesPath: string;
      // if (!app.isPackaged) {
        messagesPath = path.join(__dirname, '../renderer', '_locales', language, 'messages.json');
      // } else {
      //   // 生产环境：使用 process.resourcesPath
      //   messagesPath = path.join(process.resourcesPath, '_locales', language, 'messages.json');
      // }

      const messagesContent = fs.readFileSync(messagesPath, 'utf-8');
      messagesCache[language] = JSON.parse(messagesContent);
    } else {
      // 渲染进程：使用 fetch
      const messagesPath = `./_locales/${language}/messages.json`;
      
      const response = await fetch(messagesPath);
      if (response.ok) {
        messagesCache[language] = await response.json();
      } else {
        console.error(`Failed to load messages for language: ${language} from ${messagesPath}`);
        messagesCache[language] = {};
      }
    }
  } catch (error) {
    console.error(`Failed to load messages for language: ${language}`, error);
    messagesCache[language] = {};
  }
}

/**
 * 初始化 i18n
 * @param language 要设置的语言，如果不提供则从存储中读取
 * @param getLanguageFunc 用于获取保存语言的函数（渲染进程通过IPC调用）
 * @param setLanguageFunc 用于保存语言的函数（渲染进程通过IPC调用）
 */
export async function initI18n(
  language?: SupportedLanguage,
  getLanguageFunc?: () => Promise<SupportedLanguage>,
  setLanguageFunc?: (lang: SupportedLanguage) => Promise<void>
): Promise<SupportedLanguage> {
  if (language && SUPPORTED_LANGUAGES.includes(language)) {
    currentLanguage = language;
  } else {
    // 尝试从存储中读取语言设置
    try {
      if (typeof process !== 'undefined' && process.type === 'browser') {
        // 主进程：直接使用 electron-store
        const Store = (await import('electron-store')).default;
        const store = new Store();
        
        const savedLanguage = store.get('language') as SupportedLanguage;
        
        if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
          currentLanguage = savedLanguage;
        } else {
          currentLanguage = DEFAULT_LANGUAGE;
          store.set('language', DEFAULT_LANGUAGE);
        }
      } else {
        // 渲染进程：通过提供的函数获取
        if (getLanguageFunc) {
          const savedLanguage = await getLanguageFunc();
          if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
            currentLanguage = savedLanguage;
          } else {
            currentLanguage = DEFAULT_LANGUAGE;
          }
        } else {
          currentLanguage = DEFAULT_LANGUAGE;
        }
      }
    } catch (error) {
      console.error('Failed to load language from store:', error);
      currentLanguage = DEFAULT_LANGUAGE;
    }
  }
  
  // 加载对应语言的消息
  await loadMessages(currentLanguage);
  
  return currentLanguage;
}

/**
 * 获取翻译文本
 * @param key 消息键名
 * @param fallback 回退文本（可选）
 * @returns 翻译后的文本
 */
export function t(key: string, fallback?: string): string {
  const messages = messagesCache[currentLanguage] || {};
  const messageData = messages[key];
  
  if (messageData && messageData.message) {
    return messageData.message;
  }
  
  // 如果当前语言没有找到，尝试使用默认语言
  if (currentLanguage !== DEFAULT_LANGUAGE) {
    const defaultMessages = messagesCache[DEFAULT_LANGUAGE] || {};
    const defaultMessageData = defaultMessages[key];
    
    if (defaultMessageData && defaultMessageData.message) {
      return defaultMessageData.message;
    }
  }
  
  // 如果都没找到，返回回退文本或键名
  return fallback || key;
}

/**
 * 获取当前语言
 */
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * 设置语言
 * @param language 要设置的语言
 * @param setLanguageFunc 用于保存语言的函数（渲染进程通过IPC调用）
 */
export async function setLanguage(
  language: SupportedLanguage,
  setLanguageFunc?: (lang: SupportedLanguage) => Promise<void>
): Promise<void> {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    console.error(`Unsupported language: ${language}`);
    return;
  }
  
  currentLanguage = language;
  
  // 加载新语言的消息
  await loadMessages(language);
  
  try {
    if (typeof process !== 'undefined' && process.type === 'browser') {
      // 主进程：直接使用 electron-store
      const Store = (await import('electron-store')).default;
      const store = new Store();
      store.set('language', language);
    } else {
      // 渲染进程：通过提供的函数保存
      if (setLanguageFunc) {
        await setLanguageFunc(language);
      }
    }
  } catch (error) {
    console.error('Failed to save language to store:', error);
  }
}

/**
 * 获取语言显示名称
 */
export function getLanguageDisplayName(language: SupportedLanguage): string {
  const displayNames: Record<SupportedLanguage, string> = {
    'en': 'English',
    'zh-CN': '简体中文',
    'ja': '日本語',
  };
  return displayNames[language] || language;
}

/**
 * 手动加载指定语言的消息
 */
export async function loadLanguageMessages(language: SupportedLanguage): Promise<void> {
  await loadMessages(language);
}