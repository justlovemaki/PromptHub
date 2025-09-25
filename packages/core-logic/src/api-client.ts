import type {
   ApiResponse,
   LoginRequest,
   LoginResponse,
   CreatePromptRequest,
   UpdatePromptRequest,
   DeletePromptRequest,
   PromptListQuery,
   PromptListResponse,
   Prompt,
   PromptStats,
   PromptStatsQuery,
   DashboardStats,
   AdminUserListQuery,
   AdminUserListResponse,
   AdminUpdateUserRequest,
   AdminStats,
   PopularPromptsResponse,
   CreateCheckoutSessionRequest,
   CheckoutSessionResponse,
   User,
   SystemLogListQuery,
   SystemLogListResponse,
   TagWithCount,
 } from './types';
import { useAuthStore } from './stores/auth-store';

// ============== 辅助函数 ==============

function createUrlWithQuery(baseUrl: string, query?: Record<string, any>): string {
 if (!query) return baseUrl;
 
 const params = new URLSearchParams();
 
 Object.entries(query).forEach(([key, value]) => {
   if (value !== undefined && value !== null) {
     if (Array.isArray(value)) {
       value.forEach(v => params.append(key, v.toString()));
     } else if (value instanceof Date) {
       params.append(key, value.toISOString());
     } else if (typeof value === 'boolean') {
       params.append(key, value.toString());
     } else {
       params.append(key, value.toString());
     }
   }
 });
 
 const queryString = params.toString();
 return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// ============== API 客户端配置 ==============

export interface ApiClientConfig {
  baseURL: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
  onError?: (error: any) => void;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  // ============== 通用请求方法 ==============

  private async request<T>(
    endpoint: string,
    options: RequestInit & {
      body?: any;
      requireAuth?: boolean;
      lang?: string;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { body, requireAuth = true, lang, ...fetchOptions } = options;
    
    const url = `${this.config.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(fetchOptions.headers || {}).map(([k, v]) => [k, String(v)])
      ),
    };

    // 添加语言header
    if (lang) {
      headers['x-next-locale'] = lang;
    }

    // 添加认证token
    if (requireAuth) {
      const token = this.config.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '未授权访问，请先登录',
          },
        };
      }
    }

    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.config.onUnauthorized?.();
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: '认证失败，请重新登录',
            },
          };
        }

        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || `请求失败 (${response.status})`,
            details: data,
          },
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('API request failed:', error);
      this.config.onError?.(error);
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络请求失败，请检查网络连接',
          details: error,
        },
      };
    }
  }

  public get<T>(endpoint: string, requireAuth = true, lang?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth, lang });
  }

  public post<T>(
    endpoint: string,
    body?: any,
    requireAuth = true,
    lang?: string
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth, lang });
  }

  // ============== 认证相关 API ==============

  async login(data: LoginRequest, lang?: string): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/api/auth/login', data, false, lang);
  }

  async register(data: LoginRequest & { name: string }, lang?: string): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/api/auth/register', data, false, lang);
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/logout');
  }

  async getCurrentUser(lang?: string): Promise<ApiResponse<User>> {
    return this.get<User>('/api/auth/me', true, lang);
  }

  async updateUser(data: { name?: string }, lang?: string): Promise<ApiResponse<User>> {
    return this.post<User>('/api/user/update', data, true, lang);
  }

  // ============== 提示词相关 API ==============

  async getPrompts(query?: PromptListQuery, lang?: string): Promise<ApiResponse<PromptListResponse>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/prompts/list?${queryString}` : '/api/prompts/list';
    
    return this.get<PromptListResponse>(endpoint, true, lang);
  }

  async createPrompt(data: CreatePromptRequest, lang?: string): Promise<ApiResponse<Prompt>> {
    return this.post<Prompt>('/api/prompts/create', data, true, lang);
  }

  async updatePrompt(data: UpdatePromptRequest, lang?: string): Promise<ApiResponse<Prompt>> {
    return this.post<Prompt>('/api/prompts/update', data, true, lang);
  }

  async deletePrompt(data: DeletePromptRequest, lang?: string): Promise<ApiResponse<void>> {
    return this.post<void>('/api/prompts/delete', data, true, lang);
  }

  async getPrompt(id: string, lang?: string): Promise<ApiResponse<Prompt>> {
    return this.get<Prompt>(`/api/prompts/${id}`, true, lang);
  }

  async getPromptStats(query?: PromptStatsQuery, lang?: string): Promise<ApiResponse<PromptStats>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/prompts/stats?${queryString}` : '/api/prompts/stats';
    
    return this.get<PromptStats>(endpoint, true, lang);
  }

  async getDashboardStats(lang?: string): Promise<ApiResponse<DashboardStats>> {
    return this.get<DashboardStats>('/api/dashboard/stats', true, lang);
  }

  async getPromptTags(query?: PromptStatsQuery, lang?: string): Promise<ApiResponse<TagWithCount[]>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/prompts/tags?${queryString}` : '/api/prompts/tags';

    return this.get<TagWithCount[]>(endpoint, true, lang);
  }

  async incrementPromptUseCount(promptId: string, lang?: string): Promise<ApiResponse<{ id: string; useCount: number }>> {
    return this.post<{ id: string; useCount: number }>('/api/prompts/use', { promptId }, true, lang);
  }

  async getAiPointsUsage(lang?: string): Promise<ApiResponse<{
    totalPoints: number;
    usedPoints: number;
    remainingPoints: number;
    usageRecords: any[]
  }>> {
    return this.get<{
      totalPoints: number;
      usedPoints: number;
      remainingPoints: number;
      usageRecords: any[]
    }>('/api/user/ai-points', true, lang);
  }

  async purchaseAiPoints(packageType: 'small' | 'medium' | 'large', lang?: string): Promise<ApiResponse<{
    userId: string;
    newBalance: number;
    purchasedPoints: number
  }>> {
    return this.post<{
      userId: string;
      newBalance: number;
      purchasedPoints: number
    }>('/api/user/purchase-ai-points', { packageType }, true, lang);
  }

  async manageSubscription(action: 'upgrade' | 'downgrade' | 'cancel', lang?: string): Promise<ApiResponse<{
    userId: string;
    subscriptionStatus: string;
  }>> {
    return this.post<{
      userId: string;
      subscriptionStatus: string;
    }>('/api/user/subscription', { action }, true, lang);
  }

  // ============== 管理员相关 API ==============

  async getAdminStats(lang?: string): Promise<ApiResponse<AdminStats>> {
    return this.get<AdminStats>('/api/admin/stats/get', true, lang);
  }

  async getAdminUsers(query?: AdminUserListQuery, lang?: string): Promise<ApiResponse<AdminUserListResponse>> {
    const params = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/admin/users/list?${queryString}` : '/api/admin/users/list';
    
    return this.get<AdminUserListResponse>(endpoint, true, lang);
  }

  async updateAdminUser(data: AdminUpdateUserRequest, lang?: string): Promise<ApiResponse<User>> {
    return this.post<User>('/api/admin/users/update', data, true, lang);
  }

  async getAdminPopularPrompts(limit?: number, lang?: string): Promise<ApiResponse<PopularPromptsResponse>> {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/admin/prompts/popular?${queryString}` : '/api/admin/prompts/popular';

    return this.get<PopularPromptsResponse>(endpoint, true, lang);
  }

  async getAdminPrompts(query?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    spaceId?: string;
    isPublic?: boolean;
  }, lang?: string): Promise<ApiResponse<PromptListResponse>> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/admin/prompts/list?${queryString}` : '/api/admin/prompts/list';

    return this.get<PromptListResponse>(endpoint, true, lang);
  }

  // ============== 系统日志相关 API ==============

  async getSystemLogs(query?: SystemLogListQuery, lang?: string): Promise<ApiResponse<SystemLogListResponse>> {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/admin/logs/list?${queryString}` : '/api/admin/logs/list';

    return this.get<SystemLogListResponse>(endpoint, true, lang);
  }

  // ============== 计费相关 API ==============

  async createCheckoutSession(
    data: CreateCheckoutSessionRequest,
    lang?: string
  ): Promise<ApiResponse<CheckoutSessionResponse>> {
    return this.post<CheckoutSessionResponse>('/api/billing/create-checkout-session', data, true, lang);
  }

  // ============== 健康检查 API ==============

  async healthCheck(lang?: string): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get<{ status: string; timestamp: string }>('/api/health', false, lang);
  }

  // ============== SSE 连接 ==============

  createSSEConnection(onMessage: (event: MessageEvent) => void, onError?: (error: Event) => void): EventSource | null {
    const token = this.config.getToken();
    if (!token) {
      console.error('无法建立SSE连接：缺少认证token');
      return null;
    }

    try {
      const eventSource = new EventSource(`${this.config.baseURL}/api/sse?token=${encodeURIComponent(token)}`);
      
      eventSource.onmessage = onMessage;
      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        onError?.(error);
      };

      eventSource.onopen = () => {
        console.log('SSE连接已建立');
      };

      return eventSource;
    } catch (error) {
      console.error('创建SSE连接失败:', error);
      onError?.(error as Event);
      return null;
    }
  }
}

