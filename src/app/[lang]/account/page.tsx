'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@promptmanager/core-logic'
import { api } from '@promptmanager/core-logic'
import { useToast } from '../../../components/ToastProvider'
import UserPageWrapper from '../../../components/admin/UserPageWrapper'
import { useTranslation } from '@/i18n/client'

export default function AccountPage({ params }: { params: { lang: string } }) {
  const { t } = useTranslation(params.lang, 'account')
  const { user, updateUser, purchaseAiPoints, refreshUser} = useAuth();
  const { showSuccess } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [aiPointsData, setAiPointsData] = useState<{
    totalPoints: number;
    usedPoints: number;
    remainingPoints: number;
  } | null>({ totalPoints: 0, usedPoints: 0, remainingPoints: 0 });
  
  // 获取AI点数信息
  useEffect(() => {
    // 如果用户信息未加载，不执行任何操作
    if (!user) return;

    if(user?.subscriptionAiPoints == aiPointsData?.totalPoints) return

    const fetchAiPointsData = async () => {
      try {
        const response = await api.getAiPointsUsage(params.lang);
        if (response.success) {
          setAiPointsData({
            totalPoints: response.data.totalPoints,
            usedPoints: response.data.usedPoints,
            remainingPoints: response.data.remainingPoints
          });
        }
      } catch (error) {
        console.error(t('fetchAiPointsError'), error);
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
        refreshUser()
        showSuccess(t('updateUsernameSuccess'), t('accountUpdated'));
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
  
  // 显示的点数数据
  const displayAiPoints = aiPointsData || {
    totalPoints: user?.subscriptionAiPoints || 0,
    usedPoints: 0,
    remainingPoints: 0
  };
  
  return (
    <UserPageWrapper lang={params.lang}>
      <div className="space-y-8 max-w-4xl mx-auto">

        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('accountSettings')}</h1>
          <p className="text-gray-600 mt-1">{t('accountSettingsDescription')}</p>
        </div>

        {/* 订阅状态 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('subscriptionStatus')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {user?.subscriptionStatus === 'PRO' ? t('subscriptionProPlan') :
                   user?.subscriptionStatus === 'TEAM' ? t('subscriptionTeamPlan') : t('subscriptionFreePlan')}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user?.subscriptionStatus === 'FREE' ? 'bg-gray-200 text-gray-800' : 'bg-brand-blue text-white'
                }`}>
                  {user?.subscriptionStatus === 'FREE' ? t('subscriptionInactive') : t('subscriptionActive')}
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                {user?.subscriptionStatus === 'FREE' ? t('subscriptionBasicFeatures') : t('subscriptionPremiumFeatures')}
              </p>
              {user?.subscriptionEndDate && (
                <p className="text-sm text-gray-500 mt-2">
                  {t('subscriptionRenewalTime')}{t('colon')}{new Date(user.subscriptionEndDate).toLocaleDateString()}
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
              {t('manageSubscriptionButton')}
            </button>
          </div>
        </div>

        {/* AI 点数 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('aiPointsSection')}</h2>
          <p className="text-gray-600 mb-6">{t('aiPointsDescription')}</p>

          {/* 点数信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 font-medium mb-1">{t('pointsRemaining')}</div>
              <div className="text-2xl font-bold text-brand-blue">{displayAiPoints.remainingPoints.toLocaleString()}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-sm text-gray-600 font-medium mb-1">{t('pointsUsedThisMonth')}</div>
              <div className="text-2xl font-bold text-gray-400">{displayAiPoints.usedPoints.toLocaleString()}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-sm text-gray-600 font-medium mb-1">{t('pointsTotal')}</div>
              <div className="text-2xl font-bold text-gray-900">{displayAiPoints.totalPoints.toLocaleString()}</div>
            </div>
          </div>

          {/* 购买选项 */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">{t('buyMorePointsTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`border border-gray-200 rounded-lg p-4 hover:border-brand-blue transition-colors cursor-pointer bg-white ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('small')}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{t('basicPackageTitle')}</h4>
                    <p className="text-sm text-gray-500 mt-1">{t('basicPackagePoints')}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{t('basicPackagePrice')}</span>
                </div>
              </div>

              <div className={`border-2 border-brand-blue rounded-lg p-4 bg-blue-50 relative ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('medium')}>
                <div className="absolute top-0 right-0 bg-brand-blue text-white text-xs font-medium px-2 py-1 rounded-bl-lg rounded-tr-md">
                  {t('standardPackageRecommended')}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{t('standardPackageTitle')}</h4>
                    <p className="text-sm text-gray-500 mt-1">{t('standardPackagePoints')}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{t('standardPackagePrice')}</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <span className="line-through text-gray-400">{t('originalPrice')}</span>
                  <span className="ml-2 text-brand-blue">{t('saveAmount')}</span>
                </div>
              </div>

              <div className={`border border-gray-200 rounded-lg p-4 hover:border-brand-blue transition-colors cursor-pointer bg-white ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('large')}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{t('professionalPackageTitle')}</h4>
                    <p className="text-sm text-gray-500 mt-1">{t('professionalPackagePoints')}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{t('professionalPackagePrice')}</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <span className="line-through text-gray-400">{t('professionalPackageOriginalPrice')}</span>
                  <span className="ml-2 text-brand-blue">{t('saveAmount20')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 个人信息 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('personalInfoSection')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailLabel')}</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('usernameLabel')}</label>
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
                {isSaving ? t('savingText') : t('saveChangesButton')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </UserPageWrapper>
  )
}