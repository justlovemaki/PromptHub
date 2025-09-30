'use client'

import { useEffect } from 'react'
import { createApiClient, useAuthStore } from '@promptmanager/core-logic'
import { FALLBACK_DEFAULT_CONFIG } from "@/lib/constants";

export function ApiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Get base URL
    const baseURL = process.env.NEXT_PUBLIC_APP_URL ||
                   process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ||
                   (typeof window !== 'undefined' ? window.location.origin : FALLBACK_DEFAULT_CONFIG.APP_BASE_URL)
    
    // Initialize API client
    createApiClient({
      baseURL,
      getToken: () => {
        // Get token from auth store
        return useAuthStore.getState().token
      },
      onUnauthorized: () => {
        // When receiving 401 error, clear authentication state
        const { setUser, setToken } = useAuthStore.getState()
        setUser(null)
        setToken(null)
        console.log('API Client: Authentication failed, user state cleared')
      },
      onError: (error) => {
        console.error('API Client Error:', error)
      },
    })
  }, [])

  return <>{children}</>
}