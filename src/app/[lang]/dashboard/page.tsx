'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/layout/AdminLayout'
import { useAuth } from '@promptmanager/core-logic'
import { api } from '@promptmanager/core-logic'
import { PromptUseButton } from '../../../components/PromptUseButton'
import { ToastProvider } from '../../../components/ToastProvider'
import type { Prompt, PromptListQuery, PromptListResponse, DashboardStats } from '@promptmanager/core-logic'

// 添加样式
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`

export default function DashboardPage({ params }: { params: { lang: string } }) {
  const { user, isLoading, error } = useAuth()
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([])
  const [promptsError, setPromptsError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false) // 防重复初始化标志
  const [lastFetchTime, setLastFetchTime] = useState<number>(0) // 上次请求时间
  
  // 新增仪表盘统计状态
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // 获取仪表盘统计数据
  const fetchDashboardStats = async (force = false) => {
    if (!user?.personalSpaceId) return
    
    // 防重复调用：2秒内不允许重复请求（除非强制刷新）
    const now = Date.now()
    if (!force && now - lastFetchTime < 2000) {
      console.log('请求频率过高，跳过重复调用')
      return
    }
    
    try {
      setStatsError(null)
      setStatsLoading(true)
      setLastFetchTime(now)
      
      const response = await api.getDashboardStats()
      
      if (response.success) {
        const data = response.data as DashboardStats
        setDashboardStats(data)
        // 同时更新最近提示词列表
        setRecentPrompts(data.recentPrompts || [])
      } else {
        setStatsError((response as any).error?.message || '获取统计数据失败')
      }
    } catch (error) {
      console.error('获取仪表盘统计错误:', error)
      setStatsError('网络错误，请稍后重试')
    } finally {
      setStatsLoading(false)
    }
  }
  // 手动刷新（强制请求）
  const handleRefresh = () => {
    console.log('手动刷新仪表盘数据')
    fetchDashboardStats(true)
  }

  // 当用户信息加载完成后获取统计数据（只执行一次）
  useEffect(() => {
    if (user?.personalSpaceId && !isLoading && !hasInitialized) {
      console.log('初始化仪表盘数据')
      setHasInitialized(true)
      fetchDashboardStats()
    }
  }, [user?.personalSpaceId, isLoading, hasInitialized])

  // 格式化日期
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 获取可见性标签样式和文本
  const getVisibilityBadge = (isPublic: boolean) => {
    if (isPublic) {
      return {
        className: 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded',
        text: '公开'
      }
    } else {
      return {
        className: 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded',
        text: '私有'
      }
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <AdminLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // 错误状态
  if (error) {
    return (
      <AdminLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">加载失败</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }
  return (
    <ToastProvider>
      <AdminLayout lang={params.lang}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="space-y-6">
        {/* 欢迎信息 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI 提示词管理平台</h1>
              <p className="text-gray-600 mt-1">
                欢迎回来，{user?.name || user?.email || '用户'}！管理和使用您的 AI 提示词模板
              </p>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full ${
              user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'TEAM'
                ? 'bg-brand-blue text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user?.subscriptionStatus === 'PRO' && 'Pro 版'}
              {user?.subscriptionStatus === 'TEAM' && 'Team 版'}
              {user?.subscriptionStatus === 'FREE' && 'Free 版'}
              {!user?.subscriptionStatus && '未知'}
            </span>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">我的提示词</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : (dashboardStats?.totalPrompts ?? 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">本月创建</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : (dashboardStats?.monthlyCreated ?? 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">剩余点数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : (dashboardStats?.remainingCredits?.toLocaleString() ?? '0')}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">标签数量</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : (dashboardStats?.tagsCount ?? 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 提示词列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">最近更新的提示词</h2>
                <p className="text-gray-600 text-sm mt-1">查看您最近更新的5个提示词</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={handleRefresh}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>刷新</span>
                </button>
                <button 
                  onClick={() => window.location.href = `/${params.lang}/dashboard/prompts`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  管理所有提示词
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 统计数据错误状态 */}
            {statsError && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">加载失败</div>
                <p className="text-gray-600 text-sm mb-4">{statsError}</p>
                <button 
                  onClick={handleRefresh}
                  className="text-brand-blue hover:text-brand-blue/80 font-medium text-sm"
                >
                  重试
                </button>
              </div>
            )}

            {/* 提示词错误状态 */}
            {promptsError && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">加载失败</div>
                <p className="text-gray-600 text-sm mb-4">{promptsError}</p>
                <button 
                  onClick={handleRefresh}
                  className="text-brand-blue hover:text-brand-blue/80 font-medium text-sm"
                >
                  重试
                </button>
              </div>
            )}

            {/* 提示词卡片 */}
            {!statsError && !promptsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {recentPrompts.length > 0 ? (
                  recentPrompts.map((prompt) => {
                    const visibilityBadge = getVisibilityBadge(prompt.isPublic)
                    return (
                      <div key={prompt.id} className="bg-gray-50 rounded-lg border hover:shadow-md transition-shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate" title={prompt.title}>
                            {prompt.title}
                          </h3>
                          <span className={visibilityBadge.className}>{visibilityBadge.text}</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2" title={prompt.description || '暂无描述'}>
                          {prompt.description || '暂无描述'}
                        </p>
                        
                        {/* 标签显示 */}
                        {prompt.tags && prompt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {prompt.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {prompt.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{prompt.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mb-4">
                          <div>更新时间：{prompt.updatedAt ? formatDate(prompt.updatedAt) : '未知'}</div>
                          <div>使用次数：{prompt.useCount ?? 0}</div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <PromptUseButton
                            prompt={prompt}
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onRefreshPrompts={() => fetchDashboardStats(true)}
                          >
                            使用
                          </PromptUseButton>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // 空状态
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">您还没有创建任何提示词</p>
                    <button 
                      onClick={() => window.location.href = `/${params.lang}/dashboard/prompts`}
                      className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      创建第一个提示词
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
    </ToastProvider>
  )
}