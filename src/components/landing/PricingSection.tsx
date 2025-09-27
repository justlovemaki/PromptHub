'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Check, X } from 'lucide-react';
import Decimal from 'decimal.js';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@promptmanager/core-logic';
import { useRouter } from 'next/navigation';
import { SUBSCRIPTION_ACTIONS, type SubscriptionAction, type SubscriptionStatus, SUBSCRIPTION_STATUS } from '@/lib/constants';

interface PricingPlan {
  id: SubscriptionStatus;
  nameKey: string;
  monthlyPrice: number;
  yearlyPrice: string;
  periodKey: string;
  features: string[];
  notIncluded?: string[];
  recommended?: boolean;
  buttonKey: string;
}

// 价格卡片组件
const PricingCard = ({
  plan,
  index,
  t,
  billingCycle,
  params,
  user,
  isAuthenticated,
  handleSubscriptionAction,
  isLoading,
  setIsLoading,
  isAdmin
}: {
  plan: PricingPlan;
  index: number;
  t: any;
  billingCycle: 'monthly' | 'yearly';
  params: { lang: string };
  user: any;
  isAuthenticated: boolean;
  handleSubscriptionAction: (action: SubscriptionAction, planId: string) => Promise<void>;
  isLoading: string | null;
  setIsLoading: (planId: string | null) => void;
  isAdmin: boolean;
}) => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const router = useRouter();
  
  // 获取价格显示
  const getPrice = () => {
    if (plan.monthlyPrice === 0) {
      return t('common:free');
    }
    
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const currency = params.lang === 'en' ? '$' : params.lang === 'ja' ? '¥' : '¥';
    
    return `${currency}${price}${billingCycle === 'monthly' ? '/' + t('common:monthly') : '/' + t('common:yearly')}`;
  };
  
  // 获取等效月价格（仅年付时显示）
  const getEquivalentMonthlyPrice = () => {
    if (billingCycle === 'monthly' || plan.monthlyPrice === 0) return null;
    
    const equivalentPrice = new Decimal(plan.yearlyPrice).div(12).ceil().toFixed(0);
    const currency = params.lang === 'en' ? '$' : params.lang === 'ja' ? '¥' : '¥';
    
    return `${t('common:equivalentTo')} ${currency}${equivalentPrice}/${t('common:month')}`;
  };
  
  // 获取按钮文本
  const getButtonText = () => {
    if (!isAuthenticated) {
      return t('common:loginToSelectPlan');
    }

    if (user?.subscriptionStatus === plan.id) {
      return t('common:currentPlan');
    }

    if (user?.subscriptionStatus === SUBSCRIPTION_STATUS.FREE && plan.id !== SUBSCRIPTION_STATUS.FREE) {
      return t('common:upgrade');
    }

    if (user?.subscriptionStatus === SUBSCRIPTION_STATUS.PRO && plan.id === SUBSCRIPTION_STATUS.FREE) {
      return t('common:downgrade');
    }

    if (user?.subscriptionStatus === SUBSCRIPTION_STATUS.PRO && plan.id === SUBSCRIPTION_STATUS.TEAM) {
      return t('common:upgrade');
    }

    if (user?.subscriptionStatus === SUBSCRIPTION_STATUS.TEAM && plan.id !== SUBSCRIPTION_STATUS.TEAM) {
      return t('common:downgrade');
    }

    return t('common:selectPlan');
  };

  // 获取按钮样式
  const getButtonStyle = () => {
    if (!isAuthenticated) {
      return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white';
    }

    if (user?.subscriptionStatus === plan.id) {
      return 'bg-gray-200 text-gray-800 cursor-not-allowed';
    }

    return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white';
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative ${plan.recommended ? 'scale-105' : ''}`}
    >
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-sm font-semibold z-10">
          {t('pricing.mostPopular')}
        </div>
      )}
      
      <div className={`h-full bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border flex flex-col ${
        plan.recommended ? 'border-purple-500' : 'border-gray-700'
      } hover:border-purple-400 transition-all duration-300`}>
        <h3 className="text-2xl font-bold mb-4">{t(plan.nameKey)}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold">{getPrice()}</span>
          {getEquivalentMonthlyPrice() && (
            <div className="text-sm text-gray-400 mt-1">
              {getEquivalentMonthlyPrice()}
            </div>
          )}
        </div>
        
        <div className="space-y-3 mb-8 flex-grow">
          {plan.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
          {plan.notIncluded?.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 opacity-50">
              <X className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 line-through">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-auto">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                router.push(`/${params.lang}/login`);
                return;
              }
              
              if (user?.subscriptionStatus === plan.id) return;
              
              if (user?.subscriptionStatus === 'FREE' && plan.id !== 'FREE') {
                handleSubscriptionAction(SUBSCRIPTION_ACTIONS.UPGRADE, plan.id);
              } else if (user?.subscriptionStatus === 'PRO' && plan.id === 'FREE') {
                handleSubscriptionAction(SUBSCRIPTION_ACTIONS.DOWNGRADE, plan.id);
              } else if (user?.subscriptionStatus === 'PRO' && plan.id === 'TEAM') {
                handleSubscriptionAction(SUBSCRIPTION_ACTIONS.UPGRADE, plan.id);
              } else if (user?.subscriptionStatus === 'TEAM' && plan.id !== 'TEAM') {
                handleSubscriptionAction(SUBSCRIPTION_ACTIONS.DOWNGRADE, plan.id);
              }
            }}
            disabled={isLoading === plan.id || (user?.subscriptionStatus === plan.id) || (!isAdmin && plan.id !== 'FREE')}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
              getButtonStyle()
            } ${
              isLoading === plan.id || (!isAdmin && plan.id !== 'FREE') ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading === plan.id ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('common:processing')}
              </div>
            ) : (
              getButtonText()
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// 价格区域组件
const PricingSection = ({ params, isAdmin }: { params: { lang: string }, isAdmin: boolean }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(params.lang, 'landing');
  const { user, isAuthenticated, manageSubscription } = useAuth();
  const router = useRouter();
  
  // 处理订阅管理
  const handleSubscriptionAction = async (action: SubscriptionAction, planId: string) => {
    if (!isAuthenticated) {
      router.push(`/${params.lang}/login`);
      return;
    }

    setIsLoading(planId);
    setError(null);

    try {
      const success = await manageSubscription(action);
      if (success) {
        // 刷新页面以显示更新后的状态
        window.location.reload();
      } else {
        setError(t('common:operationFailed'));
      }
    } catch (err) {
      setError(t('common:operationFailed'));
    } finally {
      setIsLoading(null);
    }
  };
  
  // 价格方案数据 - 使用语言键
  const pricingPlans: PricingPlan[] = [
    {
      id: SUBSCRIPTION_STATUS.FREE,
      nameKey: 'pricing.free.name',
      monthlyPrice: 0,
      yearlyPrice: '0',
      periodKey: 'pricing.free.period',
      features: [
        t('pricing.free.features.storage'),
        t('pricing.free.features.basicCategory'),
        t('pricing.free.features.simpleSearch'),
        t('pricing.free.features.browserExt'),
      ],
      notIncluded: [
        t('pricing.free.notIncluded.aiOptimize'),
        t('pricing.free.notIncluded.teamCollab'),
        t('pricing.free.notIncluded.cloudSync'),
      ],
      buttonKey: 'pricing.free.button'
    },
    {
      id: SUBSCRIPTION_STATUS.PRO,
      nameKey: 'pricing.pro.name',
      monthlyPrice: params.lang === 'en' ? 7 : params.lang === 'ja' ? 1000 : 49,
      yearlyPrice: new Decimal(params.lang === 'en' ? 7 : params.lang === 'ja' ? 1000 : 49).mul(12).mul(0.8).ceil().toFixed(0),
      periodKey: 'pricing.pro.period',
      features: [
        t('pricing.pro.features.unlimited'),
        t('pricing.pro.features.advancedTags'),
        t('pricing.pro.features.aiOptimize'),
        t('pricing.pro.features.globalHotkey'),
        t('pricing.pro.features.cloudSync'),
        t('pricing.pro.features.prioritySupport'),
      ],
      recommended: true,
      buttonKey: 'pricing.pro.button'
    },
    {
      id: SUBSCRIPTION_STATUS.TEAM,
      nameKey: 'pricing.team.name',
      monthlyPrice: params.lang === 'en' ? 39 : params.lang === 'ja' ? 5000 : 299,
      yearlyPrice: new Decimal(params.lang === 'en' ? 39 : params.lang === 'ja' ? 5000 : 299).mul(12).mul(0.8).ceil().toFixed(0),
      periodKey: 'pricing.team.period',
      features: [
        t('pricing.team.features.allPro'),
        t('pricing.team.features.teamLib'),
        t('pricing.team.features.permission'),
        t('pricing.team.features.analytics'),
        t('pricing.team.features.apiAccess'),
        t('pricing.team.features.accountManager'),
      ],
      buttonKey: 'pricing.team.button'
    }
  ];

  return (
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('pricing.title')}
            <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> {t('pricing.highlight')}</span>
          </h2>
          <p className="text-xl text-gray-400">{t('pricing.subtitle')}</p>
        </motion.div>

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

        {/* 计费周期切换 */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t('common:monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t('common:yearly')}
              <span className="absolute -top-3 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {t('common:save20')}
              </span>
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              index={index}
              t={t}
              billingCycle={billingCycle}
              params={params}
              user={user}
              isAuthenticated={isAuthenticated}
              handleSubscriptionAction={handleSubscriptionAction}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              isAdmin={isAdmin}
            />
          ))}
        </div>

      </div>
  );
};

export default PricingSection;