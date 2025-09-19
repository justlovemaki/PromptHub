'use client'

import AdminLayout from '../../../components/layout/AdminLayout'

export default function AccountPage({ params }: { params: { lang: string } }) {
  return (
    <AdminLayout lang={params.lang}>
      <div className="space-y-8">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900">账户设置</h1>
          <p className="text-gray-600 mt-1">管理您的个人信息、订阅和使用情况</p>
        </div>

        {/* 订阅状态 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">订阅状态</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">Pro 专业版</span>
                <span className="px-2 py-1 text-xs bg-brand-blue text-white rounded-full">已激活</span>
              </div>
              <p className="text-gray-600 mt-1">享受所有高级功能，无限制使用</p>
              <p className="text-sm text-gray-500 mt-2">续费时间：2024-12-15</p>
            </div>
            <button className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              管理订阅
            </button>
          </div>
        </div>

        {/* AI 点数 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI 点数</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-blue">2,840</div>
                  <p className="text-sm text-gray-600">剩余点数</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400">750</div>
                  <p className="text-sm text-gray-600">本月已使用</p>
                </div>
              </div>
              <p className="text-gray-600 mt-2">点数用于 AI 提示词生成和优化</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              购买点数
            </button>
          </div>
        </div>

        {/* 个人信息 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">个人信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input 
                type="email" 
                value="user@example.com" 
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input 
                type="text" 
                defaultValue="示例用户"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
              />
            </div>
            <div className="flex justify-end">
              <button className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                保存更改
              </button>
            </div>
          </div>
        </div>

        {/* 使用统计 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">使用统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-blue">32</div>
              <p className="text-sm text-gray-600">提示词总数</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-blue">156</div>
              <p className="text-sm text-gray-600">本月使用次数</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-blue">750</div>
              <p className="text-sm text-gray-600">本月消耗点数</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}