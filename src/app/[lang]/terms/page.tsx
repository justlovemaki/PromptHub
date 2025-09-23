'use client';

import ParticlesBackground from '@/components/landing/ParticlesBackground';
import TopNavbar from '@/components/layout/TopNavbar';
import { useTranslation } from '@/i18n/client';

export default function Terms({ params }: { params: { lang: string } }) {
  const { t } = useTranslation(params.lang, 'terms');

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
              <h2 className="text-2xl font-semibold mb-4 text-purple-300">
                {t('welcomeMessage')}
              </h2>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section1.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section1.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section2.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section2.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section3.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section3.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section4.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section4.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section5.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section5.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section6.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section6.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section7.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section7.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section8.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section8.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section9.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section9.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section10.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section10.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section11.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section11.content')}
              </p>
              
              <h3 className="text-xl font-medium mb-3 text-blue-300 mt-8">
                {t('section12.title')}
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                {t('section12.content')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}