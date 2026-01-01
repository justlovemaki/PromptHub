import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslation } from '@/i18n'
import { getTruePathFromHeaders } from '@/lib/utils'
import { FALLBACK_DEFAULT_CONFIG } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const { t } = await getTranslation(lang, 'common')
  const truePath = await getTruePathFromHeaders(await headers(), lang)
  
  // 使用 BETTER_AUTH_URL 作为基础URL，如果未设置则使用默认值
  const baseUrl = process.env.BETTER_AUTH_URL?.replace(/\/$/, '') || FALLBACK_DEFAULT_CONFIG.AUTH_BASE_URL
  const canonicalUrl = `${baseUrl}${truePath}/pricing`
  
  return {
    title: t('pricingPageTitle'),
    description: t('pricingPageDescription'),
    alternates: {
      canonical: canonicalUrl
    }
  }
}

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  return <>{children}</>
}