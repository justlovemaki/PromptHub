'use client';

import ParticlesBackground from '@/components/landing/ParticlesBackground';
import Footer from '@/components/layout/Footer';
import TopNavbar from '@/components/layout/TopNavbar';
import { useTranslation } from '@/i18n/client';
import { useEffect, useState, use } from 'react';

export default function Download({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { t } = useTranslation(lang, 'download');
  const [currentDomain, setCurrentDomain] = useState('');
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    setCurrentDomain(window.location.origin);
    // 从环境变量获取应用版本号
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    setAppVersion(version);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col">
      {/* 星星点点动态背景 */}
      <ParticlesBackground />

      {/* 顶部导航栏 */}
      <TopNavbar lang={lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] bg-clip-text text-transparent">
            {t('title')}
          </h1>

          <div className="bg-[var(--bg-200)] backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-[var(--bg-300)] shadow-xl">
            <div className="max-w-none">
              <p className="text-[var(--text-200)] mb-8 text-lg leading-relaxed">
                {t('description')}
              </p>

              {/* 平台下载链接 */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-[var(--primary-100)] border-b border-[var(--bg-400)] pb-2">
                  {t('platformDownloadsTitle')}
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Windows */}
                  <div className="bg-gradient-to-br from-[var(--bg-300)] to-[var(--primary-100)]/5 rounded-xl p-6 border border-[var(--bg-400)] hover:border-[var(--primary-100)] hover:shadow-lg hover:shadow-[var(--primary-100)]/10 transition-all flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-[var(--primary-100)] rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg font-bold">W</span>
                      </div>
                      <h3 className="text-xl font-semibold">Windows</h3>
                    </div>
                    <p className="text-[var(--text-200)] mb-4 flex-grow">{t('windowsDescription')}</p>
                    <div className="mt-auto flex justify-center">
                      <a
                        href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop.Setup.${appVersion}.exe
`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[var(--primary-100)] hover:bg-[var(--primary-200)] text-[var(--bg-100)] px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        {t('downloadButton')}
                      </a>
                    </div>
                  </div>

                  {/* Mac */}
                  <div className="bg-gradient-to-br from-[var(--bg-300)] to-[var(--secondary-400)]/5 rounded-xl p-6 border border-[var(--bg-400)] hover:border-[var(--secondary-400)] hover:shadow-lg hover:shadow-[var(--secondary-400)]/10 transition-all flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-[var(--secondary-400)] rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg font-bold text-[var(--bg-100)]">M</span>
                      </div>
                      <h3 className="text-xl font-semibold">Mac</h3>
                    </div>
                    <p className="text-[var(--text-200)] mb-4 flex-grow">{t('macDescription')}</p>
                    <div className="mt-auto flex justify-center">
                      <a
                        href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop-${appVersion}.dmg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[var(--secondary-400)] hover:bg-[var(--primary-200)] text-[var(--bg-100)] px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        {t('downloadButton')}
                      </a>
                    </div>
                  </div>

                  {/* Linux */}
                  <div className="bg-gradient-to-br from-[var(--bg-300)] to-[var(--accent-100)]/5 rounded-xl p-6 border border-[var(--bg-400)] hover:border-[var(--accent-100)] hover:shadow-lg hover:shadow-[var(--accent-100)]/10 transition-all flex flex-col h-full">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-[var(--accent-100)] rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg font-bold text-[var(--bg-100)]">L</span>
                      </div>
                      <h3 className="text-xl font-semibold">Linux</h3>
                    </div>
                    <p className="text-[var(--text-200)] mb-4 flex-grow">{t('linuxDescription')}</p>
                    <div className="mt-auto flex justify-center">
                      <a
                        href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop-${appVersion}.AppImage`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[var(--accent-100)] hover:bg-[var(--accent-200)] text-[var(--bg-100)] px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        {t('downloadButton')}
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Chrome扩展 */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-[var(--primary-100)] border-b border-[var(--bg-400)] pb-2">
                  {t('chromeExtensionTitle')}
                </h2>

                <div className="bg-gradient-to-br from-[var(--bg-300)] to-[var(--primary-100)]/5 rounded-xl p-6 border border-[var(--bg-400)] hover:border-[var(--primary-200)] hover:shadow-lg hover:shadow-[var(--primary-100)]/10 transition-all flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-100)] to-[var(--secondary-400)] rounded-lg flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-[var(--bg-100)]">C</span>
                    </div>
                    <h3 className="text-xl font-semibold">{t('chromeExtensionName')}</h3>
                  </div>
                  <p className="text-[var(--text-200)] mb-4 flex-grow">{t('chromeExtensionDescription')}</p>
                  <div className="mt-auto flex justify-center">
                    <a
                      href={t('chromeExtensionUrl')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] hover:from-[var(--primary-200)] hover:to-[var(--accent-200)] text-[var(--bg-100)] px-6 py-3 rounded-lg transition-all font-medium"
                    >
                      {t('installChromeExtensionButton')}
                    </a>
                  </div>
                </div>
              </section>

              {/* MCP使用示例 */}
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[var(--primary-100)] border-b border-[var(--bg-400)] pb-2">
                  {t('mcpExamplesTitle')}
                </h2>

                <div className="bg-[var(--bg-400)] rounded-xl p-6 border border-[var(--bg-500)] font-mono text-sm">
                  <div className="mb-4">
                    <div className="text-[var(--text-200)] mb-2">{t('mcpExampleConfig')}</div>
                    <pre className="text-[var(--text-100)] bg-[var(--bg-500)] p-4 rounded-lg overflow-x-auto whitespace-pre">
                      <code>{`"prompt-server": {
  "type": "streamable-http",
  "url": "${currentDomain || 'https://your-domain.com'}/api/mcp",
  "headers": {
    "Authorization": "Bearer 后台获取的Token"
  }
}`}</code>
                    </pre>
                  </div>

                  <div className="text-[var(--text-200)] text-sm">
                    {t('mcpDocumentationNote')}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <Footer lang={lang} />
    </div>
  );
}