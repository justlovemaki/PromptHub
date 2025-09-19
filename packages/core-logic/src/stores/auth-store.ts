import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginRequest, ApiResponse, LoginResponse } from '../types';
import { api } from '../api-client';

// Token 过期时间设置（毫秒）
const DEFAULT_TOKEN_EXPIRE_TIME = 60 * 1000; // 1 分钟

// ============== 认证状态接口 ==============

export interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  userDataExpireTime: number | null; // Token 过期时间戳
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 认证操作
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: LoginRequest & { name: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;

  // 权限检查
  isAdmin: () => boolean;
  isPro: () => boolean;
  hasValidSubscription: () => boolean;
  isTokenExpired: () => boolean;

  // 内部方法
  setUser: (user: User | null) => void;
  setToken: (token: string | null, userDataExpireTime?: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkTokenExpiration: () => void;
}

// ============== 创建认证Store ==============

export const useAuthStore = create<AuthState>()(  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      userDataExpireTime: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ============== 认证操作 ==============

      login: async (data: LoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.login(data);

          if (response.success) {
            const { user, token } = response.data;
            // 设置默认过期时间为24小时
            const userDataExpireTime = Date.now() + DEFAULT_TOKEN_EXPIRE_TIME;
            set({
              user,
              token,
              userDataExpireTime,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              error: (response as any).error?.message || '登录失败',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '登录失败';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      register: async (data: LoginRequest & { name: string }): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.register(data);

          if (response.success) {
            const { user, token } = response.data;
            // 设置默认过期时间为24小时
            const userDataExpireTime = Date.now() + DEFAULT_TOKEN_EXPIRE_TIME;
            set({
              user,
              token,
              userDataExpireTime,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              error: (response as any).error?.message || '注册失败',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '注册失败';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        set({ isLoading: true });

        try {
          // 尝试调用后端登出API（可选）
          await api.logout().catch(() => {
            // 忽略登出API错误，继续清理本地状态
          });
        } finally {
          set({
            user: null,
            token: null,
            userDataExpireTime: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshUser: async (): Promise<void> => {
        const { token, isAuthenticated, isTokenExpired } = get();
        
        // 检查token是否过期
        if (isTokenExpired()) {
          console.log('refreshUser: Token已过期，清理认证状态')
          set({
            user: null,
            token: null,
            userDataExpireTime: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Token已过期，请重新登录',
          });
          return;
        }
        
        // 如果既没有token也没有认证状态，则不进行请求
        if (!token && !isAuthenticated) {
          console.log('refreshUser: 无token和认证状态，跳过请求')
          return;
        }

        console.log('refreshUser: 开始获取用户信息', { hasToken: !!token, isAuthenticated })
        set({ isLoading: true, error: null });

        try {
          const response = await api.getCurrentUser();
          console.log('refreshUser: API响应', response)

          if (response.success) {
            console.log('refreshUser: 成功获取用户信息', response.data)
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            console.log('refreshUser: API返回错误', response)
            // Token可能已过期，清理认证状态
            set({
              user: null,
              token: null,
              userDataExpireTime: null,
              isAuthenticated: false,
              isLoading: false,
              error: (response as any).error?.message || '获取用户信息失败',
            });
          }
        } catch (error) {
          console.error('refreshUser: 请求异常', error)
          const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
          set({
            user: null,
            token: null,
            userDataExpireTime: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
        }
      },

      clearError: (): void => {
        set({ error: null });
      },

      // ============== 权限检查 ==============

      isAdmin: (): boolean => {
        const { user } = get();
        return user?.role === 'ADMIN';
      },

      isPro: (): boolean => {
        const { user } = get();
        return user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'TEAM';
      },

      hasValidSubscription: (): boolean => {
        const { user } = get();
        if (!user) return false;

        if (user.subscriptionStatus === 'FREE') return false;
        
        // 检查订阅是否过期
        if (user.subscriptionEndDate) {
          const now = new Date();
          const endDate = new Date(user.subscriptionEndDate);
          return endDate > now;
        }

        // 如果没有结束日期，认为是永久订阅
        return true;
      },

      isTokenExpired: (): boolean => {
        const { userDataExpireTime } = get();
        if (!userDataExpireTime) return true;
        return Date.now() > userDataExpireTime;
      },

      // ============== 内部方法 ==============

      setUser: (user: User | null): void => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null, userDataExpireTime?: number | null): void => {
        set({ 
          token, 
          userDataExpireTime: userDataExpireTime || (token ? Date.now() + DEFAULT_TOKEN_EXPIRE_TIME : null),
          isAuthenticated: !!token 
        });
      },

      checkTokenExpiration: (): void => {
        const { isTokenExpired } = get();
        if (isTokenExpired()) {
          console.log('checkTokenExpiration: Token已过期，清理认证状态');
          set({
            user: null,
            token: null,
            userDataExpireTime: null,
            isAuthenticated: false,
            error: 'Token已过期，请重新登录',
          });
        }
      },

      setLoading: (isLoading: boolean): void => {
        set({ isLoading });
      },

      setError: (error: string | null): void => {
        set({ error });
      },
    }),
    {
      name: 'auth-storage', // 持久化存储的键名
      storage: createJSONStorage(() => {
        // 确保只在客户端使用 localStorage
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // 服务端返回一个空的存储实现
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      partialize: (state) => ({
        // 只持久化必要的状态
        user: state.user,
        token: state.token,
        userDataExpireTime: state.userDataExpireTime,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // 重新加载后，检查token是否过期
        if (state?.userDataExpireTime && Date.now() > state.userDataExpireTime) {
          console.log('onRehydrateStorage: Token已过期，清理状态');
          // 清理过期的认证状态
          // ({
          //   user: null,
          //   token: null,
          //   userDataExpireTime: null,
          //   isAuthenticated: false,
          //   error: 'Token已过期，请重新登录',
          // });
        }
        
        // 重新加载后，如果有token但没有用户信息，尝试刷新用户信息
        if (state?.token && !state?.user) {
          // 延迟执行，确保组件已挂载
          setTimeout(() => {
            state.refreshUser?.()
          }, 100)
        }
      },
      // 跳过在服务端的 hydration
      skipHydration: typeof window === 'undefined',
    }
  )
);

// ============== 便捷 Hooks ==============

export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // 状态
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    userDataExpireTime: store.userDataExpireTime,
    
    // 权限
    isAdmin: store.isAdmin(),
    isPro: store.isPro(),
    hasValidSubscription: store.hasValidSubscription(),
    isTokenExpired: store.isTokenExpired(),
    
    // 操作
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshUser: store.refreshUser,
    clearError: store.clearError,
    checkTokenExpiration: store.checkTokenExpiration,
  };
};

export const useAuthActions = () => {
  const store = useAuthStore();
  
  return {
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshUser: store.refreshUser,
    clearError: store.clearError,
  };
};

export const useAuthStatus = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    userDataExpireTime: store.userDataExpireTime,
    isAdmin: store.isAdmin(),
    isPro: store.isPro(),
    hasValidSubscription: store.hasValidSubscription(),
    isTokenExpired: store.isTokenExpired(),
  };
};