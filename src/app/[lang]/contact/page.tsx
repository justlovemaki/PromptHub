'use client';

import ParticlesBackground from '@/components/landing/ParticlesBackground';
import TopNavbar from '@/components/layout/TopNavbar';
import Footer from '@/components/layout/Footer';
import { useTranslation } from '@/i18n/client';
import { use } from 'react';

export default function Contact({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { t } = useTranslation(lang, 'contact');

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col">
      {/* 星星点点动态背景 */}
      <ParticlesBackground />
      
      {/* 顶部导航栏 */}
      <TopNavbar lang={lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* 标题区域 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-[var(--text-200)] text-lg md:text-xl max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>
          
          {/* 联系方式内容区 */}
          <div className="bg-[var(--bg-200)] backdrop-blur-lg rounded-2xl p-6 md:p-10 border border-[var(--bg-300)] shadow-2xl">
            {/* 邮箱部分 */}
            <div className="mb-8 pb-8 border-b border-[var(--bg-300)]">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[var(--primary-100)] to-[var(--secondary-400)] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--bg-100)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-[var(--primary-100)]">
                    {t('emailLabel')}
                  </h3>
                  <a
                    href={`mailto:${t('email')}`}
                    className="text-[var(--text-200)] hover:text-[var(--primary-100)] transition-colors break-all text-base inline-flex items-center group"
                  >
                    {t('email')}
                    <svg className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* 社交媒体部分 */}
            <div>
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[var(--primary-100)] to-[var(--secondary-400)] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--bg-100)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-[var(--primary-100)]">
                    {t('socialMediaTitle')}
                  </h3>
                  <p className="text-[var(--text-200)] text-sm">
                    {t('socialMediaDescription')}
                  </p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 ml-16">
                <a
                  href="https://x.com/justlikemaki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 bg-[var(--bg-300)] hover:bg-[var(--bg-400)] rounded-xl transition-all duration-300 group border border-[var(--bg-400)] hover:border-[var(--primary-100)]"
                >
                  <div className="w-10 h-10 bg-[var(--primary-100)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--primary-100)]/30 transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 text-[var(--primary-100)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-[var(--text-200)] group-hover:text-[var(--primary-100)] transition-colors font-medium">{t('twitter')}</span>
                  <svg className="w-4 h-4 ml-auto text-[var(--text-300)] group-hover:text-[var(--primary-100)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                <a
                  href="https://github.com/justlovemaki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 bg-[var(--bg-300)] hover:bg-[var(--bg-400)] rounded-xl transition-all duration-300 group border border-[var(--bg-400)] hover:border-[var(--primary-100)]"
                >
                  <div className="w-10 h-10 bg-[var(--primary-100)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--primary-100)]/30 transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 text-[var(--primary-100)]" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[var(--text-200)] group-hover:text-[var(--primary-100)] transition-colors font-medium">{t('github')}</span>
                  <svg className="w-4 h-4 ml-auto text-[var(--text-300)] group-hover:text-[var(--primary-100)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 页脚 */}
      <Footer lang={lang} />
    </div>
  );
}