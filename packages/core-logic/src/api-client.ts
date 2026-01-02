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
   AiPointsPackageType,
   SubscriptionAction,
 } from './types';
 import { useAuthStore } from './stores/auth-store';

// ============== Utility Functions ==============

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

// ============== API Client Configuration ==============

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

  // ============== Generic Request Method ==============
  
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
// Add language header
if (lang) {

      headers['x-next-locale'] = lang;
    }
// Add authentication token
if (requireAuth) {

      const token = this.config.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized access, please log in first',
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
              message: 'Authentication failed, please log in again',
            },
          };
        }

        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || `Request failed (${response.status})`,
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
          message: 'Network request failed, please check your network connection',
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

  public delete<T>(endpoint: string, requireAuth = true, lang?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth, lang });
  }

  // ============== Authentication Related APIs ==============
  
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

  // ============== Prompt Related APIs ==============
  
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

  // ============== Favorite Related APIs ==============

  async addFavorite(promptId: string, lang?: string): Promise<ApiResponse<{
    favorited: boolean;
    alreadyExists: boolean;
    promptAlreadyInLibrary?: boolean;
    copiedPromptId?: string;
    existingPromptId?: string;
  }>> {
    return this.post<{
      favorited: boolean;
      alreadyExists: boolean;
      promptAlreadyInLibrary?: boolean;
      copiedPromptId?: string;
      existingPromptId?: string;
    }>('/api/prompts/favorite', { promptId }, true, lang);
  }

  async removeFavorite(promptId: string, lang?: string): Promise<ApiResponse<{
    favorited: boolean;
    removed: boolean;
  }>> {
    return this.delete<{
      favorited: boolean;
      removed: boolean;
    }>(`/api/prompts/favorite?promptId=${encodeURIComponent(promptId)}`, true, lang);
  }

  async checkFavorite(promptId: string, lang?: string): Promise<ApiResponse<{
    favorited: boolean;
  }>> {
    return this.get<{
      favorited: boolean;
    }>(`/api/prompts/favorite?promptId=${encodeURIComponent(promptId)}`, true, lang);
  }

  async checkFavorites(promptIds: string[], lang?: string): Promise<ApiResponse<{
    favorites: Record<string, boolean>;
  }>> {
    return this.get<{
      favorites: Record<string, boolean>;
    }>(`/api/prompts/favorite?promptIds=${promptIds.join(',')}`, true, lang);
  }

  async importPrompts(data: any[], spaceId?: string, lang?: string): Promise<ApiResponse<{ importedCount: number }>> {
    return this.post<{ importedCount: number }>('/api/prompts/import', { prompts: data, spaceId }, true, lang);
  }

  async exportPrompts(spaceId?: string, lang?: string): Promise<Blob> {

    const url = spaceId
      ? `${this.config.baseURL}/api/prompts/export?spaceId=${encodeURIComponent(spaceId)}`
      : `${this.config.baseURL}/api/prompts/export`;
      
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.getToken() || ''}`,
    };
        // Add language header
    if (lang) {
      headers['x-next-locale'] = lang;
    }
  
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.blob();
  }

  async clearPrompts(spaceId?: string, lang?: string): Promise<ApiResponse<{ clearedCount: number }>> {
    const url = spaceId
      ? `${this.config.baseURL}/api/prompts/clear?spaceId=${encodeURIComponent(spaceId)}`
      : `${this.config.baseURL}/api/prompts/clear`;
      
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.getToken() || ''}`,
    };
    // Add language header
    if (lang) {
      headers['x-next-locale'] = lang;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.message || `Request failed (${response.status})`,
          details: data,
        },
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
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

  async purchaseAiPoints(packageType: AiPointsPackageType, lang?: string): Promise<ApiResponse<{
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

  async manageSubscription(action: SubscriptionAction, lang?: string): Promise<ApiResponse<{
    userId: string;
    subscriptionStatus: string;
  }>> {
    return this.post<{
      userId: string;
      subscriptionStatus: string;
    }>('/api/user/subscription', { action }, true, lang);
  }

  // ============== Administrator Related APIs ==============
  
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

  // ============== System Log Related APIs ==============
  
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

  // ============== Billing Related APIs ==============
  
  async createCheckoutSession(
    data: CreateCheckoutSessionRequest,
    lang?: string
  ): Promise<ApiResponse<CheckoutSessionResponse>> {
    return this.post<CheckoutSessionResponse>('/api/billing/create-checkout-session', data, true, lang);
  }

  // ============== Health Check API ==============
  
  async healthCheck(lang?: string): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get<{ status: string; timestamp: string }>('/api/health', false, lang);
  }

  // ============== Access Token Related APIs ==============

  async getAccessToken(lang?: string): Promise<ApiResponse<{
    token: string;
    refreshToken?: string;
    expiresAt: Date | null;
    refreshTokenExpiresAt?: Date | null;
    scope?: string;
  }>> {
    return this.get<{
      token: string;
      refreshToken?: string;
      expiresAt: Date | null;
      refreshTokenExpiresAt?: Date | null;
      scope?: string;
    }>('/api/user/access-token', true, lang);
  }

  async refreshAccessToken(refreshToken?: string, expiresIn?: number, refreshExpiresIn?: number, lang?: string): Promise<ApiResponse<{
    token: string;
    expiresAt: Date | null;
    refreshToken?: string;
    refreshTokenExpiresAt?: Date | null;
    scope?: string;
  }>> {
    return this.post<{
      token: string;
      expiresAt: Date | null;
      refreshToken?: string;
      refreshTokenExpiresAt?: Date | null;
      scope?: string;
    }>('/api/user/access-token', { refreshToken, expiresIn, refreshExpiresIn }, true, lang);
  }

  async deleteAccessToken(lang?: string): Promise<ApiResponse<void>> {
    return this.delete<void>('/api/user/access-token', true, lang);
  }

  // ============== SSE Connection ==============
  
  createSSEConnection(onMessage: (event: MessageEvent) => void, onError?: (error: Event) => void): EventSource | null {
    const token = this.config.getToken();
    if (!token) {
      console.error('Unable to establish SSE connection: Missing authentication token');
      return null;
    }

    try {
      const eventSource = new EventSource(`${this.config.baseURL}/api/sse?token=${encodeURIComponent(token)}`);
      
      eventSource.onmessage = onMessage;
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        onError?.(error);
      };

      eventSource.onopen = () => {
        console.log('SSE connection established');
      };

      return eventSource;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      onError?.(error as Event);
      return null;
    }
  }
}

