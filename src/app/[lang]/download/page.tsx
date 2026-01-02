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
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    setAppVersion(version);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col">
      {/* 星点点动态背景 */}
      <ParticlesBackground />

      {/* 顶部导航栏 */}
      <TopNavbar lang={lang} />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex-1">
        <div className="max-w-5xl mx-auto">
          {/* 页面标题区域 */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-[var(--primary-100)] via-[var(--secondary-400)] to-[var(--accent-100)] bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-200)] max-w-2xl mx-auto leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* 桌面应用下载区域 */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-[var(--primary-100)] to-[var(--secondary-400)] rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-100)]">
                {t('platformDownloadsTitle')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Windows 卡片 */}
              <div className="group relative bg-[var(--bg-200)] rounded-2xl p-6 border border-[var(--bg-300)] hover:border-[var(--primary-100)]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--primary-100)]/10 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-100)]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--primary-100)] to-[var(--primary-200)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary-100)]/20">
                      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-100)]">Windows</h3>
                      <span className="text-sm text-[var(--text-300)]">v{appVersion}</span>
                    </div>
                  </div>
                  <p className="text-[var(--text-200)] mb-6 text-sm leading-relaxed">{t('windowsDescription')}</p>
                  <a
                        href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop.Setup.${appVersion}.exe
`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[var(--primary-100)] to-[var(--primary-200)] hover:from-[var(--primary-200)] hover:to-[var(--secondary-400)] text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg shadow-[var(--primary-100)]/20 hover:shadow-[var(--primary-100)]/40"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('downloadButton')}
                  </a>
                </div>
              </div>

              {/* Mac 卡片 */}
              <div className="group relative bg-[var(--bg-200)] rounded-2xl p-6 border border-[var(--bg-300)] hover:border-[var(--secondary-400)]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--secondary-400)]/10 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--secondary-400)]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--secondary-400)] to-[var(--accent-100)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--secondary-400)]/20">
                      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-100)]">macOS</h3>
                      <span className="text-sm text-[var(--text-300)]">v{appVersion}</span>
                    </div>
                  </div>
                  <p className="text-[var(--text-200)] mb-6 text-sm leading-relaxed">{t('macDescription')}</p>
                  <a
                    href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop-${appVersion}.dmg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[var(--secondary-400)] to-[var(--accent-100)] hover:from-[var(--accent-100)] hover:to-[var(--secondary-400)] text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg shadow-[var(--secondary-400)]/20 hover:shadow-[var(--secondary-400)]/40"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('downloadButton')}
                  </a>
                </div>
              </div>

              {/* Linux 卡片 */}
              <div className="group relative bg-[var(--bg-200)] rounded-2xl p-6 border border-[var(--bg-300)] hover:border-[var(--accent-100)]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--accent-100)]/10 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-100)]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent-100)] to-[var(--accent-200)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent-100)]/20">
                      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.93 0 3.68.69 5.05 1.83L12 9.17V4zm-6.05 1.83C7.32 4.69 9.07 4 11 4v5.17L5.95 5.83zM4 12c0-1.93.69-3.68 1.83-5.05L11 12l-5.17 5.05C4.69 15.68 4 13.93 4 12zm1.95 6.17L11 12.83V20c-1.93 0-3.68-.69-5.05-1.83zM12 20v-7.17l5.05 3.34C15.68 17.31 13.93 18 12 18v2zm6.05-1.83L13 14.83V20c1.93 0 3.68-.69 5.05-1.83zM20 12c0 1.93-.69 3.68-1.83 5.05L13 12l5.17-5.05C19.31 8.32 20 10.07 20 12zm-1.95-6.17L13 9.17V4c1.93 0 3.68.69 5.05 1.83z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-100)]">Linux</h3>
                      <span className="text-sm text-[var(--text-300)]">v{appVersion}</span>
                    </div>
                  </div>
                  <p className="text-[var(--text-200)] mb-6 text-sm leading-relaxed">{t('linuxDescription')}</p>
                  <a
                    href={t('downloadUrl') + `${appVersion}/ai-prompt-hub-desktop-PromptHub.Desktop-${appVersion}.AppImage`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[var(--accent-100)] to-[var(--accent-200)] hover:from-[var(--accent-200)] hover:to-[var(--accent-100)] text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg shadow-[var(--accent-100)]/20 hover:shadow-[var(--accent-100)]/40"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('downloadButton')}
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Chrome 扩展区域 */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-[var(--secondary-400)] to-[var(--accent-100)] rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-100)]">
                {t('chromeExtensionTitle')}
              </h2>
            </div>

            <div className="group relative bg-[var(--bg-200)] rounded-2xl p-8 border border-[var(--bg-300)] hover:border-[var(--primary-100)]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--primary-100)]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-100)]/5 via-[var(--secondary-400)]/5 to-[var(--accent-100)]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary-100)] via-[var(--secondary-400)] to-[var(--accent-100)] rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--primary-100)]/20 flex-shrink-0">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.229-9.006zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728z" />
                  </svg>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-[var(--text-100)] mb-2">{t('chromeExtensionName')}</h3>
                  <p className="text-[var(--text-200)] leading-relaxed">{t('chromeExtensionDescription')}</p>
                </div>
                <a
                  href={t('chromeExtensionUrl')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary-100)] via-[var(--secondary-400)] to-[var(--accent-100)] hover:from-[var(--accent-100)] hover:via-[var(--secondary-400)] hover:to-[var(--primary-100)] text-white px-8 py-4 rounded-xl transition-all duration-500 font-medium shadow-xl shadow-[var(--primary-100)]/20 hover:shadow-[var(--secondary-400)]/40 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('installChromeExtensionButton')}
                </a>
              </div>
            </div>
          </section>

          {/* MCP 配置示例区域 */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-[var(--accent-100)] to-[var(--primary-100)] rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-100)]">
                {t('mcpExamplesTitle')}
              </h2>
            </div>

            <div className="bg-[var(--bg-200)] rounded-2xl border border-[var(--bg-300)] overflow-hidden">
              <div className="bg-[var(--bg-300)] px-6 py-4 border-b border-[var(--bg-400)]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--error-500)]/60"></div>
                    <div className="w-3 h-3 rounded-full bg-[var(--warning-500)]/60"></div>
                    <div className="w-3 h-3 rounded-full bg-[var(--success-500)]/60"></div>
                  </div>
                  <span className="text-sm text-[var(--text-200)] font-medium">{t('mcpExampleConfig')}</span>
                </div>
              </div>
              <div className="p-6">
                <pre className="text-sm text-[var(--text-100)] bg-[var(--bg-300)] p-6 rounded-xl overflow-x-auto font-mono leading-relaxed">
                  <code>{`"prompt-server": {
  "type": "streamable-http",
  "url": "${currentDomain || 'https://your-domain.com'}/api/mcp",
  "headers": {
    "Authorization": "Bearer 后台获取的Token"
  }
}`}</code>
                </pre>
                <p className="mt-4 text-sm text-[var(--text-200)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--info-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('mcpDocumentationNote')}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 页脚 */}
      <Footer lang={lang} />
    </div>
  );
}