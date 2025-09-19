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
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  User,
} from './types';

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
    } = {}
  ): Promise<ApiResponse<T>> {
    const { body, requireAuth = true, ...fetchOptions } = options;
    
    const url = `${this.config.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(fetchOptions.headers || {}).map(([k, v]) => [k, String(v)])
      ),
    };

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

  private get<T>(endpoint: string, requireAuth = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  private post<T>(
    endpoint: string,
    body?: any,
    requireAuth = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  // ============== 认证相关 API ==============

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/api/auth/login', data, false);
  }

  async register(data: LoginRequest & { name: string }): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/api/auth/register', data, false);
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.post<void>('/api/auth/logout');
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/api/auth/me');
  }

  // ============== 提示词相关 API ==============

  async getPrompts(query?: PromptListQuery): Promise<ApiResponse<PromptListResponse>> {
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
    
    return this.get<PromptListResponse>(endpoint);
  }

  async createPrompt(data: CreatePromptRequest): Promise<ApiResponse<Prompt>> {
    return this.post<Prompt>('/api/prompts/create', data);
  }

  async updatePrompt(data: UpdatePromptRequest): Promise<ApiResponse<Prompt>> {
    return this.post<Prompt>('/api/prompts/update', data);
  }

  async deletePrompt(data: DeletePromptRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/api/prompts/delete', data);
  }

  async getPrompt(id: string): Promise<ApiResponse<Prompt>> {
    return this.get<Prompt>(`/api/prompts/${id}`);
  }

  async getPromptStats(query?: PromptStatsQuery): Promise<ApiResponse<PromptStats>> {
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
    
    return this.get<PromptStats>(endpoint);
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.get<DashboardStats>('/api/dashboard/stats');
  }

  async incrementPromptUseCount(promptId: string): Promise<ApiResponse<{ id: string; useCount: number }>> {
    return this.post<{ id: string; useCount: number }>('/api/prompts/use', { promptId });
  }

  // ============== 管理员相关 API ==============

  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return this.get<AdminStats>('/api/admin/stats/get');
  }

  async getAdminUsers(query?: AdminUserListQuery): Promise<ApiResponse<AdminUserListResponse>> {
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
    
    return this.get<AdminUserListResponse>(endpoint);
  }

  async updateAdminUser(data: AdminUpdateUserRequest): Promise<ApiResponse<User>> {
    return this.post<User>('/api/admin/users/update', data);
  }

  // ============== 计费相关 API ==============

  async createCheckoutSession(
    data: CreateCheckoutSessionRequest
  ): Promise<ApiResponse<CheckoutSessionResponse>> {
    return this.post<CheckoutSessionResponse>('/api/billing/create-checkout-session', data);
  }

  // ============== 健康检查 API ==============

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get<{ status: string; timestamp: string }>('/api/health', false);
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
  login: (data: LoginRequest) => getApiClient().login(data),
  register: (data: LoginRequest & { name: string }) => getApiClient().register(data),
  logout: () => getApiClient().logout(),
  getCurrentUser: () => getApiClient().getCurrentUser(),
  
  // 提示词
  getPrompts: (query?: PromptListQuery) => getApiClient().getPrompts(query),
  createPrompt: (data: CreatePromptRequest) => getApiClient().createPrompt(data),
  updatePrompt: (data: UpdatePromptRequest) => getApiClient().updatePrompt(data),
  deletePrompt: (data: DeletePromptRequest) => getApiClient().deletePrompt(data),
  getPrompt: (id: string) => getApiClient().getPrompt(id),
  getPromptStats: (query?: PromptStatsQuery) => getApiClient().getPromptStats(query),
  getDashboardStats: () => getApiClient().getDashboardStats(),
  incrementPromptUseCount: (promptId: string) => getApiClient().incrementPromptUseCount(promptId),
  
  // 管理员
  getAdminStats: () => getApiClient().getAdminStats(),
  getAdminUsers: (query?: AdminUserListQuery) => getApiClient().getAdminUsers(query),
  updateAdminUser: (data: AdminUpdateUserRequest) => getApiClient().updateAdminUser(data),
  
  // 计费
  createCheckoutSession: (data: CreateCheckoutSessionRequest) => getApiClient().createCheckoutSession(data),
  
  // 工具
  healthCheck: () => getApiClient().healthCheck(),
  createSSEConnection: (onMessage: (event: MessageEvent) => void, onError?: (error: Event) => void) => 
    getApiClient().createSSEConnection(onMessage, onError),
};