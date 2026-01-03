/**
 * Umami Analytics 自定义事件追踪工具
 * 
 * 使用方法：
 * import { trackEvent, UmamiEvents } from '@/lib/umami'
 * trackEvent(UmamiEvents.LOGIN_SUCCESS, { method: 'google' })
 */

// Umami 事件名称常量
export const UmamiEvents = {
  // 认证相关
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SIGNUP_SUCCESS: 'signup_success',
  
  // 提示词相关
  PROMPT_CREATE: 'prompt_create',
  PROMPT_EDIT: 'prompt_edit',
  PROMPT_DELETE: 'prompt_delete',
  PROMPT_COPY: 'prompt_copy',
  PROMPT_USE: 'prompt_use',
  PROMPT_VIEW: 'prompt_view',
  PROMPT_SHARE: 'prompt_share',
  
  // 收藏相关
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',
  
  // 搜索和筛选
  SEARCH: 'search',
  FILTER_TAG: 'filter_tag',
  FILTER_VISIBILITY: 'filter_visibility',
  SORT_CHANGE: 'sort_change',
  
  // 导航相关
  PAGE_VIEW: 'page_view',
  NAV_CLICK: 'nav_click',
  CTA_CLICK: 'cta_click',
  
  // 导入导出
  EXPORT_PROMPTS: 'export_prompts',
  IMPORT_PROMPTS: 'import_prompts',
  
  // 订阅相关
  SUBSCRIPTION_VIEW: 'subscription_view',
  SUBSCRIPTION_CLICK: 'subscription_click',
  
  // 语言切换
  LANGUAGE_CHANGE: 'language_change',
  
  // 视图模式
  VIEW_MODE_CHANGE: 'view_mode_change',
  
  // 下载相关
  DOWNLOAD: 'download',
} as const

export type UmamiEventName = typeof UmamiEvents[keyof typeof UmamiEvents]

// 事件数据类型
export interface UmamiEventData {
  [key: string]: string | number | boolean | undefined
}

// 声明全局 umami 对象类型
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: UmamiEventData) => void
    }
  }
}

/**
 * 追踪自定义事件
 * @param eventName 事件名称
 * @param eventData 事件数据（可选）
 */
export function trackEvent(eventName: UmamiEventName | string, eventData?: UmamiEventData): void {
  // 仅在客户端执行
  if (typeof window === 'undefined') {
    return
  }

  // 检查 umami 是否已加载
  if (!window.umami) {
    // 如果 umami 未加载，将事件加入队列等待
    if (process.env.NODE_ENV === 'development') {
      console.log('[Umami] Event queued (umami not loaded):', eventName, eventData)
    }
    
    // 等待 umami 加载后再发送
    const checkUmami = setInterval(() => {
      if (window.umami) {
        clearInterval(checkUmami)
        window.umami.track(eventName, eventData)
        if (process.env.NODE_ENV === 'development') {
          console.log('[Umami] Queued event sent:', eventName, eventData)
        }
      }
    }, 100)
    
    // 5秒后停止检查
    setTimeout(() => clearInterval(checkUmami), 5000)
    return
  }

  try {
    window.umami.track(eventName, eventData)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Umami] Event tracked:', eventName, eventData)
    }
  } catch (error) {
    console.error('[Umami] Failed to track event:', error)
  }
}

/**
 * 追踪页面浏览
 * @param pageName 页面名称
 * @param additionalData 额外数据
 */
export function trackPageView(pageName: string, additionalData?: UmamiEventData): void {
  trackEvent(UmamiEvents.PAGE_VIEW, {
    page: pageName,
    ...additionalData,
  })
}

/**
 * 追踪搜索事件
 * @param query 搜索关键词
 * @param resultCount 结果数量
 */
export function trackSearch(query: string, resultCount?: number): void {
  trackEvent(UmamiEvents.SEARCH, {
    query: query.substring(0, 100), // 限制长度
    result_count: resultCount,
  })
}

/**
 * 追踪提示词操作
 * @param action 操作类型
 * @param promptId 提示词ID
 * @param additionalData 额外数据
 */
export function trackPromptAction(
  action: 'create' | 'edit' | 'delete' | 'copy' | 'use' | 'view' | 'share',
  promptId?: string,
  additionalData?: UmamiEventData
): void {
  const eventMap = {
    create: UmamiEvents.PROMPT_CREATE,
    edit: UmamiEvents.PROMPT_EDIT,
    delete: UmamiEvents.PROMPT_DELETE,
    copy: UmamiEvents.PROMPT_COPY,
    use: UmamiEvents.PROMPT_USE,
    view: UmamiEvents.PROMPT_VIEW,
    share: UmamiEvents.PROMPT_SHARE,
  }
  
  trackEvent(eventMap[action], {
    prompt_id: promptId,
    ...additionalData,
  })
}

/**
 * 追踪收藏操作
 * @param action 操作类型
 * @param promptId 提示词ID
 */
export function trackFavorite(action: 'add' | 'remove', promptId: string): void {
  trackEvent(action === 'add' ? UmamiEvents.FAVORITE_ADD : UmamiEvents.FAVORITE_REMOVE, {
    prompt_id: promptId,
  })
}

/**
 * 追踪认证事件
 * @param action 操作类型
 * @param method 认证方式
 */
export function trackAuth(
  action: 'login_success' | 'login_failed' | 'logout' | 'signup_success',
  method?: string
): void {
  const eventMap = {
    login_success: UmamiEvents.LOGIN_SUCCESS,
    login_failed: UmamiEvents.LOGIN_FAILED,
    logout: UmamiEvents.LOGOUT,
    signup_success: UmamiEvents.SIGNUP_SUCCESS,
  }
  
  trackEvent(eventMap[action], {
    method,
  })
}

/**
 * 追踪导航点击
 * @param target 目标
 * @param source 来源
 */
export function trackNavClick(target: string, source?: string): void {
  trackEvent(UmamiEvents.NAV_CLICK, {
    target,
    source,
  })
}

/**
 * 追踪 CTA 按钮点击
 * @param ctaName CTA 名称
 * @param location 位置
 */
export function trackCTAClick(ctaName: string, location?: string): void {
  trackEvent(UmamiEvents.CTA_CLICK, {
    cta_name: ctaName,
    location,
  })
}

/**
 * 追踪语言切换
 * @param fromLang 原语言
 * @param toLang 目标语言
 */
export function trackLanguageChange(fromLang: string, toLang: string): void {
  trackEvent(UmamiEvents.LANGUAGE_CHANGE, {
    from: fromLang,
    to: toLang,
  })
}

/**
 * 追踪视图模式切换
 * @param mode 视图模式
 */
export function trackViewModeChange(mode: string): void {
  trackEvent(UmamiEvents.VIEW_MODE_CHANGE, {
    mode,
  })
}

/**
 * 追踪筛选操作
 * @param filterType 筛选类型
 * @param value 筛选值
 */
export function trackFilter(filterType: 'tag' | 'visibility' | 'sort', value: string): void {
  const eventMap = {
    tag: UmamiEvents.FILTER_TAG,
    visibility: UmamiEvents.FILTER_VISIBILITY,
    sort: UmamiEvents.SORT_CHANGE,
  }
  
  trackEvent(eventMap[filterType], {
    value,
  })
}

/**
 * 追踪下载事件
 * @param platform 平台类型
 * @param version 版本号
 */
export function trackDownload(platform: 'windows' | 'macos' | 'linux' | 'chrome_extension', version?: string): void {
  trackEvent(UmamiEvents.DOWNLOAD, {
    platform,
    version,
  })
}