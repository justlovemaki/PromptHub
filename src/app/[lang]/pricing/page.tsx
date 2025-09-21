'use client'

import { useState } from 'react'
import { useAuth } from '@promptmanager/core-logic'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'
import Decimal from 'decimal.js'

interface Plan {
  id: 'FREE' | 'PRO' | 'TEAM'
  nameKey: string
  descriptionKey: string
  monthlyPrice: number
  yearlyPrice: string
  features: {
    aiPoints: string
    prompts: string
    supportKey: string
    collaboration: string
    advancedFeaturesKey: string
  }
}

export default function Pricing({ params }: { params: { lang: string } }) {
  const { t } = useTranslation(params.lang, 'common')
  const { user, isAuthenticated, manageSubscription } = useAuth()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 定义套餐信息
  const plans: Plan[] = [
    {
      id: 'FREE',
      nameKey: 'freePlan',
      descriptionKey: 'freePlanDescription',
      monthlyPrice: 0,
      yearlyPrice: '0',
      features: {
        aiPoints: '1000',
        prompts: '5',
        supportKey: 'emailSupport',
        collaboration: '0',
        advancedFeaturesKey: 'no'
      }
    },
    {
      id: 'PRO',
      nameKey: 'proPlan',
      descriptionKey: 'proPlanDescription',
      monthlyPrice: 29,
      yearlyPrice: new Decimal(29).mul(12).mul(0.8).ceil().toFixed(0), // 29 * 12 months * 0.8 = 20% discount
      features: {
        aiPoints: '5000',
        prompts: 'unlimited',
        supportKey: 'priority',
        collaboration: '0',
        advancedFeaturesKey: 'yes'
      }
    },
    {
      id: 'TEAM',
      nameKey: 'teamPlan',
      descriptionKey: 'teamPlanDescription',
      monthlyPrice: 99,
      yearlyPrice: new Decimal(99).mul(12).mul(0.8).ceil().toFixed(0), // 99 * 12 months * 0.8 = 20% discount
      features: {
        aiPoints: 'unlimited',
        prompts: 'unlimited',
        supportKey: 'priority',
        collaboration: 'unlimited',
        advancedFeaturesKey: 'yes'
      }
    }
  ]

  // 处理订阅管理
  const handleSubscriptionAction = async (action: 'upgrade' | 'downgrade' | 'cancel', planId: string) => {
    if (!isAuthenticated) {
      router.push(`/${params.lang}/login`)
      return
    }

    setIsLoading(planId)
    setError(null)

    try {
      const success = await manageSubscription(action)
      if (success) {
        // 刷新页面以显示更新后的状态
        window.location.reload()
      } else {
        setError(t('operationFailed'))
      }
    } catch (err) {
      setError(t('operationFailed'))
    } finally {
      setIsLoading(null)
    }
  }

  // 获取按钮文本
  const getButtonText = (planId: string) => {
    if (!isAuthenticated) {
      return t('loginToSelectPlan')
    }

    if (user?.subscriptionStatus === planId) {
      return t('currentPlan')
    }

    if (user?.subscriptionStatus === 'FREE' && planId !== 'FREE') {
      return t('upgrade')
    }

    if (user?.subscriptionStatus === 'PRO' && planId === 'FREE') {
      return t('downgrade')
    }

    if (user?.subscriptionStatus === 'PRO' && planId === 'TEAM') {
      return t('upgrade')
    }

    if (user?.subscriptionStatus === 'TEAM' && planId !== 'TEAM') {
      return t('downgrade')
    }

    return t('selectPlan')
  }

  // 获取按钮样式
  const getButtonStyle = (planId: string) => {
    if (!isAuthenticated) {
      return 'bg-brand-blue hover:bg-brand-blue/90 text-white'
    }

    if (user?.subscriptionStatus === planId) {
      return 'bg-gray-200 text-gray-800 cursor-not-allowed'
    }

    return 'bg-brand-blue hover:bg-brand-blue/90 text-white'
  }

  // 获取价格
  const getPrice = (plan: Plan) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
    if (price === 0) {
      return t('free')
    }
    return `$${price}${billingCycle === 'monthly' ? '/' + t('monthly') : '/' + t('yearly')}`
  }

  // 获取功能描述
  const getFeatureValue = (value: string) => {
    if (value === 'unlimited') {
      return t('unlimited')
    }
    if (value === 'yes') {
      return t('yes')
    }
    if (value === 'no') {
      return t('no')
    }
    return value
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('pricingTitle')}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('pricingSubtitle')}
          </p>
        </div>

        {/* 计费周期切换 */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-brand-blue text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'yearly' 
                  ? 'bg-brand-blue text-white' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {t('yearly')}
              <span className="absolute -top-4 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {t('save20')}
              </span>
            </button>
          </div>
        </div>

        {/* 错误消息 */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* 套餐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-xl shadow-lg overflow-hidden border ${
                user?.subscriptionStatus === plan.id 
                  ? 'border-brand-blue ring-2 ring-brand-blue/20' 
                  : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t(plan.nameKey)}</h2>
                    <p className="text-gray-600 mt-1">{t(plan.descriptionKey)}</p>
                  </div>
                  {user?.subscriptionStatus === plan.id && (
                    <span className="bg-brand-blue/10 text-brand-blue text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {t('currentPlan')}
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{getPrice(plan)}</span>
                  {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      {t('equivalentTo')} ${new Decimal(plan.yearlyPrice).div(12).ceil().toFixed(0)}/{t('month')}
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-medium">{t('feature1')}</span>
                      <span className="block text-gray-600 text-sm">{getFeatureValue(plan.features.aiPoints)}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-medium">{t('feature2')}</span>
                      <span className="block text-gray-600 text-sm">{getFeatureValue(plan.features.prompts)}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-medium">{t('feature4')}</span>
                      <span className="block text-gray-600 text-sm">{t(plan.features.supportKey)}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-medium">{t('feature5')}</span>
                      <span className="block text-gray-600 text-sm">{getFeatureValue(plan.features.collaboration)}</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="font-medium">{t('feature6')}</span>
                      <span className="block text-gray-600 text-sm">{t(plan.features.advancedFeaturesKey)}</span>
                    </div>
                  </li>
                </ul>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      router.push(`/${params.lang}/login`)
                      return
                    }
                    
                    if (user?.subscriptionStatus === plan.id) return
                    
                    if (user?.subscriptionStatus === 'FREE' && plan.id !== 'FREE') {
                      handleSubscriptionAction('upgrade', plan.id)
                    } else if (user?.subscriptionStatus === 'PRO' && plan.id === 'FREE') {
                      handleSubscriptionAction('downgrade', plan.id)
                    } else if (user?.subscriptionStatus === 'PRO' && plan.id === 'TEAM') {
                      handleSubscriptionAction('upgrade', plan.id)
                    } else if (user?.subscriptionStatus === 'TEAM' && plan.id !== 'TEAM') {
                      handleSubscriptionAction('downgrade', plan.id)
                    }
                  }}
                  disabled={isLoading === plan.id || (user?.subscriptionStatus === plan.id)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    getButtonStyle(plan.id)
                  } ${
                    isLoading === plan.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading === plan.id ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('processing')}
                    </div>
                  ) : (
                    getButtonText(plan.id)
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 常见问题 */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            {t('faqTitle')}
          </h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                {t('faq1Question')}
              </h3>
              <p className="text-gray-600">
                {t('faq1Answer')}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">
                {t('faq2Question')}
              </h3>
              <p className="text-gray-600">
                {t('faq2Answer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}