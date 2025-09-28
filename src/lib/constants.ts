/**
 * 魔法值统一管理文件
 * 包含应用中使用的所有魔法值常量
 */

// ============== 用户相关常量 ==============
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export const SUBSCRIPTION_STATUS = {
  FREE: 'FREE',
  PRO: 'PRO',
  TEAM: 'TEAM',
} as const;

export const SPACE_TYPES = {
  PERSONAL: 'PERSONAL',
  TEAM: 'TEAM',
} as const;

// ============== AI点数相关常量 ==============
export const AI_POINTS_TYPES = {
  EARN: 'EARN',
  USE: 'USE',
  ADMIN: 'ADMIN',
} as const;

// ============== 系统日志常量 ==============
export const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
} as const;

export const LOG_CATEGORIES = {
  AUTH: 'AUTH',
  API: 'API',
  USER: 'USER',
  SYSTEM: 'SYSTEM',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
} as const;

// ============== 语言设置 ==============
export const LANGUAGES = {
  ENGLISH: 'en',
  CHINESE_SIMPLIFIED: 'zh-CN',
  JAPANESE: 'ja',
} as const;

export const FALLBACK_LANGUAGE = LANGUAGES.ENGLISH;

// ============== Stripe相关常量 ==============
export const STRIPE_SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  PAST_DUE: 'past_due',
  INCOMPLETE: 'incomplete',
} as const;

// ============== 类型导出 ==============
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export type SpaceType = typeof SPACE_TYPES[keyof typeof SPACE_TYPES];
export type AiPointsType = typeof AI_POINTS_TYPES[keyof typeof AI_POINTS_TYPES];
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
export type LogCategory = typeof LOG_CATEGORIES[keyof typeof LOG_CATEGORIES];
export type Language = typeof LANGUAGES[keyof typeof LANGUAGES];

// ============== Zod 验证常量 ==============
export const ZOD_USER_ROLE_VALUES = Object.values(USER_ROLES) as [UserRole, ...UserRole[]];
export const ZOD_ADMIN_USER_ROLE_VALUES = [USER_ROLES.USER, USER_ROLES.ADMIN] as const;
export const ZOD_SUBSCRIPTION_STATUS_VALUES = Object.values(SUBSCRIPTION_STATUS) as [SubscriptionStatus, ...SubscriptionStatus[]];

// ============== AI点数套餐 ==============
export const AI_POINTS_PACKAGES = {
  small: { points: 1000, price: 1000 }, // 1000点 = 10元
  medium: { points: 5000, price: 4500 }, // 5000点 = 45元
  large: { points: 10000, price: 8000 }, // 10000点 = 80元
} as const;

export type AiPointsPackageType = keyof typeof AI_POINTS_PACKAGES;

// ============== 环境配置默认值 ==============
export const FALLBACK_DEFAULT_CONFIG = {
  AUTH_SECRET: "fallback_secret_key",
  AUTH_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  APP_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
} as const;

// ============== 排序字段配置 ==============
export const SORT_FIELDS = {
  PROMPTS: ['title', 'createdAt', 'updatedAt', 'useCount'] as const,
  USERS: ['id', 'email', 'name', 'role', 'subscriptionStatus', 'createdAt', 'updatedAt'] as const,
  LOGS: ['timestamp', 'level', 'category'] as const,
} as const;

export const SORT_ORDERS = ['asc', 'desc'] as const;

// ============== 类型别名 ==============
export type PromptSortField = typeof SORT_FIELDS.PROMPTS[number];
export type UserSortField = typeof SORT_FIELDS.USERS[number];
export type LogSortField = typeof SORT_FIELDS.LOGS[number];
export type SortOrder = typeof SORT_ORDERS[number];

// ============== 缓存和速率限制配置 ==============
export const CACHE_CONFIG = {
  USER_CACHE_DURATION: 5000, // 5秒缓存
  RATE_LIMIT_DURATION: 2000, // 2秒内最多1次请求
} as const;

// ============== UI/UX 配置 ==============
export const UI_CONFIG = {
  TOAST_DEFAULT_DURATION: 3000, // 3秒默认显示时间
  TOAST_ERROR_DURATION: 5000, // 5秒错误显示时间
} as const;

// ============== SSE 相关常量 ==============
export const API_CONFIG = {
  SSE_HEARTBEAT_INTERVAL: 30000, // 30秒心跳间隔
  EXPORT_FILENAME: 'prompts-export.json',
} as const;

// ============== 订阅相关常量 ==============
export const SUBSCRIPTION_TYPES = {
  PRO: 'PRO',
  TEAM: 'TEAM',
} as const;

export const SUBSCRIPTION_STATUSES_FOR_FREE = [
  STRIPE_SUBSCRIPTION_STATUS.CANCELED,
  STRIPE_SUBSCRIPTION_STATUS.UNPAID,
  STRIPE_SUBSCRIPTION_STATUS.PAST_DUE,
] as const;

// ============== 用于验证的数组常量 ==============
export const VALID_USER_ROLES = [USER_ROLES.USER, USER_ROLES.ADMIN] as const;

export const VALID_SUBSCRIPTION_STATUSES = [
  SUBSCRIPTION_STATUS.FREE,
  SUBSCRIPTION_STATUS.PRO,
  SUBSCRIPTION_STATUS.TEAM,
] as const;

// ============== 订阅操作类型 ==============
export const SUBSCRIPTION_ACTIONS = {
  UPGRADE: 'upgrade',
  DOWNGRADE: 'downgrade',
  CANCEL: 'cancel',
} as const;

export type SubscriptionAction = typeof SUBSCRIPTION_ACTIONS[keyof typeof SUBSCRIPTION_ACTIONS];

// ============== 提示词可见性类型 ==============
export const PROMPT_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export type PromptVisibility = typeof PROMPT_VISIBILITY[keyof typeof PROMPT_VISIBILITY];
