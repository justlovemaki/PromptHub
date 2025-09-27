import '../globals.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers';
import { Inter } from 'next/font/google'
import { ApiProvider } from '../../components/ApiProvider'
import { ToastProvider } from '../../components/ToastProvider'
import { getTranslation } from '../../i18n'
import { getTruePathFromHeaders } from '../../lib/utils';
import { FALLBACK_DEFAULT_CONFIG } from "../../lib/constants";

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
      icon: '/logo.png',
      apple: '/logo.png',
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
    alternates: { canonical: canonicalUrl },
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
        <ToastProvider>
          <ApiProvider>
            {children}
          </ApiProvider>
        </ToastProvider>
      </body>
    </html>
  )
}