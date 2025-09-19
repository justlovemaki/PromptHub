'use client'

import { useEffect } from 'react'
import { createApiClient, useAuthStore } from '@promptmanager/core-logic'

export function ApiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 获取baseURL
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.BETTER_AUTH_URL?.replace(/\/$/, '') || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    
    // 初始化API客户端
    createApiClient({
      baseURL,
      getToken: () => {
        // 从auth store获取token
        return useAuthStore.getState().token
      },
      onUnauthorized: () => {
        // 当收到401错误时，清理认证状态
        const { setUser, setToken } = useAuthStore.getState()
        setUser(null)
        setToken(null)
        console.log('API客户端: 认证失败，已清理用户状态')
      },
      onError: (error) => {
        console.error('API客户端错误:', error)
      },
    })
  }, [])

  return <>{children}</>
}