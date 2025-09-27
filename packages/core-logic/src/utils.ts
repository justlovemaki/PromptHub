// ============== 工具函数库 ==============

// ============== 日期时间工具 ==============

export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: Date | string | number): string => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return formatDate(date);
  }
};

// ============== 字符串工具 ==============

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线为连字符
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
};

// ============== 数组工具 ==============

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const groupBy = <T>(
  array: T[],
  keyFn: (item: T) => string | number
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = String(keyFn(item));
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(
  array: T[],
  keyFn: (item: T) => any,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// ============== 对象工具 ==============

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// ============== 本地存储工具 ==============

export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch {
      return defaultValue ?? null;
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

// ============== 防抖和节流 ==============

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  }) as T;
};

// ============== URL 工具 ==============

export const buildUrl = (
  base: string,
  params: Record<string, string | number | boolean | undefined>
): string => {
  const url = new URL(base);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
};

export const parseUrlParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

// ============== 复制到剪贴板 ==============

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// ============== 文件下载 ==============

export const downloadFile = (content: string, filename: string, contentType = 'text/plain'): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============== 错误处理 ==============

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', error);
  }
  
  return new AppError('发生未知错误', 'UNKNOWN_ERROR', error);
};

// ============== 表单验证 ==============

export const validators = {
  required: (value: any) => {
    if (isEmpty(value)) return '此字段为必填项';
    return null;
  },
  
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '请输入有效的邮箱地址';
    return null;
  },
  
  minLength: (min: number) => (value: string) => {
    if (value.length < min) return `至少需要 ${min} 个字符`;
    return null;
  },
  
  maxLength: (max: number) => (value: string) => {
    if (value.length > max) return `最多允许 ${max} 个字符`;
    return null;
  },
  
  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return '请输入有效的URL';
    }
  },
};

// ============== 常量 ==============

export const CONSTANTS = {
  // 分页
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // 文件大小
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // 延迟
  DEFAULT_DEBOUNCE_DELAY: 300,
  DEFAULT_THROTTLE_DELAY: 1000,
  
  // API
  DEFAULT_TIMEOUT: 30000, // 30秒
} as const;


// 系统日志工具类 - 提供统一的日志记录接口
import { LogLevel, LogCategory, LOG_LEVELS } from './types';

export class SystemLogger {
  private static instance: SystemLogger;

  private constructor() {}

  public static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: any,
    userId?: string,
    userEmail?: string,
    ip?: string,
    userAgent?: string,
    statusCode?: number
  ) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      category,
      message,
      details,
      userId,
      userEmail,
      ip,
      userAgent,
      statusCode,
    };

    // 在控制台输出日志
    console.log(`[${timestamp}] [${level}] [${category}] ${message}`, details || '');

    // 可以在此处添加发送到外部日志服务的代码

    return logData;
  }

  public info(
    category: LogCategory,
    message: string,
    details?: any,
    userId?: string,
    userEmail?: string,
    ip?: string,
    userAgent?: string
  ) {
    return this.log(LOG_LEVELS.INFO, category, message, details, userId, userEmail, ip, userAgent);
  }

  public warn(
    category: LogCategory,
    message: string,
    details?: any,
    userId?: string,
    userEmail?: string,
    ip?: string,
    userAgent?: string
  ) {
    return this.log(LOG_LEVELS.WARN, category, message, details, userId, userEmail, ip, userAgent);
  }

  public error(
    category: LogCategory,
    message: string,
    details?: any,
    userId?: string,
    userEmail?: string,
    ip?: string,
    userAgent?: string,
    statusCode?: number
  ) {
    return this.log(LOG_LEVELS.ERROR, category, message, details, userId, userEmail, ip, userAgent, statusCode);
  }

  public debug(
    category: LogCategory,
    message: string,
    details?: any,
    userId?: string,
    userEmail?: string,
    ip?: string,
    userAgent?: string
  ) {
    return this.log(LOG_LEVELS.DEBUG, category, message, details, userId, userEmail, ip, userAgent);
  }
}

// 导出单例实例
export const logger = SystemLogger.getInstance();

// 便捷的记录方法
export const logInfo = (category: LogCategory, message: string, details?: any) =>
  logger.info(category, message, details);

export const logWarn = (category: LogCategory, message: string, details?: any) =>
  logger.warn(category, message, details);

export const logError = (category: LogCategory, message: string, details?: any, statusCode?: number) =>
  logger.error(category, message, details, undefined, undefined, undefined, undefined, statusCode);

export const logDebug = (category: LogCategory, message: string, details?: any) =>
  logger.debug(category, message, details);