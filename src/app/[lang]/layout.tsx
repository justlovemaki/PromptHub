import '../globals.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers';
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { ApiProvider } from '../../components/ApiProvider'
import { ToastProvider } from '../../components/ToastProvider'
import { getTranslation, languages } from '../../i18n'
import { getTruePathFromHeaders } from '../../lib/utils';
import { FALLBACK_DEFAULT_CONFIG, UMAMI_WEBSITE_ID } from "../../lib/constants";

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata({ params }: { params: { lang: string } }) {
  const { t } = await getTranslation(params.lang, 'layout')
  const truePath = await getTruePathFromHeaders(await headers(), params.lang, true);
  
  // 使用 BETTER_AUTH_URL 作为基础URL，如果未设置则使用默认值
  const baseUrl = process.env.BETTER_AUTH_URL?.replace(/\/$/, '') || FALLBACK_DEFAULT_CONFIG.AUTH_BASE_URL
  const canonicalUrl = `${baseUrl}${truePath}`

  return {
    title: t('title'),
    description: t('description'),
    authors: [{ name: 'PodcastHub Team' }],
    icons: {
      icon: '/logo.ico',
      apple: '/logo.ico',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
    },
    alternates: {
      canonical: `${canonicalUrl}`,
      languages: {
        ...languages.reduce((acc: Record<string, string>, l) => {
          acc[l] = `${baseUrl}/${l}${truePath.replace(/^\/[^\/]+/, '')}`;
          return acc;
        }, {}),
        'x-default': `${baseUrl}/en${truePath.replace(/^\/[^\/]+/, '')}`,
      },
    },
  }
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  return (
    <html lang={params.lang}>
      <body className={inter.className}>
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