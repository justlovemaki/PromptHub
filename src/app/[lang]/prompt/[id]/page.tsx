import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import PromptDetailClient from './PromptDetailClient'
import { getSEOSettingsForLang } from '@/lib/services/settings/seo-settings-service'
import { FALLBACK_DEFAULT_CONFIG } from "@/lib/constants"
import { languages } from '@/i18n'

interface Prompt {
  id: string
  title: string
  content: string
  description: string | null
  tags: string[]
  imageUrls?: string[]
  isPublic: boolean
  useCount: number
  author?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  spaceId: string
}

// 获取提示词数据
async function getPromptData(id: string): Promise<Prompt | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    const response = await fetch(`${baseUrl}/api/prompts/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    if (result.success && result.data) {
      return result.data
    }

    return null
  } catch (error) {
    console.error('Failed to fetch prompt:', error)
    return null
  }
}

// 生成元数据用于SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}): Promise<Metadata> {
  const { lang, id } = await params
  const prompt = await getPromptData(id)

  if (!prompt) {
    return {
      title: 'Prompt Not Found',
      description: 'The requested prompt could not be found.',
    }
  }

  const title = `${prompt.title} - AI Prompt`
  const description = prompt.description || prompt.content.substring(0, 160)
  // 获取当前语言的 SEO 设置
  const seoSettings = await getSEOSettingsForLang(lang)
  const siteUrl = seoSettings.siteUrl || process.env.BETTER_AUTH_URL?.replace(/\/$/, '') || FALLBACK_DEFAULT_CONFIG.AUTH_BASE_URL
  
  // 获取真实路径用于 canonical URL
  const headersList = await headers()
  const proxyPathname = headersList.get('proxy-pathname') || `/${lang}/prompt/${id}`
  const url = `${siteUrl}${proxyPathname}`

  // 获取第一张图片作为OG图片
  const ogImage = prompt.imageUrls && prompt.imageUrls.length > 0
    ? prompt.imageUrls[0]
    : `${siteUrl}/logo.png`

  return {
    title,
    description,
    // keywords: prompt.tags.join(', '),
    // authors: [{ name: prompt.author || 'AI Prompt Manager' }],
    openGraph: {
      title,
      description,
      url,
      siteName: 'AI Prompt Manager',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: prompt.title,
        },
      ],
      locale: lang,
      type: 'article',
      publishedTime: prompt.createdAt,
      modifiedTime: prompt.updatedAt,
      tags: prompt.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        languages.map(lng => [lng, `${siteUrl}/${lng}/prompt/${id}`])
      ),
    },
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
  }
}

// 生成结构化数据
async function generateStructuredData(prompt: Prompt, lang: string) {
  const seoSettings = await getSEOSettingsForLang(lang)
  const siteUrl = seoSettings.siteUrl || process.env.BETTER_AUTH_URL?.replace(/\/$/, '') || FALLBACK_DEFAULT_CONFIG.AUTH_BASE_URL
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: prompt.title,
    description: prompt.description || prompt.content.substring(0, 160),
    image: prompt.imageUrls && prompt.imageUrls.length > 0 
      ? prompt.imageUrls
      : [`${siteUrl}/logo.png`],
    datePublished: prompt.createdAt,
    dateModified: prompt.updatedAt,
    author: {
      '@type': 'Person',
      name: 'AI Prompt Manager',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Prompt Manager',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/${lang}/prompt/${prompt.id}`,
    },
    keywords: prompt.tags.join(', '),
    articleBody: prompt.content,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/UseAction',
      userInteractionCount: prompt.useCount,
    },
  }
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  const prompt = await getPromptData(id)

  if (!prompt) {
    notFound()
  }

  const structuredData = await generateStructuredData(prompt, lang)

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* 客户端组件 */}
      <PromptDetailClient prompt={prompt} lang={lang} />
    </>
  )
}