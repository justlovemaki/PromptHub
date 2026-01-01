'use client'

import { useState } from 'react'
import { Copy, Check, X, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/i18n/client'
import { useTags } from '@/hooks/useTags'
import ParticlesBackground from '@/components/landing/ParticlesBackground'
import TopNavbar from '@/components/layout/TopNavbar'
import Footer from '@/components/layout/Footer'
import { usePathname } from 'next/navigation'
import { getTruePathFromPathname } from '@/lib/utils'

interface Prompt {
  id: string
  title: string
  content: string
  description: string | null
  tags: string[]
  imageUrls?: string[]
  isPublic: boolean
  useCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
  spaceId: string
}

interface PromptDetailClientProps {
  prompt: Prompt
  lang: string
}

export default function PromptDetailClient({ prompt, lang }: PromptDetailClientProps) {
  const { t } = useTranslation(lang, 'explore')
  const { allTags } = useTags(lang)
  const pathname = usePathname()
  const truePath = getTruePathFromPathname(pathname, lang)
  
  const [copied, setCopied] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 格式化时间到分钟
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  }

  // 获取标签名称
  const getName = (key: string) => {
    const tag = allTags.find(t => t.key === key)
    return tag?.name || key
  }

  // 复制提示词内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const validImages = prompt.imageUrls?.filter((url: string) => url && url.trim()) || []

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col">
      {/* 星星点点动态背景 */}
      <ParticlesBackground />
      
      <TopNavbar lang={lang} />
      
      <main className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1">
        {/* 返回按钮 */}
        <div className="mb-6">
          <a
            href={`${truePath}/explore`}
            className="inline-flex items-center gap-2 text-[var(--text-200)] hover:text-[var(--primary-100)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToExplore') || '返回探索'}</span>
          </a>
        </div>

        {/* 主内容区域 */}
        <article className="bg-[var(--bg-200)] backdrop-blur-lg rounded-2xl border border-[var(--bg-300)] shadow-xl overflow-hidden">
          {/* 头部 */}
          <header className="p-6 md:p-8 border-b border-[var(--bg-300)]">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-100)] mb-4">
                  {prompt.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-300)]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDateTime(prompt.updatedAt)}</span>
                  </div>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-3">
                {validImages.length > 0 && (
                  <button
                    onClick={() => {
                      setCurrentImageIndex(0)
                      setShowImageViewer(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{validImages.length} {t('images') || '张图片'}</span>
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--primary-100)] hover:bg-[var(--primary-200)] text-white rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>{t('copied') || '已复制'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>{t('copyPrompt') || '复制提示词'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* 内容区域 */}
          <div className="p-6 md:p-8">
            {/* 描述 */}
            {prompt.description && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-[var(--text-200)] mb-3">
                  {t('description') || '描述'}
                </h2>
                <p className="text-[var(--text-100)] text-base leading-relaxed">
                  {prompt.description}
                </p>
              </section>
            )}

            {/* 标签 */}
            {prompt.tags && prompt.tags.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-[var(--text-200)] mb-3">
                  {t('tags') || '标签'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 text-sm bg-[var(--primary-100)]/20 text-[var(--primary-100)] rounded-full border border-[var(--primary-100)]/30"
                    >
                      {getName(tag)}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 提示词内容 */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--text-200)] mb-3">
                {t('content') || '提示词内容'}
              </h2>
              <div className="bg-[var(--bg-300)] rounded-xl p-6 border border-[var(--bg-400)]">
                <pre className="text-[var(--text-100)] text-sm leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                  {prompt.content}
                </pre>
              </div>
            </section>
          </div>
        </article>
      </main>

      {/* 图片查看器模态框 */}
      {showImageViewer && validImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* 图片计数 */}
            <div className="absolute top-4 left-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white z-10">
              {currentImageIndex + 1} / {validImages.length}
            </div>

            {/* 左箭头 */}
            {validImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
                }}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 图片 */}
            <div
              className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={validImages[currentImageIndex]}
                alt={`${prompt.title} - Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>

            {/* 右箭头 */}
            {validImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
                }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* 键盘提示 */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white text-sm">
                使用 ← → 键切换图片，ESC 键关闭
              </div>
            )}
          </div>
        </div>
      )}

      {/* 页脚 */}
      <Footer lang={lang} />
    </div>
  )
}