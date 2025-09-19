'use client'

import AdminLayout from '../../../components/layout/AdminLayout'
import { useAuth } from '@promptmanager/core-logic'

export default function DashboardPage({ params }: { params: { lang: string } }) {
  const { user, isLoading, error } = useAuth()

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
    <AdminLayout lang={params.lang}>
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
                <p className="text-2xl font-bold text-gray-900">32</p>
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
                <p className="text-sm font-medium text-gray-600">本月使用</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">剩余点数</p>
                <p className="text-2xl font-bold text-gray-900">2,840</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-2xl font-bold text-gray-900">96%</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                <h2 className="text-lg font-semibold text-gray-900">我的提示词</h2>
                <p className="text-gray-600 text-sm mt-1">管理和使用您的 AI 提示词模板</p>
              </div>
              <button className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                创建新提示词
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 示例提示词卡片 */}
              <div className="bg-gray-50 rounded-lg border hover:shadow-md transition-shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">产品介绍文案</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">公开</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">生成产品营销文案</p>
                
                <div className="text-xs text-gray-500 mb-4">
                  <div>创建时间：2024-01-15</div>
                  <div>使用次数：25</div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                    使用
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    编辑
                  </button>
                </div>
              </div>

              {/* 第二个示例 */}
              <div className="bg-gray-50 rounded-lg border hover:shadow-md transition-shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">代码审查助手</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">私有</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">帮助进行代码审查</p>
                
                <div className="text-xs text-gray-500 mb-4">
                  <div>创建时间：2024-01-14</div>
                  <div>使用次数：18</div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                    使用
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    编辑
                  </button>
                </div>
              </div>

              {/* 第三个示例 */}
              <div className="bg-gray-50 rounded-lg border hover:shadow-md transition-shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">邮件回复助手</h3>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">新增</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">智能生成邮件回复</p>
                
                <div className="text-xs text-gray-500 mb-4">
                  <div>创建时间：2024-01-18</div>
                  <div>使用次数：5</div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white px-3 py-2 rounded text-sm font-medium transition-colors">
                    使用
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    编辑
                  </button>
                </div>
              </div>
            </div>

            {/* 查看更多 */}
            <div className="mt-6 text-center">
              <button className="text-brand-blue hover:text-brand-blue/80 font-medium">
                查看所有提示词 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}