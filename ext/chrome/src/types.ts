// 为浏览器扩展定义类型

// 提示词类型
export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  isPublic: boolean;
  useCount: number;
  spaceId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户统计信息类型
export interface UserStats {
  subscriptionStatus: string;
  subscriptionAiPoints: number;
  promptCount: number;
  monthlyUsageCount: number;
  totalPrompts?: number;
  monthlyCreated?: number;
  remainingCredits?: number;
  tagsCount?: number;
  recentPrompts?: Prompt[];
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
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  subscriptionEndDate: Date | null;
  subscriptionAiPoints: number;
  personalSpaceId: string | null;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

// 提示词列表响应
export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 用户统计响应
export interface UserStatsResponse {
  subscription_status: string;
  subscription_ai_points: number;
  prompt_count: number;
  monthly_usage_count: number;
}