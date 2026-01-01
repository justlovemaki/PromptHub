'use client';

import TopNavbar from '@/components/layout/TopNavbar';
import Footer from '@/components/layout/Footer';
import ParticlesBackground from '@/components/landing/ParticlesBackground';
import { useTranslation } from '@/i18n/client';
import { use } from 'react';

export default function Terms({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { t } = useTranslation(lang, 'terms');

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col">
      {/* 星星点点动态背景 */}
      <ParticlesBackground />
      
      {/* 顶部导航栏 */}
      <TopNavbar lang={lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] bg-clip-text text-transparent">
            {t('title')}
          </h1>
          
          <div className="bg-[var(--bg-200)] backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-[var(--bg-300)] shadow-xl">
            <div className="max-w-none">
              <h2 className="text-2xl font-semibold mb-4 text-[var(--primary-100)]">
                {t('welcomeMessage')}
              </h2>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section1.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section1.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section2.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section2.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section3.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section3.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section4.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section4.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section5.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section5.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section6.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section6.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section7.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section7.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section8.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section8.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section9.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section9.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section10.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section10.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section11.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section11.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-[var(--primary-100)] mt-8">
                {t('section12.title')}
              </h3>
              <p className="text-[var(--text-200)] mb-4 leading-relaxed">
                {t('section12.content')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <Footer lang={lang} />
    </div>
  );
}