// ============== Create Default Client Instance ==============

let defaultApiClient: ApiClient | null = null;

export const createApiClient = (config: ApiClientConfig): ApiClient => {
  // If there's already a default client, return directly (to avoid duplicate initialization)
  if (defaultApiClient) {
    console.log('API client already exists, skipping duplicate initialization');
    return defaultApiClient;
  }
  
  const client = new ApiClient(config);
  defaultApiClient = client;
  console.log('API client initialized, baseURL:', config.baseURL);
  return client;
};

export const getApiClient = (): ApiClient => {
  if (!defaultApiClient) {
    // If in client environment and not yet initialized, initialize automatically
    if (typeof window !== 'undefined') {
      console.log('API client not initialized, auto initializing...');
      const baseURL = process.env.NEXT_PUBLIC_APP_URL ||
                     process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ||
                     window.location.origin ;
      
      return createApiClient({
        baseURL,
        getToken: () => {
          // Get token from auth store
          try {
            return useAuthStore.getState().token;
          } catch (error) {
            console.warn('Error getting token:', error);
            return null;
          }
        },
        onUnauthorized: () => {
          // When a 401 error is received, clear the authentication state
          try {
            const { setUser, setToken } = useAuthStore.getState();
            setUser(null);
            setToken(null);
            console.log('API client: Authentication failed, user state cleared');
          } catch (error) {
            console.warn('Error clearing authentication state:', error);
          }
        },
        onError: (error) => {
          console.error('API client error:', error);
        },
      });
    }
    // Throw an error on the server side or when auto-initialization is not possible
    throw new Error('API client not initialized, please call createApiClient() first');
  }
  return defaultApiClient;
};

// ============== Convenient Methods ==============

