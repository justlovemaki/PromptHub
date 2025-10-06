'use client';

import ParticlesBackground from '@/components/landing/ParticlesBackground';
import TopNavbar from '@/components/layout/TopNavbar';
import { useTranslation } from '@/i18n/client';

export default function Contact({ params }: { params: { lang: string } }) {
  const { t } = useTranslation(params.lang, 'contact');

  return (
    <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white min-h-screen overflow-x-hidden">
      {/* 动态粒子背景 */}
      <ParticlesBackground />
      
      {/* 顶部导航栏 */}
      <TopNavbar lang={params.lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-gray-700 shadow-xl">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                {t('description')}
              </p>
              
              <div className="grid md:grid-cols-1 gap-6 mb-8">
                <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                  <h3 className="text-xl font-semibold mb-4 text-purple-300">
                    {t('emailLabel')}
                  </h3>
                  <p className="text-gray-300">
                    {t('email')}
                  </p>
                </div>
              
              </div>
              
              <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                <h3 className="text-xl font-semibold mb-4 text-purple-300">
                  {t('socialMediaTitle')}
                </h3>
                <p className="text-gray-300 mb-4">
                  {t('socialMediaDescription')}
                </p>
                <ul className="space-y-2">
                  <li>
                    <a href="https://x.com/justlikemaki" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      {t('twitter')}
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/justlovemaki" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      {t('github')}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}