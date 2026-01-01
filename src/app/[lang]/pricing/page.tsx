'use client';

import ParticlesBackground from '@/components/landing/ParticlesBackground';
import TopNavbar from '@/components/layout/TopNavbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/landing/PricingSection';
import { useTranslation } from '@/i18n/client';
import { useAuthStatus } from '@promptmanager/core-logic';
import LoginModal from '@/components/LoginModal';
import { useState, use } from 'react';

export default function Pricing({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { t } = useTranslation(lang, 'common');
  const { isAdmin, isTokenExpired } = useAuthStatus();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col">
      {/* 星星点点动态背景 */}
      <ParticlesBackground />
      
      {/* 顶部导航栏 */}
      <TopNavbar lang={lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* 使用 PricingSection 组件 */}
          <PricingSection params={{ lang }} isAdmin={isAdmin} handleLoginModal={setIsLoginModalOpen} />

          {/* 常见问题 */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-100)]">
              {t('common:faqTitle')}
            </h2>
            <div className="space-y-6">
              <div className="bg-[var(--bg-200)] backdrop-blur-lg rounded-xl p-6 border border-[var(--bg-300)]">
                <h3 className="font-medium text-lg text-[var(--text-100)] mb-2">
                  {t('common:faq1Question')}
                </h3>
                <p className="text-[var(--text-200)]">
                  {t('common:faq1Answer')}
                </p>
              </div>
              <div className="bg-[var(--bg-200)] backdrop-blur-lg rounded-xl p-6 border border-[var(--bg-300)]">
                <h3 className="font-medium text-lg text-[var(--text-100)] mb-2">
                  {t('common:faq2Question')}
                </h3>
                <p className="text-[var(--text-200)]">
                  {t('common:faq2Answer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* 登录模态框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lng={lang}
      />

      {/* 页脚 */}
      <Footer lang={lang} />
    </div>
  );
}