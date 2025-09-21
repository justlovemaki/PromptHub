'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@promptmanager/core-logic'
import { api } from '@promptmanager/core-logic'
import AdminLayout from '../../../components/layout/AdminLayout'

export default function AccountPage({ params }: { params: { lang: string } }) {
  const { user, updateUser, purchaseAiPoints } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [aiPointsData, setAiPointsData] = useState<{
    totalPoints: number;
    usedPoints: number;
    remainingPoints: number;
  } | null>({ totalPoints: 0, usedPoints: 0, remainingPoints: 0 });
  
  // 获取AI点数信息
  useEffect(() => {
    // 如果用户信息未加载，不执行任何操作
    if (!user) return;
    
    if(user.subscriptionAiPoints == aiPointsData.totalPoints) return

    const fetchAiPointsData = async () => {
      try {
        const response = await api.getAiPointsUsage();
        if (response.success) {
          setAiPointsData({
            totalPoints: response.data.totalPoints,
            usedPoints: response.data.usedPoints,
            remainingPoints: response.data.remainingPoints
          });
        }
      } catch (error) {
        console.error('获取AI点数数据失败:', error);
      }
    };
    
    fetchAiPointsData();
  }, [user]);
  
  // 保存用户信息
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateUser({ name });
      if (success) {
        setShowSuccessMessage(true);
        // 3秒后隐藏成功消息
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // 购买AI点数
  const handlePurchaseAiPoints = async (packageType: 'small' | 'medium' | 'large') => {
    setIsPurchasing(true);
    try {
      await purchaseAiPoints(packageType);
    } finally {
      setIsPurchasing(false);
    }
  };
  
  // 如果用户信息未加载，显示加载状态
  if (!user) {
    return (
      <AdminLayout lang={params.lang}>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </AdminLayout>
    );
  }
  
  // 显示的点数数据
  const displayAiPoints = aiPointsData || {
    totalPoints: user.subscriptionAiPoints || 0,
    usedPoints: 0,
    remainingPoints: 0
  };
  
  return (
    <AdminLayout lang={params.lang}>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* 成功消息提示 */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800">用户信息更新成功！</span>
            </div>
          </div>
        )}

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
                <span className="text-2xl font-bold text-gray-900">
                  {user.subscriptionStatus === 'PRO' ? 'Pro 专业版' :
                   user.subscriptionStatus === 'TEAM' ? 'Team 团队版' : 'Free 免费版'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.subscriptionStatus === 'FREE' ? 'bg-gray-200 text-gray-800' : 'bg-brand-blue text-white'
                }`}>
                  {user.subscriptionStatus === 'FREE' ? '未激活' : '已激活'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                {user.subscriptionStatus === 'FREE' ? '基础功能，有限制使用' : '享受所有高级功能，无限制使用'}
              </p>
              {user.subscriptionEndDate && (
                <p className="text-sm text-gray-500 mt-2">
                  续费时间：{new Date(user.subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                // 在新页面中打开定价页面
                window.open(`/${params.lang}/pricing`, '_blank');
              }}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              管理订阅
            </button>
          </div>
        </div>

        {/* AI 点数 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI 点数</h2>
          <p className="text-gray-600 mb-6">点数用于 AI 提示词生成和优化</p>
          
          {/* 点数信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 font-medium mb-1">剩余点数</div>
              <div className="text-2xl font-bold text-brand-blue">{displayAiPoints.remainingPoints.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-sm text-gray-600 font-medium mb-1">本月已使用</div>
              <div className="text-2xl font-bold text-gray-400">{displayAiPoints.usedPoints.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-sm text-gray-600 font-medium mb-1">总点数</div>
              <div className="text-2xl font-bold text-gray-900">{displayAiPoints.totalPoints.toLocaleString()}</div>
            </div>
          </div>
          
          {/* 购买选项 */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">购买更多点数</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`border border-gray-200 rounded-lg p-4 hover:border-brand-blue transition-colors cursor-pointer bg-white ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('small')}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">基础包</h4>
                    <p className="text-sm text-gray-500 mt-1">1000点</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">¥10</span>
                </div>
              </div>
              
              <div className={`border-2 border-brand-blue rounded-lg p-4 bg-blue-50 relative ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('medium')}>
                <div className="absolute top-0 right-0 bg-brand-blue text-white text-xs font-medium px-2 py-1 rounded-bl-lg rounded-tr-md">
                  推荐
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">标准包</h4>
                    <p className="text-sm text-gray-500 mt-1">5000点</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">¥45</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <span className="line-through text-gray-400">¥50</span>
                  <span className="ml-2 text-brand-blue">节省¥5</span>
                </div>
              </div>
              
              <div className={`border border-gray-200 rounded-lg p-4 hover:border-brand-blue transition-colors cursor-pointer bg-white ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('large')}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">专业包</h4>
                    <p className="text-sm text-gray-500 mt-1">10000点</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">¥80</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <span className="line-through text-gray-400">¥100</span>
                  <span className="ml-2 text-brand-blue">节省¥20</span>
                </div>
              </div>
            </div>
          
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
                value={user.email}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存更改'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}