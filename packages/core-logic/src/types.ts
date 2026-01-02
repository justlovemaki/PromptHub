import { z } from 'zod';

// ============== 基础数据类型 ==============

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
  stripeCustomerId: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  subscriptionEndDate: z.date().nullable(),
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

// 成员关系类型
export const MembershipSchema = z.object({
  id: z.string(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  userId: z.string(),
  spaceId: z.string(),
  createdAt: z.date(),
});

export type Membership = z.infer<typeof MembershipSchema>;

// 提示词类型
export const PromptSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  content: z.string().default(''),
  description: z.string().default('').optional(),
  tags: z.array(z.string()).default([]).optional(), // 字符串数组存储标签
  imageUrls: z.array(z.string()).default([]).optional(), // 字符串数组存储图片链接
  author: z.string().default('').optional(),
  isPublic: z.boolean().default(false),
  useCount: z.number().default(0),
  spaceId: z.string(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Prompt = z.infer<typeof PromptSchema>;

// 提示词使用历史类型
export const PromptUsageSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  userId: z.string(),
  usedAt: z.date(),
  metadata: z.string().optional(), // JSON字符串存储额外信息
});

export type PromptUsage = z.infer<typeof PromptUsageSchema>;

// ============== API 请求和响应类型 ==============

// 登录请求
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// 登录响应
export const LoginResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  sessionId: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// 创建提示词请求
export const CreatePromptRequestSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  author: z.string().optional(),
  isPublic: z.boolean().default(false),
  useCount: z.number().default(0).optional(),
  spaceId: z.string(),
});

export type CreatePromptRequest = z.infer<typeof CreatePromptRequestSchema>;

// 更新提示词请求
export const UpdatePromptRequestSchema = z.object({
  id: z.string(),
  title: z.string().min(1, '标题不能为空').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  author: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdatePromptRequest = z.infer<typeof UpdatePromptRequestSchema>;

// 删除提示词请求
export const DeletePromptRequestSchema = z.object({
  id: z.string(),
});

export type DeletePromptRequest = z.infer<typeof DeletePromptRequestSchema>;

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

// ============== API 响应包装类型 ==============

// 成功响应
export const ApiSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

// 错误响应
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// 通用API响应类型
export type ApiResponse<T> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: { code: string; message: string; details?: any } };

// ============== SSE 事件类型 ==============

export const SSEEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('prompt_created'),
    data: PromptSchema,
    spaceId: z.string(),
  }),
  z.object({
    type: z.literal('prompt_updated'), 
    data: PromptSchema,
    spaceId: z.string(),
  }),
  z.object({
    type: z.literal('prompt_deleted'),
    data: z.object({ id: z.string() }),
    spaceId: z.string(),
  }),
  z.object({
    type: z.literal('user_joined'),
    data: UserSchema,
    spaceId: z.string(),
  }),
  z.object({
    type: z.literal('user_left'),
    data: z.object({ userId: z.string() }),
    spaceId: z.string(),
  }),
]);

export type SSEEvent = z.infer<typeof SSEEventSchema>;

// ============== 管理员相关类型 ==============

// 用户列表查询参数
export const AdminUserListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  subscriptionStatus: z.enum(['FREE', 'PRO', 'TEAM']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'email', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;

// 用户列表响应
export const AdminUserListResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;

// 更新用户请求
export const AdminUpdateUserRequestSchema = z.object({
  userId: z.string(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  subscriptionStatus: z.enum(['FREE', 'PRO', 'TEAM']).optional(),
  subscriptionEndDate: z.date().nullable().optional(),
});

export type AdminUpdateUserRequest = z.infer<typeof AdminUpdateUserRequestSchema>;

// 热门提示词响应
export const PopularPromptsSchema = z.array(z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.string().optional(),
  useCount: z.number(),
  createdAt: z.date(),
}));

export type PopularPromptsResponse = z.infer<typeof PopularPromptsSchema>;

