'use client'

import { useState, useEffect } from 'react';
import { useAuth, useAuthStatus } from '@promptmanager/core-logic'
import { api } from '@promptmanager/core-logic'
import { useToast } from '../../../components/ToastProvider'
import UserPageWrapper from '../../../components/admin/UserPageWrapper'
import { useTranslation } from '@/i18n/client'
import { useTags } from '../../../hooks/useTags'
import { AiPointsPackageType } from '@/lib/constants';

export default function AccountPage({ params }: { params: { lang: string } }) {
  const { t } = useTranslation(params.lang, 'account')
  const { user, updateUser, purchaseAiPoints, refreshUser, setLanguage } = useAuth();
  const { showSuccess, showError } = useToast();
  const { isAdmin } = useAuthStatus();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aiPointsData, setAiPointsData] = useState<{
    totalPoints: number;
    usedPoints: number;
    remainingPoints: number;
  } | null>({ totalPoints: 0, usedPoints: 0, remainingPoints: 0 });
  
  // 获取所有可用标签
  const { allTags } = useTags(params.lang);

  // 设置语言属性
  useEffect(() => {
    setLanguage(params.lang);
  }, [params.lang, setLanguage]);

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
  const handlePurchaseAiPoints = async (packageType: AiPointsPackageType) => {
    setIsPurchasing(true);
    try {
      await purchaseAiPoints(packageType);
    } finally {
      setIsPurchasing(false);
    }
  };
  
  // 导出提示词
  const handleExportPrompts = async () => {
    setIsExporting(true);
    try {
      // 使用apiclient调用导出API，使用用户的个人空间ID
      const blob = await api.exportPrompts(user?.personalSpaceId, params.lang);

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // 生成带时间戳的文件名（使用本地时区时间）
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`; // 格式：YYYY-MM-DD_HH-mm-ss
      link.download = `prompts-export-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess(t('exportPromptsButton'), t('exportInProgress'));
    } catch (error) {
      console.error(t('exportError'), error);
      showError(t('exportError') + (error instanceof Error ? error.message : error));
    } finally {
      setIsExporting(false);
    }
  };

  // 导入提示词
  const handleImportPrompts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      const promptsData = JSON.parse(fileContent);

      // 验证数据格式
      if (!Array.isArray(promptsData)) {
        throw new Error(t('importPrompt'));
      }

      // 获取所有可用标签用于验证
      const validTagKeys = new Set(allTags.map(tag => tag.key));

      // 验证导入数据中的所有标签
      const invalidPrompts = [];
      for (let i = 0; i < promptsData.length; i++) {
        const prompt = promptsData[i];
        if (prompt.tags && Array.isArray(prompt.tags)) {
          const invalidTags = prompt.tags.filter((tag: string) => !validTagKeys.has(tag));
          if (invalidTags.length > 0) {
            invalidPrompts.push({
              index: i,
              title: prompt.title || `Prompt ${i + 1}`,
              invalidTags: invalidTags
            });
          }
        }
      }

      // 如果存在无效标签，抛出错误
      if (invalidPrompts.length > 0) {
        const errorDetails = invalidPrompts.map(item =>
          `${item.title}: [${item.invalidTags.join(', ')}]`
        ).join('; ');
        throw new Error(`${t('invalidTagsInImport')}: ${errorDetails}`);
      }

      // 使用用户的个人空间ID进行导入
      const response = await api.importPrompts(promptsData, user?.personalSpaceId, params.lang);
      
      if (response.success) {
        showSuccess(t('importSuccess'), t('fileImportedSuccessfully', { count: response.data.importedCount }));
      } else {
        // TypeScript: response在success为false时保证有error属性
        throw new Error((response as { success: false; error: { details: { error: string}; message: string } }).error.details.error || t('importError'));
      }
    } catch (error) {
      console.error(t('importError'), error);
      showError(t('importError') + (error instanceof Error ? error.message : error));
    } finally {
      setIsImporting(false);
      // 重置文件输入框
      event.target.value = '';
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
          <h1 className="text-2xl font-bold text-text-100">{t('accountSettings')}</h1>
          <p className="text-text-200 mt-1">{t('accountSettingsDescription')}</p>
        </div>

        {/* 订阅状态 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-text-100 mb-4">{t('subscriptionStatus')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-text-100">
                  {user?.subscriptionStatus === 'PRO' ? t('subscriptionProPlan') :
                   user?.subscriptionStatus === 'TEAM' ? t('subscriptionTeamPlan') : t('subscriptionFreePlan')}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user?.subscriptionStatus === 'FREE' ? 'bg-bg-200 text-text-200' : 'bg-primary-100 text-white'
                }`}>
                  {user?.subscriptionStatus === 'FREE' ? t('subscriptionInactive') : t('subscriptionActive')}
                </span>
              </div>
              <p className="text-text-200 mt-1">
                {user?.subscriptionStatus === 'FREE' ? t('subscriptionBasicFeatures') : t('subscriptionPremiumFeatures')}
              </p>
              {user?.subscriptionEndDate && (
                <p className="text-sm text-text-300 mt-2">
                  {t('subscriptionRenewalTime')}{t('colon')}{new Date(user.subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
            {isAdmin && (
            <button
              onClick={() => {
                // 在新页面中打开定价页面
                window.open(`/${params.lang}/pricing`, '_blank');
              }}
              className="bg-primary-100 hover:bg-primary-100/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t('manageSubscriptionButton')}
            </button>
            )}
          </div>
        </div>

        {/* AI 点数 */}
        {isAdmin && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-text-100 mb-4">{t('aiPointsSection')}</h2>
          <p className="text-text-200 mb-6">{t('aiPointsDescription')}</p>

          {/* 点数信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-primary-300 rounded-lg p-6 border border-primary-300">
              <div className="text-sm text-primary-100 font-medium mb-1">{t('pointsRemaining')}</div>
              <div className="text-2xl font-bold text-primary-100">{displayAiPoints.remainingPoints.toLocaleString()}</div>
            </div>

            <div className="bg-bg-200 rounded-lg p-6 border border-bg-200">
              <div className="text-sm text-text-200 font-medium mb-1">{t('pointsUsedThisMonth')}</div>
              <div className="text-2xl font-bold text-text-300">{displayAiPoints.usedPoints.toLocaleString()}</div>
            </div>

            <div className="bg-bg-200 rounded-lg p-6 border border-bg-200">
              <div className="text-sm text-text-200 font-medium mb-1">{t('pointsTotal')}</div>
              <div className="text-2xl font-bold text-text-100">{displayAiPoints.totalPoints.toLocaleString()}</div>
            </div>
          </div>

          {/* 购买选项 */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-text-100 mb-3">{t('buyMorePointsTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`border border-bg-300 rounded-lg p-6 hover:border-primary-100 transition-colors cursor-pointer bg-white ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('small')}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-text-100">{t('basicPackageTitle')}</h4>
                    <p className="text-sm text-text-300 mt-1">{t('basicPackagePoints')}</p>
                  </div>
                  <span className="text-lg font-bold text-text-100">{t('basicPackagePrice')}</span>
                </div>
              </div>

              <div className={`border-2 border-primary-100 rounded-lg p-6 bg-primary-300 relative ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('medium')}>
                <div className="absolute top-0 right-0 bg-primary-100 text-white text-xs font-medium px-2 py-1 rounded-bl-lg rounded-tr-md">
                  {t('standardPackageRecommended')}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-text-100">{t('standardPackageTitle')}</h4>
                    <p className="text-sm text-text-300 mt-1">{t('standardPackagePoints')}</p>
                  </div>
                  <span className="text-lg font-bold text-text-100">{t('standardPackagePrice')}</span>
                </div>
                <div className="mt-2 text-xs text-text-200">
                  <span className="line-through text-text-300">{t('originalPrice')}</span>
                  <span className="ml-2 text-primary-100">{t('saveAmount')}</span>
                </div>
              </div>

              <div className={`border border-bg-300 rounded-lg p-6 hover:border-primary-100 transition-colors cursor-pointer bg-white ${isPurchasing ? 'opacity-50 pointer-events-none' : ''}`}
                   onClick={() => !isPurchasing && handlePurchaseAiPoints('large')}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-text-100">{t('professionalPackageTitle')}</h4>
                    <p className="text-sm text-text-300 mt-1">{t('professionalPackagePoints')}</p>
                  </div>
                  <span className="text-lg font-bold text-text-100">{t('professionalPackagePrice')}</span>
                </div>
                <div className="mt-2 text-xs text-text-200">
                  <span className="line-through text-text-300">{t('professionalPackageOriginalPrice')}</span>
                  <span className="ml-2 text-primary-100">{t('saveAmount20')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
        )}

        {/* 导入导出 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-text-100 mb-4">{t('importExportSection')}</h2>
          <p className="text-text-200 mb-6">{t('importExportDescription')}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExportPrompts}
              disabled={isExporting}
              className="bg-primary-100 hover:bg-primary-100/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex-1"
            >
              {isExporting ? t('exportInProgress') : t('exportPromptsButton')}
            </button>
            <div className="relative flex-1">
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleImportPrompts}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <label
                htmlFor="import-file"
                className="block bg-bg-200 hover:bg-bg-300 border border-bg-300 text-text-200 px-4 py-2 rounded-lg font-medium text-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? t('importInProgress') : t('importPromptsButton')}
              </label>
            </div>
          </div>
        </div>

        {/* 个人信息 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-text-100 mb-4">{t('personalInfoSection')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-200 mb-1">{t('emailLabel')}</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 border border-bg-300 rounded-md bg-bg-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-200 mb-1">{t('usernameLabel')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-bg-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary-100 hover:bg-primary-100/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
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