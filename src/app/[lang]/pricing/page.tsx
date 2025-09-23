'use client';

import ParticlesBackground from '@/components/landing/ParticlesBackground';
import TopNavbar from '@/components/layout/TopNavbar';
import PricingSection from '@/components/landing/PricingSection';
import { useTranslation } from '@/i18n/client';

export default function Pricing({ params }: { params: { lang: string } }) {
  const { t } = useTranslation(params.lang, 'common');

  return (
    <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white min-h-screen overflow-x-hidden">
      {/* 动态粒子背景 */}
      <ParticlesBackground />
      
      {/* 顶部导航栏 */}
      <TopNavbar lang={params.lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">                    
          {/* 使用 PricingSection 组件 */}
          <PricingSection params={params} />

          {/* 常见问题 */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">
              {t('common:faqTitle')}
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <h3 className="font-medium text-lg text-white mb-2">
                  {t('common:faq1Question')}
                </h3>
                <p className="text-gray-300">
                  {t('common:faq1Answer')}
                </p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <h3 className="font-medium text-lg text-white mb-2">
                  {t('common:faq2Question')}
                </h3>
                <p className="text-gray-300">
                  {t('common:faq2Answer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}