// 系统统计类型
export const AdminStatsSchema = z.object({
  totalUsers: z.number(),
  totalPrompts: z.number(),
  totalSpaces: z.number(),
  activeUsers: z.number(), // 最近30天活跃用户
  newUsersThisMonth: z.number(),
  subscriptionStats: z.object({
    free: z.number(),
    pro: z.number(),
    team: z.number(),
  }),
  recentActivity: z.array(z.object({
    id: z.string(),
    type: z.enum(['user_created', 'prompt_created', 'prompt_used']),
    userId: z.string(),
    userName: z.string().optional(),
    timestamp: z.date(),
    metadata: z.any().optional(),
  })),
});

export type AdminStats = z.infer<typeof AdminStatsSchema>;

// ============== 提示词统计类型 ==============

// 提示词统计响应
export const PromptStatsSchema = z.object({
  totalPrompts: z.number(),
  publicPrompts: z.number(),
  privatePrompts: z.number(),
  monthlyCreated: z.number(), // 本月创建的提示词数量
  recentPrompts: z.array(z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.date(),
    isPublic: z.boolean(),
  })),
});

export type PromptStats = z.infer<typeof PromptStatsSchema>;

// 提示词统计查询参数
export const PromptStatsQuerySchema = z.object({
  spaceId: z.string(),
  search: z.string().optional(),
});

export type PromptStatsQuery = z.infer<typeof PromptStatsQuerySchema>;

// ============== 仪表盘统计类型 ==============

// 仪表盘统计响应
export const DashboardStatsSchema = z.object({
  // 我的提示词总数
  totalPrompts: z.number(),
  // 公开提示词数量
  publicPrompts: z.number(),
  // 私有提示词数量
  privatePrompts: z.number(),
  // 本月创建
  monthlyCreated: z.number(),
  // 剩余点数（从用户订阅状态计算）
  remainingCredits: z.number(),
  // 标签数量
  tagsCount: z.number(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// ============== 计费相关类型 ==============

// 创建支付会话请求
export const CreateCheckoutSessionRequestSchema = z.object({
  priceId: z.string(),
  returnUrl: z.string(),
});

export type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionRequestSchema>;

// 支付会话响应
export const CheckoutSessionResponseSchema = z.object({
  sessionId: z.string(),
  url: z.string(),
});

export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;

// ============== 表单验证辅助函数 ==============

export const validatePromptForm = (data: unknown): CreatePromptRequest => {
  return CreatePromptRequestSchema.parse(data);
};

export const validateUpdatePromptForm = (data: unknown): UpdatePromptRequest => {
  return UpdatePromptRequestSchema.parse(data);
};

export const validateLoginForm = (data: unknown): LoginRequest => {
  return LoginRequestSchema.parse(data);
};

// ============== 系统日志类型 ==============

// 系统日志类型
export const SystemLogSchema = z.object({
  id: z.string(),
  level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
  category: z.enum(['AUTH', 'API', 'USER', 'SYSTEM', 'SECURITY', 'PERFORMANCE']),
  message: z.string(),
  details: z.string().optional(), // JSON字符串存储额外详情
  userId: z.string().nullable(),
  userEmail: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  timestamp: z.date(),
  statusCode: z.number().nullable(),
});

export type SystemLog = z.infer<typeof SystemLogSchema>;

// 系统日志列表查询参数
export const SystemLogListQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['timestamp', 'level', 'category']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']).optional(),
  category: z.enum(['AUTH', 'API', 'USER', 'SYSTEM', 'SECURITY', 'PERFORMANCE']).optional(),
  search: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type SystemLogListQuery = z.infer<typeof SystemLogListQuerySchema>;

// 系统日志列表响应
export const SystemLogListResponseSchema = z.object({
  logs: z.array(SystemLogSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type SystemLogListResponse = z.infer<typeof SystemLogListResponseSchema>;

// ============== 导出所有类型 ==============

export * from './api-client';
export * from './stores';

// 标签相关类型
export interface TagWithCount {
  name: string;
  count: number;
}

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

// 订阅状态类型
export type SubscriptionStatus = 'FREE' | 'PRO' | 'TEAM';

// 订阅状态常量
export const SUBSCRIPTION_STATUS = {
  FREE: 'FREE',
  PRO: 'PRO',
  TEAM: 'TEAM',
} as const;

// 用户角色类型
export type UserRole = 'USER' | 'ADMIN';

// 用户角色常量
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type GetPromptTagsResponse = TagWithCount[];

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