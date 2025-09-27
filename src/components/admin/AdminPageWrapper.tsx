'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@promptmanager/core-logic'
import AdminPanelLayout from '../layout/AdminPanelLayout'

interface AdminPageWrapperProps {
  lang: string
  error?: string | null
  children: React.ReactNode
  title?: string
  description?: string
}

/**
 * Admin页面通用包装组件
 * 提供统一的服务端渲染加载状态和权限检查
 */
export default function AdminPageWrapper({
  lang,
  error,
  children,
  title,
  description
}: AdminPageWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const { user, isLoading, isAdmin, setLanguage } = useAuth()

  // 客户端 hydration 检查
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 设置语言属性
  useEffect(() => {
    setLanguage(lang)
  }, [lang, setLanguage])

  // 在服务端渲染期间显示加载状态
  if (!isClient) {
    return (
      <div className="min-h-screen bg-bg-200 flex items-center justify-center">
      </div>
    )
  }

  // 错误状态处理 - 在任何检查之前处理错误
  if (error) {
    return (
      <div className="min-h-screen bg-bg-200 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-bg-300 p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-error-300 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-100 mb-2">加载失败</h2>
            <p className="text-text-200 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-100 hover:bg-primary-100/90 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 权限检查
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-200 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-bg-300 p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-error-300 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2.5l3 3-3 3V15l3-3-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-100 mb-2">访问被拒绝</h2>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-bg-500 hover:bg-bg-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminPanelLayout lang={lang}>
      {children}
    </AdminPanelLayout>
  )
}