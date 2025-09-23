'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageWrapper from '../../../components/admin/AdminPageWrapper'
import { useAuth, api, AdminUserListResponse, PopularPromptsResponse } from '@promptmanager/core-logic'
import { useTranslation } from '@/i18n/client'

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
  const router = useRouter()
  const { t: tAdmin } = useTranslation(params.lang, 'admin')
  const { t: tCommon } = useTranslation(params.lang, 'common')
  const { t: tUser } = useTranslation(params.lang, 'user')
  const { user, isLoading, isAdmin, setLanguage } = useAuth()

  // API数据状态
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [popularPrompts, setPopularPrompts] = useState<PopularPrompt[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  // 设置语言属性
  useEffect(() => {
    setLanguage(params.lang);
  }, [params.lang, setLanguage]);

  // 导航处理函数
  const handleViewAllUsers = () => {
    router.push(`/${params.lang}/admin/users`)
  }

  const handleViewAllPrompts = () => {
    router.push(`/${params.lang}/admin/prompts`)
  }

  // 获取管理后台数据
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoadingData(true)
        setDataError(null)

        // 并行获取所有数据
        const [statsResult, usersResult, promptsResult] = await Promise.all([
          api.getAdminStats(params.lang),
          api.getAdminUsers({ limit: 10 }, params.lang),
          api.getAdminPopularPrompts(10, params.lang)
        ])

        // 检查API调用是否成功
        if (!statsResult.success) {
          throw new Error(tAdmin('errors.fetchStatsFailed') || '获取统计数据失败')
        }
        if (!usersResult.success) {
          throw new Error(tAdmin('errors.fetchUsersFailed') || '获取用户数据失败')
        }
        if (!promptsResult.success) {
          throw new Error(tAdmin('errors.fetchPromptsFailed') || '获取提示词数据失败')
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
        setDataError(tAdmin('errors.dataLoadFailed'))
      } finally {
        setIsLoadingData(false)
      }
    }

    // 只有在有管理员权限且不是初始加载状态时才获取数据
    if (!isLoading) {
      fetchAdminData()
    }
  }, [isLoading])

  return (
    <AdminPageWrapper lang={params.lang} error={dataError}>
      <div className="space-y-6">
        {/* 管理后台标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tAdmin('dashboard.title')}</h1>
              <p className="text-gray-600 mt-1">
                {tAdmin('dashboard.welcome', { name: user?.name || user?.email || tAdmin('common.adminRole') })}！{tAdmin('dashboard.description')}
              </p>
            </div>
            <span className="px-3 py-1 text-sm bg-red-500 text-white rounded-full">{tAdmin('common.adminRole')}</span>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{tAdmin('stats.totalUsers')}</p>
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
                <p className="text-sm font-medium text-gray-600">{tAdmin('stats.activeUsers')}</p>
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
                <p className="text-sm font-medium text-gray-600">{tAdmin('stats.totalPrompts')}</p>
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
                <p className="text-sm font-medium text-gray-600">{tAdmin('stats.proUsers')}</p>
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
                <h2 className="text-lg font-semibold text-gray-900">{tAdmin('sections.userManagement')}</h2>
                <button
                  onClick={handleViewAllUsers}
                  className="text-brand-blue hover:text-brand-blue/80 text-sm font-medium cursor-pointer"
                >
                  {tAdmin('common.viewAll')}
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
                      {user.subscriptionStatus === 'PRO' ? tAdmin('users.subscriptionPro') :
                       user.subscriptionStatus === 'TEAM' ? tAdmin('users.subscriptionTeam') : tAdmin('users.subscriptionFree')}
                    </span>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">{tAdmin('userManagement.noUsers')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">{tAdmin('sections.popularPrompts')}</h2>
                <button
                  onClick={handleViewAllPrompts}
                  className="text-brand-blue hover:text-brand-blue/80 text-sm font-medium cursor-pointer"
                >
                  {tAdmin('common.viewAll')}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {popularPrompts.length > 0 ? popularPrompts.map((prompt, index) => (
                  <div key={prompt.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {prompt.title || tAdmin('promptManagement.unnamedPrompt')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tAdmin('promptManagement.useCountPrefix')}{prompt.useCount}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {index === 0 ? tAdmin('promptManagement.popularTag') : tAdmin('promptManagement.recommendedTag')}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">{tAdmin('promptManagement.noPrompts')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}