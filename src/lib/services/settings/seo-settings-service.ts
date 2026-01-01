/**
 * SEO 设置服务
 * 用于获取多语言 SEO 配置
 */

import { getTranslation } from '../../../i18n';

// SEO 设置接口
export interface SEOSettings {
  siteTitle: string;
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteUrl: string;
  ogImage: string;
  twitterHandle: string;
  twitterCard: string;
}

// 默认 SEO 设置
const defaultSEOSettings: SEOSettings = {
  siteTitle: 'PromptHub - AI Prompt Manager',
  siteName: 'PromptHub',
  siteDescription: 'AI Prompt Manager & Template Library',
  siteKeywords: 'AI, prompt, ChatGPT, Claude, Midjourney, template, manager',
  siteUrl: process.env.BETTER_AUTH_URL?.replace(/\/$/, '') || process.env.NEXT_PUBLIC_BASE_URL || '',
  ogImage: '/logo.png',
  twitterHandle: '@prompthub',
  twitterCard: 'summary_large_image',
};

/**
 * 获取指定语言的 SEO 设置
 * @param lang 语言代码
 * @returns SEO 设置对象
 */
export async function getSEOSettingsForLang(lang: string): Promise<SEOSettings> {
  try {
    const { t } = await getTranslation(lang, 'layout');
    
    // 获取翻译值，如果为空则使用默认值
    const siteUrl = t('seo.siteUrl', { defaultValue: '' });
    
    return {
      siteTitle: t('title', { defaultValue: defaultSEOSettings.siteTitle }),
      siteName: t('seo.siteName', { defaultValue: defaultSEOSettings.siteName }),
      siteDescription: t('seo.siteDescription', { defaultValue: defaultSEOSettings.siteDescription }),
      siteKeywords: t('seo.siteKeywords', { defaultValue: defaultSEOSettings.siteKeywords }),
      // siteUrl 如果为空字符串，则使用默认值
      siteUrl: siteUrl || defaultSEOSettings.siteUrl,
      ogImage: t('seo.ogImage', { defaultValue: defaultSEOSettings.ogImage }),
      twitterHandle: t('seo.twitterHandle', { defaultValue: defaultSEOSettings.twitterHandle }),
      twitterCard: t('seo.twitterCard', { defaultValue: defaultSEOSettings.twitterCard }),
    };
  } catch (error) {
    console.error('Failed to get SEO settings for lang:', lang, error);
    return defaultSEOSettings;
  }
}