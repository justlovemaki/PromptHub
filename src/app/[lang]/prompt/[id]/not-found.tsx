'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/client'
import { getTruePathFromPathname } from '@/lib/utils'

export default function NotFound() {
  const params = useParams()
  const pathname = usePathname()
  const lang = params?.lang as string || 'zh-CN'
  const { t } = useTranslation(lang, 'prompt')
  const truePath = getTruePathFromPathname(pathname, lang)

  return (
    <div className="min-h-screen bg-[var(--bg-100)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--primary-100)] mb-4">
          {t('notFound.title')}
        </h1>
        <h2 className="text-2xl font-semibold text-[var(--text-100)] mb-4">
          {t('notFound.heading')}
        </h2>
        <p className="text-[var(--text-200)] mb-8">
          {t('notFound.message')}
        </p>
        <Link
          href={`${truePath}/explore`}
          className="inline-block px-6 py-3 bg-[var(--primary-100)] hover:bg-[var(--primary-200)] text-white rounded-lg transition-colors"
        >
          {t('notFound.backToExplore')}
        </Link>
      </div>
    </div>
  )
}