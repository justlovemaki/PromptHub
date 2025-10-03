import { z } from 'zod';

// 提示词类型 - 这是Palette组件实际需要的类型
export const PromptSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  content: z.string().default(''),
  description: z.string().default('').optional(),
  tags: z.array(z.string()).default([]).optional(), // 字符串数组存储标签
  isPublic: z.boolean().default(false),
  useCount: z.number().default(0),
  spaceId: z.string(),
  createdBy: z.string(),
  createdAt: z.string(), // API返回的是ISO字符串格式，而非Date对象
  updatedAt: z.string(), // API返回的是ISO字符串格式，而非Date对象
});

export type Prompt = z.infer<typeof PromptSchema>;

// 用户类型
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  image: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullable(),
  displayUsername: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  subscriptionStatus: z.enum(['FREE', 'PRO', 'TEAM']).default('FREE'),
  subscriptionAiPoints: z.number().default(0), // 用户的AI点数
  personalSpaceId: z.string().nullable(), // 用户的个人空间ID
});

export type User = z.infer<typeof UserSchema>;

// 空间类型
export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['PERSONAL', 'TEAM']),
  ownerId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Space = z.infer<typeof SpaceSchema>;

// 提示词列表查询参数
export const PromptListQuerySchema = z.object({
  spaceId: z.string().optional(),
  id: z.string().optional(), // 添加ID查询参数
  search: z.string().optional(),
  tag: z.string().optional(),
  isPublic: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'useCount']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PromptListQuery = z.infer<typeof PromptListQuerySchema>;

// 提示词列表响应
export const PromptListResponseSchema = z.object({
  prompts: z.array(PromptSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type PromptListResponse = z.infer<typeof PromptListResponseSchema>;

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