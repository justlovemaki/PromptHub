// 处理标签配置文件的工具函数
import { TagLabel, TagCategory, TagClassification, TagsConfig } from '../types/types';

// 缓存已加载的标签配置，避免重复加载
const tagsConfigCache = new Map<string, TagsConfig | null>();

/**
 * 获取当前语言环境
 * 默认为英文，如果没有找到匹配的语言环境
 */
export function getCurrentLocale(): string {
  // 从 navigator.language 获取语言环境
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) {
    return 'cn';
  } else if (browserLang.startsWith('ja')) {
    return 'ja';
  }
  
  // 默认返回英文
  return 'en';
}

export function getFileLocale(language: string): string {
  // 从 navigator.language 获取语言环境
  const browserLang = language;
  if (browserLang.startsWith('zh')) {
    return 'cn';
  } else if (browserLang.startsWith('ja')) {
    return 'ja';
  }
  
  // 默认返回英文
  return 'en';
}

/**
 * 获取标签配置文件的路径
 * @param locale 语言环境，默认为当前语言环境
 * @returns 标签配置文件的路径
 */
export function getTagsConfigPath(locale: string = getCurrentLocale()): string {
  // 在桌面应用中，我们需要从 public 资源路径加载标签配置
  // 根据当前语言环境选择对应的配置文件
  return `./tags/tags-${locale}.json`;
}

/**
 * 加载并解析标签配置文件
 * @param locale 语言环境，默认为当前语言环境
 * @returns 解析后的标签配置对象
 */
export async function loadTagsConfig(locale: string = getCurrentLocale()): Promise<TagsConfig | null> {
  // 检查缓存中是否已有该语言的配置
  if (tagsConfigCache.has(locale)) {
    return tagsConfigCache.get(locale)!;
  }

  try {
    // 首先尝试加载指定语言的配置文件
    const configPath = getTagsConfigPath(locale);
    
    // 使用 fetch API 加载配置文件
    const response = await fetch(configPath);
    
    if (!response.ok) {
      throw new Error(`Failed to load tags config for locale: ${locale}, status: ${response.status}`);
    }
    
    const config: TagsConfig = await response.json();
    
    // 将配置缓存到内存中
    tagsConfigCache.set(locale, config);
    
    return config;
  } catch (error) {
    console.error(`Error loading tags config for locale "${locale}":`, error);
    
    // 如果指定语言的配置文件加载失败，尝试加载英文作为后备
    if (locale !== 'en') {
      console.warn(`Falling back to English tags config...`);
      try {
        const fallbackResponse = await fetch('./tags/tags-en.json');
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to load fallback tags config, status: ${fallbackResponse.status}`);
        }
        const fallbackConfig: TagsConfig = await fallbackResponse.json();
        
        // 将后备配置缓存到内存中
        tagsConfigCache.set(locale, fallbackConfig);
        
        return fallbackConfig;
      } catch (fallbackError) {
        console.error('Failed to load fallback English tags config:', fallbackError);
      }
    }
    
    // 如果加载失败，将 null 缓存以避免重复尝试加载
    tagsConfigCache.set(locale, null);
    
    return null;
  }
}

/**
 * 获取所有标签分类
 * @param locale 语言环境，默认为当前语言环境
 * @returns 标签分类数组
 */
export async function getAllTagClassifications(locale: string = getCurrentLocale()): Promise<TagClassification[]> {
  const config = await loadTagsConfig(locale);
  if (!config) {
    return [];
  }
  
  return [
    config.prompt_tags_classification.scenario_tags,
    config.prompt_tags_classification.intent_tags
  ];
}

/**
 * 获取场景标签分类
 * @param locale 语言环境，默认为当前语言环境
 * @returns 场景标签分类
 */
export async function getScenarioTags(locale: string = getCurrentLocale()): Promise<TagClassification> {
  const config = await loadTagsConfig(locale);
  return config?.prompt_tags_classification.scenario_tags || {
    title: "Scenario Tags",
    description: "Describes the domain or context in which the user is applying the prompt.",
    categories: {}
  };
}

/**
 * 获取意图标签分类
 * @param locale 语言环境，默认为当前语言环境
 * @returns 意图标签分类
 */
export async function getIntentTags(locale: string = getCurrentLocale()): Promise<TagClassification> {
  const config = await loadTagsConfig(locale);
  return config?.prompt_tags_classification.intent_tags || {
    title: "Intent Tags",
    description: "Describes the specific action or task type the user wants the AI to perform.",
    categories: {}
  };
}

/**
 * 获取所有标签类别
 * @param locale 语言环境，默认为当前语言环境
 * @returns 所有标签类别数组
 */
export async function getAllTagCategories(locale: string = getCurrentLocale()): Promise<TagCategory[]> {
  const scenarioTags = await getScenarioTags(locale);
  const intentTags = await getIntentTags(locale);
  
  return [
    ...Object.values(scenarioTags.categories),
    ...Object.values(intentTags.categories)
  ];
}

/**
 * 获取所有标签
 * @param locale 语言环境，默认为当前语言环境
 * @returns 所有标签数组
 */
export async function getAllTags(locale: string = getCurrentLocale()): Promise<TagLabel[]> {
  locale  = getFileLocale(locale)
  const categories = await getAllTagCategories(locale);
  
  return categories.flatMap(category => category.labels);
}

/**
 * 根据键值查找标签
 * @param key 标签键值
 * @param locale 语言环境，默认为当前语言环境
 * @returns 匹配的标签，如果没有找到则返回 null
 */
export async function findTagByKey(key: string, locale: string = getCurrentLocale()): Promise<TagLabel | null> {
  const allTags = await getAllTags(locale);
  return allTags.find(tag => tag.key === key) || null;
}

/**
 * 根据名称查找标签
 * @param name 标签名
 * @param locale 语言环境，默认为当前语言环境
 * @returns 匹配的标签，如果没有找到则返回 null
 */
export async function findTagByName(name: string, locale: string = getCurrentLocale()): Promise<TagLabel | null> {
  const allTags = await getAllTags(locale);
  return allTags.find(tag => tag.name === name) || null;
}