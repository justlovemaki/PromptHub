'use client'

import { useState, useEffect } from 'react'
import AdminPanelLayout from '../../../components/layout/AdminPanelLayout'
import { useAuth, api, AdminUserListResponse, PopularPromptsResponse } from '@promptmanager/core-logic'

// API响应类型定义
interface AdminStats {
  totalUsers: number
  totalPrompts: number
  totalSpaces: number
  activeUsers: number
  newUsersThisMonth: number
  subscriptionStats: {
    free: number
    pro: number
    team: number
  }
}

interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
  subscriptionStatus: 'FREE' | 'PRO' | 'TEAM'
  createdAt: number
  updatedAt: number
}

interface PopularPrompt {
  id: string
  title: string
  description: string
  tags: string
  useCount: number
  createdAt: number
}

export default function AdminPage({ params }: { params: { lang: string } }) {
  const [isClient, setIsClient] = useState(false)
  const { user, isLoading, error, isAdmin } = useAuth()

  // API数据状态
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [popularPrompts, setPopularPrompts] = useState<PopularPrompt[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  // 客户端 hydration 检查
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 获取管理后台数据
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoadingData(true)
        setDataError(null)

        // 并行获取所有数据
        const [statsResult, usersResult, promptsResult] = await Promise.all([
          api.getAdminStats(),
          api.getAdminUsers({ limit: 10 }),
          api.getAdminPopularPrompts(10)
        ])

        // 检查API调用是否成功
        if (!statsResult.success) {
          throw new Error('获取统计数据失败')
        }
        if (!usersResult.success) {
          throw new Error('获取用户数据失败')
        }
        if (!promptsResult.success) {
          throw new Error('获取提示词数据失败')
        }

        // 类型断言和数据处理
        const stats = statsResult.data as any
        const users = usersResult.data as any
        const prompts = promptsResult.data as any

        setStats(stats)
        setRecentUsers(users.users || [])
        setPopularPrompts(prompts || [])

      } catch (error) {
        console.error('Admin data fetch error:', error)
        setDataError('数据加载失败，请刷新页面重试')
      } finally {
        setIsLoadingData(false)
      }
    }

    // 只有在客户端且有管理员权限时才获取数据
    if (isClient && isAdmin && !isLoading) {
      fetchAdminData()
    }
  }, [isClient, isAdmin, isLoading])

  // 在服务端渲染期间，直接显示布局和加载状态
  if (!isClient) {
    return (
      <AdminPanelLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </AdminPanelLayout>
    )
  }

  // 客户端渲染后的状态检查
  // 加载状态
  if (isLoading || (isClient && isAdmin && isLoadingData)) {
    return (
      <AdminPanelLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </AdminPanelLayout>
    )
  }

  // 错误状态
  if (error || dataError) {
    return (
      <AdminPanelLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">加载失败</div>
            <p className="text-gray-600">{error || dataError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue/90"
            >
              刷新页面
            </button>
          </div>
        </div>
      </AdminPanelLayout>
    )
  }

  // 权限检查
  if (!isAdmin) {
    return (
      <AdminPanelLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">访问被拒绝</div>
            <p className="text-gray-600">您没有管理员权限，无法访问此页面。</p>
          </div>
        </div>
      </AdminPanelLayout>
    )
  }
  return (
    <AdminPanelLayout lang={params.lang}>
      <div className="space-y-6">
        {/* 管理后台标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
              <p className="text-gray-600 mt-1">
                欢迎，{user?.name || user?.email || '管理员'}！系统管理和统计数据面板
              </p>
            </div>
            <span className="px-3 py-1 text-sm bg-red-500 text-white rounded-full">管理员</span>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.totalUsers.toLocaleString() : '--'}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">活跃用户</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.activeUsers.toLocaleString() : '--'}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">总提示词数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.totalPrompts.toLocaleString() : '--'}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pro 用户</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? stats.subscriptionStats.pro : '--'}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 用户和提示词管理 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">用户管理</h2>
                <button className="text-brand-blue hover:text-brand-blue/80 text-sm font-medium">
                  查看全部
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentUsers.length > 0 ? recentUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-brand-blue rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      user.subscriptionStatus === 'PRO'
                        ? 'bg-green-100 text-green-800'
                        : user.subscriptionStatus === 'TEAM'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscriptionStatus === 'PRO' ? 'Pro' :
                       user.subscriptionStatus === 'TEAM' ? 'Team' : 'Free'}
                    </span>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">暂无用户数据</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">热门提示词</h2>
                <button className="text-brand-blue hover:text-brand-blue/80 text-sm font-medium">
                  查看全部
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {popularPrompts.length > 0 ? popularPrompts.map((prompt, index) => (
                  <div key={prompt.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {prompt.title || '未命名提示词'}
                      </p>
                      <p className="text-xs text-gray-500">
                        使用次数：{prompt.useCount}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {index === 0 ? '热门' : '推荐'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">暂无提示词数据</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPanelLayout>
  )
}