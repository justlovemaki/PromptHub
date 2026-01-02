import '../globals.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers';
import Script from 'next/script'
import { ApiProvider } from '../../components/ApiProvider'
import { ToastProvider } from '../../components/ToastProvider'
import { languages } from '../../i18n'
import { getSEOSettingsForLang } from '../../lib/services/settings/seo-settings-service';
import { FALLBACK_DEFAULT_CONFIG, UMAMI_WEBSITE_ID } from "../../lib/constants";

// 使用系统字体栈作为备选
const systemFont = {
  className: 'font-sans',
  style: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: langParam } = await params
  const lang = langParam || 'en'
  
  // 获取当前语言的 SEO 设置
  const seoSettings = await getSEOSettingsForLang(lang)
  
  // 获取真实路径用于 canonical URL
  const headersList = await headers()
  const proxyPathname = headersList.get('proxy-pathname') || ''

  // SEO 基础配置（使用多语言设置）
  const siteTitle = seoSettings.siteTitle
  const siteName = seoSettings.siteName
  const siteDescription = seoSettings.siteDescription
  const siteKeywords = seoSettings.siteKeywords
  const siteUrl = seoSettings.siteUrl || process.env.BETTER_AUTH_URL?.replace(/\/$/, '') || FALLBACK_DEFAULT_CONFIG.AUTH_BASE_URL
  const ogImage = seoSettings.ogImage
  const twitterHandle = seoSettings.twitterHandle
  const twitterCard = (seoSettings.twitterCard as 'summary' | 'summary_large_image' | 'app' | 'player')

  // 构建完整的 OG 图片 URL
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  // 构建 canonical URL（包含实际路径）
  const canonicalUrl = `${siteUrl}${proxyPathname}`
  
  // 生成多语言 alternates（包含实际路径）
  const alternateLanguages: Record<string, string> = {}
  // 检查路径是否以语言前缀开头，如果是则移除
  const hasLangPrefix = languages.some(lng =>
    proxyPathname === `/${lng}` || proxyPathname.startsWith(`/${lng}/`)
  )
  const pathWithoutLang = hasLangPrefix
    ? proxyPathname.replace(/^\/[^\/]+/, '') // 移除语言前缀
    : proxyPathname // 没有语言前缀，保持原样
  languages.forEach(lng => {
    alternateLanguages[lng] = `${siteUrl}/${lng}${pathWithoutLang}`
  })
  // 添加 x-default（不带语言前缀，与 admin layout 保持一致）
  alternateLanguages['x-default'] = `${siteUrl}${pathWithoutLang}`

  return {
    // 基础 Meta 标签
    title: {
      template: `%s - ${siteName}`,
      default: siteTitle,
    },
    description: siteDescription,
    // keywords: siteKeywords,
    
    // 作者和版权信息
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    
    // 格式检测
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    // 图标配置
    icons: {
      icon: '/logo.ico',
      apple: '/logo.ico',
    },

    // Open Graph 标签
    openGraph: {
      type: 'website',
      locale: lang,
      url: canonicalUrl,
      siteName: siteName,
      title: siteName,
      description: siteDescription,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },

    // Twitter Card 标签
    twitter: {
      card: twitterCard,
      site: twitterHandle,
      creator: twitterHandle,
      title: siteName,
      description: siteDescription,
      images: [ogImageUrl],
    },

    // 多语言支持
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },

    // Robots 配置
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // 验证标签 (可选,可通过环境变量配置)
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },

    // 其他 Meta 标签
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    
    // 应用相关
    applicationName: siteName,
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return (
    <html lang={lang}>
      <body className="font-sans" style={systemFont.style}>
        {UMAMI_WEBSITE_ID && (
          <Script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={UMAMI_WEBSITE_ID}
          />
        )}
        <ToastProvider>
          <ApiProvider>
            {children}
          </ApiProvider>
        </ToastProvider>
      </body>
    </html>
  )
}