import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginRequest, ApiResponse, LoginResponse, AiPointsPackageType, SubscriptionAction, SubscriptionStatus } from '../types';
import { api } from '../api-client';
import { SUBSCRIPTION_STATUS, USER_ROLES } from '../types';

// Token expiration time setting (in milliseconds)
const DEFAULT_TOKEN_EXPIRE_TIME = 10 * 60 * 1000; // 10 minutes

// ============== Authentication State Interface ==============

export interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  userDataExpireTime: number | null; // Token expiration timestamp
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  language: string | null;

  // 认证操作
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: LoginRequest & { name: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: { name?: string }) => Promise<boolean>;
  purchaseAiPoints: (packageType: AiPointsPackageType) => Promise<boolean>;
  manageSubscription: (action: SubscriptionAction) => Promise<boolean>;
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
  setLanguage: (language: string | null) => void;
}

// ============== Create Authentication Store ==============

export const useAuthStore = create<AuthState>()(  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      userDataExpireTime: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      language: null,

      // ============== Authentication Operations ==============

      login: async (data: LoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const { language } = get();
          const response = await api.login(data, language || undefined);

          if (response.success) {
            const { user, token } = response.data;
            // Set default expiration time to 24 hours
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
              error: (response as any).error?.message || 'Login Failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login Failed';
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
          const { language } = get();
          const response = await api.register(data, language || undefined);

          if (response.success) {
            const { user, token } = response.data;
            // Set default expiration time to 24 hours
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
              error: (response as any).error?.message || 'auth.registerFailed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'auth.registerFailed';
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
          // Try to call the backend logout API (optional)
          // await api.logout().catch(() => {
          // });
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
        const { token, isAuthenticated, isTokenExpired, language } = get();
        
        // Check if token is expired
        if (isTokenExpired()) {
          console.log('refreshUser: Token has expired, clearing authentication state')
          set({
            user: null,
            token: null,
            userDataExpireTime: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'auth.tokenExpired',
          });
          return;
        }
        
        // If there's no token and no authentication status, don't make the request
        if (!token && !isAuthenticated) {
          console.log('refreshUser: No token and authentication state, skipping request')
          return;
        }

        // console.log('refreshUser: Starting to fetch user information', { hasToken: !!token, isAuthenticated })
        // set({ isLoading: true, error: null });

        try {
          const response = await api.getCurrentUser(language || undefined);
          // console.log('refreshUser: API response', response)

          if (response.success) {
            console.log('refreshUser: Successfully retrieved user information', response.data)
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            console.log('refreshUser: API returned error', response)
            // Token may have expired, clearing authentication state
            set({
              user: null,
              token: null,
              userDataExpireTime: null,
              isAuthenticated: false,
              isLoading: false,
              error: (response as any).error?.message || 'auth.getUserInfoFailed',
            });
          }
        } catch (error) {
          console.error('refreshUser: Request exception', error)
          const errorMessage = error instanceof Error ? error.message : 'auth.getUserInfoFailed';
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

      updateUser: async (data: { name?: string }): Promise<boolean> => {
        // set({ isLoading: true, error: null });

        try {
          const { language } = get();
          const response = await api.updateUser(data, language || undefined);

          if (response.success) {
            set({
              user: response.data,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              error: (response as any).error?.message || 'auth.updateUserFailed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'auth.updateUserFailed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      purchaseAiPoints: async (packageType: AiPointsPackageType): Promise<boolean> => {
        // set({ isLoading: true, error: null });

        try {
          const { language } = get();
          const response = await api.purchaseAiPoints(packageType, language || undefined);

          if (response.success) {
            // Update user information to reflect the new AI points balance
            set({
              user: {
                ...get().user,
                subscriptionAiPoints: response.data.newBalance,
              },
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              error: (response as any).error?.message || 'auth.purchaseAiPointsFailed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'auth.purchaseAiPointsFailed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      manageSubscription: async (action: SubscriptionAction): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const { language } = get();
          const response = await api.manageSubscription(action, language || undefined);

          if (response.success) {
            // 更新用户信息以反映新的订阅状态
            set({
              user: {
                ...get().user,
                subscriptionStatus: response.data.subscriptionStatus as SubscriptionStatus, // Keep this type assertion because API returns string type
              },
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              error: (response as any).error?.message || 'auth.manageSubscriptionFailed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'auth.manageSubscriptionFailed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },

      clearError: (): void => {
        set({ error: null });
      },

      // ============== Permission Checks ==============

      isAdmin: (): boolean => {
        const { user } = get();
        return user?.role === USER_ROLES.ADMIN;
      },

      isPro: (): boolean => {
        const { user } = get();
        return user?.subscriptionStatus === SUBSCRIPTION_STATUS.PRO || user?.subscriptionStatus === SUBSCRIPTION_STATUS.TEAM;
      },

      hasValidSubscription: (): boolean => {
        const { user } = get();
        if (!user) return false;

        if (user.subscriptionStatus === SUBSCRIPTION_STATUS.FREE) return false;
        
        // Check if subscription is expired
        if (user.subscriptionEndDate) {
          const now = new Date();
          const endDate = new Date(user.subscriptionEndDate);
          return endDate > now;
        }

        // If there's no end date, consider it a permanent subscription
        return true;
      },

      isTokenExpired: (): boolean => {
        const { userDataExpireTime } = get();
        if (!userDataExpireTime) return true;
        return Date.now() > userDataExpireTime;
      },

      // ============== Internal Methods ==============

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
          console.log('checkTokenExpiration: Token has expired, clearing authentication state');
          set({
            user: null,
            token: null,
            userDataExpireTime: null,
            isAuthenticated: false,
            error: 'auth.tokenExpired',
          });
        }
      },

      setLoading: (isLoading: boolean): void => {
        set({ isLoading });
      },

      setError: (error: string | null): void => {
        set({ error });
      },
      
      setLanguage: (language: string | null): void => {
        set({ language });
      },
    }),
    {
      name: 'auth-storage', // Key name for persistent storage
      storage: createJSONStorage(() => {
        // Ensure localStorage is used only on the client side
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Server returns an empty storage implementation
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      partialize: (state) => ({
        // Persist only necessary state
        user: state.user,
        token: state.token,
        userDataExpireTime: state.userDataExpireTime,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
      }),
      onRehydrateStorage: () => (state) => {
        // 重新加载后，检查token是否过期
        if (state?.userDataExpireTime && Date.now() > state.userDataExpireTime) {
          console.log('onRehydrateStorage: Token has expired, clearing state');
        }
        
        // After rehydration, if there's a token but no user info, try to refresh user info
        if (state?.token && !state?.user) {
          console.log('onRehydrateStorage: Attempting to refresh user information');
          // Delay execution to ensure components are mounted
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

// ============== Convenient Hooks ==============

export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // 状态
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    userDataExpireTime: store.userDataExpireTime,
    language: store.language,
    
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
    updateUser: store.updateUser,
    purchaseAiPoints: store.purchaseAiPoints,
    manageSubscription: store.manageSubscription,
    clearError: store.clearError,
    checkTokenExpiration: store.checkTokenExpiration,
    setLanguage: store.setLanguage,
  };
};

export const useAuthActions = () => {
  const store = useAuthStore();
  
  return {
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshUser: store.refreshUser,
    updateUser: store.updateUser,
    purchaseAiPoints: store.purchaseAiPoints,
    manageSubscription: store.manageSubscription,
    clearError: store.clearError,
    setLanguage: store.setLanguage,
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
    language: store.language,
    isAdmin: store.isAdmin(),
    isPro: store.isPro(),
    hasValidSubscription: store.hasValidSubscription(),
    isTokenExpired: store.isTokenExpired(),
  };
};