export const api = {
  get client() {
    return getApiClient();
  },
  // Authentication
  login: (data: LoginRequest, lang?: string) => getApiClient().login(data, lang),

  register: (data: LoginRequest & { name: string }, lang?: string) => getApiClient().register(data, lang),
  logout: () => getApiClient().logout(),
  getCurrentUser: (lang?: string) => getApiClient().getCurrentUser(lang),
  updateUser: (data: { name?: string }, lang?: string) => getApiClient().updateUser(data, lang),
  // Prompts
  getPrompts: (query?: PromptListQuery, lang?: string) => getApiClient().get<PromptListResponse>(createUrlWithQuery('/api/prompts/list', query), true, lang),

  createPrompt: (data: CreatePromptRequest, lang?: string) => getApiClient().post<Prompt>('/api/prompts/create', data, true, lang),
  updatePrompt: (data: UpdatePromptRequest, lang?: string) => getApiClient().post<Prompt>('/api/prompts/update', data, true, lang),
  deletePrompt: (data: DeletePromptRequest, lang?: string) => getApiClient().post<void>('/api/prompts/delete', data, true, lang),
  getPrompt: (id: string, lang?: string) => getApiClient().get<Prompt>(`/api/prompts/${id}`, true, lang),
  getPromptStats: (query?: PromptStatsQuery, lang?: string) => getApiClient().get<PromptStats>(createUrlWithQuery('/api/prompts/stats', query), true, lang),
  getDashboardStats: (lang?: string) => getApiClient().get<DashboardStats>('/api/dashboard/stats', true, lang),
  getPromptTags: (query?: PromptStatsQuery, lang?: string) => getApiClient().get<TagWithCount[]>(createUrlWithQuery('/api/prompts/tags', query), true, lang),
  incrementPromptUseCount: (promptId: string, lang?: string) => getApiClient().post<{ id: string; useCount: number }>('/api/prompts/use', { promptId }, true, lang),
  // Favorites
  addFavorite: (promptId: string, lang?: string) => getApiClient().addFavorite(promptId, lang),
  removeFavorite: (promptId: string, lang?: string) => getApiClient().removeFavorite(promptId, lang),
  checkFavorite: (promptId: string, lang?: string) => getApiClient().checkFavorite(promptId, lang),
  checkFavorites: (promptIds: string[], lang?: string) => getApiClient().checkFavorites(promptIds, lang),
  importPrompts: (data: any[], spaceId?: string, lang?: string) => getApiClient().importPrompts(data, spaceId, lang),
  exportPrompts: (spaceId?: string, lang?: string) => getApiClient().exportPrompts(spaceId, lang),
  clearPrompts: (spaceId?: string, lang?: string) => getApiClient().clearPrompts(spaceId, lang),
  getAiPointsUsage: (lang?: string) => getApiClient().get<{ totalPoints: number; usedPoints: number; remainingPoints: number; usageRecords: any[] }>('/api/user/ai-points', true, lang),
  purchaseAiPoints: (packageType: AiPointsPackageType, lang?: string) => getApiClient().post<{ userId: string; newBalance: number; purchasedPoints: number }>('/api/user/purchase-ai-points', { packageType }, true, lang),
  manageSubscription: (action: SubscriptionAction, lang?: string) => getApiClient().post<{ userId: string; subscriptionStatus: string }>('/api/user/subscription', { action }, true, lang),
  // Administrator
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
  
  // Billing
  createCheckoutSession: (data: CreateCheckoutSessionRequest, lang?: string) => getApiClient().post<CheckoutSessionResponse>('/api/billing/create-checkout-session', data, true, lang),
  
  // Access Token
  getAccessToken: (lang?: string) => getApiClient().get<{
    token: string;
    refreshToken?: string;
    expiresAt: Date | null;
    refreshTokenExpiresAt?: Date | null;
    scope?: string;
  }>('/api/user/access-token', true, lang),
  refreshAccessToken: (refreshToken?: string, expiresIn?: number, refreshExpiresIn?: number, lang?: string) => getApiClient().post<{
    token: string;
    expiresAt: Date | null;
    refreshToken?: string;
    refreshTokenExpiresAt?: Date | null;
    scope?: string;
  }>('/api/user/access-token', { refreshToken, expiresIn, refreshExpiresIn }, true, lang),
  deleteAccessToken: (lang?: string) => getApiClient().delete<void>('/api/user/access-token', true, lang),
  
  // Utilities
  healthCheck: (lang?: string) => getApiClient().get<{ status: string; timestamp: string }>('/api/health', false, lang),

  createSSEConnection: (onMessage: (event: MessageEvent) => void, onError?: (error: Event) => void) =>
    getApiClient().createSSEConnection(onMessage, onError),
};