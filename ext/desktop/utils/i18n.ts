import * as fs from 'fs';
import * as path from 'path';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ja'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// 默认语言
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// 当前语言（从 electron-store 读取，默认为 en）
let currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

// 消息缓存
let messagesCache: Record<string, Record<string, any>> = {};

/**
 * 初始化 i18n
 * @param language 要设置的语言，如果不提供则从 electron-store 读取
 */
export function initI18n(language?: SupportedLanguage): SupportedLanguage {
  if (language && SUPPORTED_LANGUAGES.includes(language)) {
    currentLanguage = language;
  } else {
    // 从 electron-store 读取保存的语言设置
    try {
      const Store = require('electron-store');
      const store = new Store();
      const savedLanguage = store.get('language') as SupportedLanguage;
      
      if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        currentLanguage = savedLanguage;
      } else {
        currentLanguage = DEFAULT_LANGUAGE;
        store.set('language', DEFAULT_LANGUAGE);
      }
    } catch (error) {
      console.error('Failed to load language from store:', error);
      currentLanguage = DEFAULT_LANGUAGE;
    }
  }
  
  // 加载对应语言的消息
  loadMessages(currentLanguage);
  
  return currentLanguage;
}

/**
 * 加载指定语言的消息文件
 */
function loadMessages(language: SupportedLanguage): void {
  if (messagesCache[language]) {
    return; // 已经加载过了
  }
  
  try {
    const messagesPath = path.join(__dirname, '..', 'public', '_locales', language, 'messages.json');
    const messagesContent = fs.readFileSync(messagesPath, 'utf-8');
    messagesCache[language] = JSON.parse(messagesContent);
  } catch (error) {
    console.error(`Failed to load messages for language: ${language}`, error);
    messagesCache[language] = {};
  }
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
 */
export function setLanguage(language: SupportedLanguage): void {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    console.error(`Unsupported language: ${language}`);
    return;
  }
  
  currentLanguage = language;
  
  // 加载新语言的消息
  loadMessages(language);
  
  // 保存到 electron-store
  try {
    const Store = require('electron-store');
    const store = new Store();
    store.set('language', language);
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