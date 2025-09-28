'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@promptmanager/core-logic'
import { signIn, signOut, useSession } from '../../lib/auth-client'
import AdminLayout from '../layout/AdminLayout'

interface UserPageWrapperProps {
  lang: string
  error?: string | null
  children: React.ReactNode
  title?: string
  description?: string
}

/**
 * 普通用户页面通用包装组件
 * 提供统一的错误处理和用户session检查
 */

export default function UserPageWrapper({
  lang,
  error,
  children,
  title,
  description
}: UserPageWrapperProps) {
  const { isAuthenticated, isLoading, user, setLanguage } = useAuth()
  const { data: session, isPending } = useSession()
  const [isInitialized, setIsInitialized] = useState(false)

  // 获取session信息
  useEffect(() => {
    setIsInitialized(true)
    // console.log('UserPageWrapper: Session状态', {
    //   hasSession: !!session,
    //   sessionUser: session?.user?.id,
    //   sessionStatus: session?.user ? '已登录' : '未登录'
    // })
  }, [session])

  // 设置语言属性
  useEffect(() => {
    setLanguage(lang)
  }, [lang, setLanguage])

  // 监听用户状态变化
  useEffect(() => {
    if (user && isInitialized) {
      console.log('UserPageWrapper: 用户已登录', user.id)
      // 这里可以添加用户登录时的副作用逻辑
      // 比如：更新页面标题、触发数据刷新、发送分析事件等
    } else if (isInitialized && !isAuthenticated && !isLoading) {
      console.log('UserPageWrapper: 用户未登录或已登出')
      // 这里可以添加用户登出时的副作用逻辑
      // 比如：清理缓存、停止定时器、清除敏感数据等
    }
  }, [user, isAuthenticated, isLoading, isInitialized])

  // 正在加载中
  if ((isLoading || isPending)) {
    return (
      <div className="min-h-screen bg-bg-200 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-brand-blue/100 rounded-full flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">系统加载中</h2>
          <p className="text-gray-600">请稍候，正在为您准备内容...</p>
        </div>
      </div>
    )
  }

  // 错误状态
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

  // 检查最终的认证状态 (优先使用useAuth，fallback到session)
  const finalIsAuthenticated = isAuthenticated || !!session?.user

  // 用户未登录
  if (!finalIsAuthenticated) {
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
            <h2 className="text-xl font-semibold text-text-100 mb-2">用户未登录</h2>
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
    <AdminLayout lang={lang}>
      {children}
    </AdminLayout>
  )
}