// 提示词类型 - 这是Palette组件实际需要的类型
export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[]; // 字符串数组存储标签
  isPublic: boolean;
  useCount: number;
  spaceId: string;
  createdBy: string;
  createdAt: string; // API返回的是ISO字符串格式，而非Date对象
  updatedAt: string; // API返回的是ISO字符串格式，而非Date对象
}

// 用户类型
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  username: string | null;
  displayUsername: string | null;
  role: 'USER' | 'ADMIN';
  subscriptionStatus: 'FREE' | 'PRO' | 'TEAM';
  subscriptionAiPoints: number; // 用户的AI点数
  personalSpaceId: string | null; // 用户的个人空间ID
}

// 空间类型
export interface Space {
  id: string;
  name: string;
  type: 'PERSONAL' | 'TEAM';
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 提示词列表查询参数
export interface PromptListQuery {
  spaceId?: string;
  id?: string; // 添加ID查询参数
  search?: string;
  tag?: string;
  isPublic?: boolean;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'useCount';
  sortOrder: 'asc' | 'desc';
}

// 提示词列表响应
export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 通用API响应类型
export type ApiResponse<T> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: { code: string; message: string; details?: any } };

// 标签相关类型
export interface TagWithCount {
  name: string;
  count: number;
}

// 订阅状态类型
export type SubscriptionStatus = 'FREE' | 'PRO' | 'TEAM';

// AI 点数套餐类型
export type AiPointsPackageType = 'small' | 'medium' | 'large';

// 订阅操作类型
export type SubscriptionAction = 'upgrade' | 'downgrade' | 'cancel';

// 日志级别类型
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

// 日志级别常量
export const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
} as const;

// 日志分类类型
export type LogCategory = 'AUTH' | 'API' | 'USER' | 'SYSTEM' | 'SECURITY' | 'PERFORMANCE';

// 日志分类常量
export const LOG_CATEGORIES = {
  AUTH: 'AUTH',
  API: 'API',
  USER: 'USER',
  SYSTEM: 'SYSTEM',
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
} as const;

// 用户角色类型
export type UserRole = 'USER' | 'ADMIN';

// 用户角色常量
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type GetPromptTagsResponse = TagWithCount[];

// 用户统计信息类型
export interface UserStats {
  totalPrompts?: number;
  publicPrompts?: number;
  privatePrompts?: number;
  monthlyCreated?: number;
  remainingCredits?: number;
  tagsCount?: number;
}

// 用户完整信息类型（用于UI显示）
export interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  username: string | null;
  displayUsername: string | null;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  subscriptionEndDate?: Date | null;
  subscriptionAiPoints: number;
  personalSpaceId: string | null;
}

// 提示词标签类型
export interface PromptTag {
  name: string;
  count: number;
}

// 访问令牌相关类型
export interface AccessToken {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewAccessToken {
  id?: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 标签配置相关类型 (用于标签功能)
export interface TagLabel {
  name: string;
  key: string;
  description: string;
}

export interface TagCategory {
  category_name: string;
  labels: TagLabel[];
}

export interface TagClassification {
  title: string;
  description: string;
  categories: Record<string, TagCategory>;
}

export interface TagsConfig {
  prompt_tags_classification: {
    scenario_tags: TagClassification;
    intent_tags: TagClassification;
  };
}