// ============== 创建默认客户端实例 ==============

let defaultApiClient: ApiClient | null = null;

export const createApiClient = (config: ApiClientConfig): ApiClient => {
  // 如果已经有默认客户端，直接返回（避免重复初始化）
  if (defaultApiClient) {
    console.log('API客户端已存在，跳过重复初始化');
    return defaultApiClient;
  }
  
  const client = new ApiClient(config);
  defaultApiClient = client;
  console.log('API客户端已初始化，baseURL:', config.baseURL);
  return client;
};

export const getApiClient = (): ApiClient => {
  if (!defaultApiClient) {
    // 如果在客户端环境且尚未初始化，则自动初始化
    if (typeof window !== 'undefined') {
      console.log('API客户端未初始化，自动初始化...');
      const baseURL = process.env.NEXT_PUBLIC_APP_URL ||
                     process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ||
                     window.location.origin || 'http://localhost:3000';
      
      return createApiClient({
        baseURL,
        getToken: () => {
          // 从auth store获取token
          try {
            return useAuthStore.getState().token;
          } catch (error) {
            console.warn('获取token时出错:', error);
            return null;
          }
        },
        onUnauthorized: () => {
          // 当收到401错误时，清理认证状态
          try {
            const { setUser, setToken } = useAuthStore.getState();
            setUser(null);
            setToken(null);
            console.log('API客户端: 认证失败，已清理用户状态');
          } catch (error) {
            console.warn('清理认证状态时出错:', error);
          }
        },
        onError: (error) => {
          console.error('API客户端错误:', error);
        },
      });
    }
    // 在服务端或无法自动初始化时抛出错误
    throw new Error('API客户端未初始化，请先调用 createApiClient()');
  }
  return defaultApiClient;
};

