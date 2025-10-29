'use client';

import ParticlesBackground from '@/components/landing/ParticlesBackground';
import TopNavbar from '@/components/layout/TopNavbar';
import { useTranslation } from '@/i18n/client';
import { useEffect, useState } from 'react';

export default function Download({ params }: { params: { lang: string } }) {
  const { t } = useTranslation(params.lang, 'download');
  const [currentDomain, setCurrentDomain] = useState('');
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    setCurrentDomain(window.location.origin);
    // 从环境变量获取应用版本号
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    setAppVersion(version);
  }, []);

  return (
    <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white min-h-screen overflow-x-hidden">
      {/* 动态粒子背景 */}
      <ParticlesBackground />

      {/* 顶部导航栏 */}
      <TopNavbar lang={params.lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>

          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-gray-700 shadow-xl">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                {t('description')}
              </p>

              {/* 平台下载链接 */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-purple-300 border-b border-gray-600 pb-2">
                  {t('platformDownloadsTitle')}
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Windows */}
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 hover:border-purple-500 transition-all flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg font-bold">W</span>
                      </div>
                      <h3 className="text-xl font-semibold">Windows</h3>
                    </div>
                    <p className="text-gray-300 mb-4 flex-grow">{t('windowsDescription')}</p>
                    <div className="mt-auto flex justify-center">
                      <a
                        href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop.Setup.${appVersion}.exe
`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        {t('downloadButton')}
                      </a>
                    </div>
                  </div>

                  {/* Mac */}
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 hover:border-purple-500 transition-all flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg font-bold">M</span>
                      </div>
                      <h3 className="text-xl font-semibold">Mac</h3>
                    </div>
                    <p className="text-gray-300 mb-4 flex-grow">{t('macDescription')}</p>
                    <div className="mt-auto flex justify-center">
                      <a
                        href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop-${appVersion}.dmg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        {t('downloadButton')}
                      </a>
                    </div>
                  </div>

                  {/* Linux */}
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 hover:border-purple-500 transition-all flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg font-bold">L</span>
                      </div>
                      <h3 className="text-xl font-semibold">Linux</h3>
                    </div>
                    <p className="text-gray-300 mb-4 flex-grow">{t('linuxDescription')}</p>
                    <div className="mt-auto flex justify-center">
                      <a
                        href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop-${appVersion}.AppImage`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        {t('downloadButton')}
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Chrome扩展 */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-purple-300 border-b border-gray-600 pb-2">
                  {t('chromeExtensionTitle')}
                </h2>

                <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-xl font-bold">C</span>
                    </div>
                    <h3 className="text-xl font-semibold">{t('chromeExtensionName')}</h3>
                  </div>
                  <p className="text-gray-300 mb-4 flex-grow">{t('chromeExtensionDescription')}</p>
                  <div className="mt-auto flex justify-center">
                    <a
                      href={t('chromeExtensionUrl')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      {t('installChromeExtensionButton')}
                    </a>
                  </div>
                </div>
              </section>

              {/* MCP使用示例 */}
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-purple-300 border-b border-gray-600 pb-2">
                  {t('mcpExamplesTitle')}
                </h2>

                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-600 font-mono text-sm">
                  <div className="mb-4">
                    <div className="text-gray-300 mb-2">{t('mcpExampleConfig')}</div>
                    <pre className="text-gray-200 bg-gray-800/50 p-4 rounded-lg overflow-x-auto whitespace-pre">
                      <code>{`"prompt-server": {
  "type": "streamable-http",
  "url": "${currentDomain || 'https://your-domain.com'}/api/mcp",
  "headers": {
    "Authorization": "Bearer 后台获取的Token"
  }
}`}</code>
                    </pre>
                  </div>

                  <div className="text-gray-400 text-sm">
                    {t('mcpDocumentationNote')}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}