// ============== 便捷方法 ==============

export const api = {
  get client() {
    return getApiClient();
  },
  
  // 认证
  login: (data: LoginRequest, lang?: string) => getApiClient().login(data, lang),
  register: (data: LoginRequest & { name: string }, lang?: string) => getApiClient().register(data, lang),
  logout: () => getApiClient().logout(),
  getCurrentUser: (lang?: string) => getApiClient().getCurrentUser(lang),
  updateUser: (data: { name?: string }, lang?: string) => getApiClient().updateUser(data, lang),
  
  // 提示词
  getPrompts: (query?: PromptListQuery, lang?: string) => getApiClient().get<PromptListResponse>(createUrlWithQuery('/api/prompts/list', query), true, lang),
  createPrompt: (data: CreatePromptRequest, lang?: string) => getApiClient().post<Prompt>('/api/prompts/create', data, true, lang),
  updatePrompt: (data: UpdatePromptRequest, lang?: string) => getApiClient().post<Prompt>('/api/prompts/update', data, true, lang),
  deletePrompt: (data: DeletePromptRequest, lang?: string) => getApiClient().post<void>('/api/prompts/delete', data, true, lang),
  getPrompt: (id: string, lang?: string) => getApiClient().get<Prompt>(`/api/prompts/${id}`, true, lang),
  getPromptStats: (query?: PromptStatsQuery, lang?: string) => getApiClient().get<PromptStats>(createUrlWithQuery('/api/prompts/stats', query), true, lang),
  getDashboardStats: (lang?: string) => getApiClient().get<DashboardStats>('/api/dashboard/stats', true, lang),
  getPromptTags: (query?: PromptStatsQuery, lang?: string) => getApiClient().get<TagWithCount[]>(createUrlWithQuery('/api/prompts/tags', query), true, lang),
  incrementPromptUseCount: (promptId: string, lang?: string) => getApiClient().post<{ id: string; useCount: number }>('/api/prompts/use', { promptId }, true, lang),
  getAiPointsUsage: (lang?: string) => getApiClient().get<{ totalPoints: number; usedPoints: number; remainingPoints: number; usageRecords: any[] }>('/api/user/ai-points', true, lang),
  purchaseAiPoints: (packageType: 'small' | 'medium' | 'large', lang?: string) => getApiClient().post<{ userId: string; newBalance: number; purchasedPoints: number }>('/api/user/purchase-ai-points', { packageType }, true, lang),
  manageSubscription: (action: 'upgrade' | 'downgrade' | 'cancel', lang?: string) => getApiClient().post<{ userId: string; subscriptionStatus: string }>('/api/user/subscription', { action }, true, lang),
  
  // 管理员
  getAdminStats: (lang?: string) => getApiClient().get<AdminStats>('/api/admin/stats/get', true, lang),
  getAdminUsers: (query?: AdminUserListQuery, lang?: string) => getApiClient().get<AdminUserListResponse>(createUrlWithQuery('/api/admin/users/list', query), true, lang),
  updateAdminUser: (data: AdminUpdateUserRequest, lang?: string) => getApiClient().post<User>('/api/admin/users/update', data, true, lang),
  getAdminPopularPrompts: (limit?: number, lang?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    const endpoint = queryString ? `/api/admin/prompts/popular?${queryString}` : '/api/admin/prompts/popular';
    return getApiClient().get<PopularPromptsResponse>(endpoint, true, lang);
  },
  getAdminPrompts: (query?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; spaceId?: string; isPublic?: boolean; }, lang?: string) => getApiClient().get<PromptListResponse>(createUrlWithQuery('/api/admin/prompts/list', query), true, lang),
  getSystemLogs: (query?: SystemLogListQuery, lang?: string) => getApiClient().get<SystemLogListResponse>(createUrlWithQuery('/api/admin/logs/list', query), true, lang),
  
  // 计费
  createCheckoutSession: (data: CreateCheckoutSessionRequest, lang?: string) => getApiClient().post<CheckoutSessionResponse>('/api/billing/create-checkout-session', data, true, lang),
  
  // 工具
  healthCheck: (lang?: string) => getApiClient().get<{ status: string; timestamp: string }>('/api/health', false, lang),
  createSSEConnection: (onMessage: (event: MessageEvent) => void, onError?: (error: Event) => void) =>
    getApiClient().createSSEConnection(onMessage, onError),
};