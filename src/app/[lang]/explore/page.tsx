'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { Sparkles, Search, Copy, Check, Globe, X, LayoutGrid, List } from 'lucide-react'
import { useTranslation } from '@/i18n/client'
import { useTags } from '@/hooks/useTags'
import ParticlesBackground from '@/components/landing/ParticlesBackground'
import TopNavbar from '@/components/layout/TopNavbar'
import Footer from '@/components/layout/Footer'

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

interface PromptListResponse {
  prompts: Prompt[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ExplorePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const { t } = useTranslation(lang, 'explore')
  const { allTags } = useTags(lang)
  
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'updatedAt' | 'useCount' | 'createdAt'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'list' | 'image'>('list')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

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

  // Create a lookup map for faster name retrieval
  const keyToNameMap = useMemo(() => new Map(allTags.map(t => [t.key, t.name])), [allTags])
  const getName = (key: string) => keyToNameMap.get(key) || key

  // 获取公开提示词
  const fetchPublicPrompts = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })
      
      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }
      if (selectedTag) {
        queryParams.append('tag', selectedTag)
      }

      const response = await fetch(`/api/prompts/public?${queryParams.toString()}`, {
        headers: {
          'Accept-Language': lang
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const data = result.data as PromptListResponse
          setPrompts(data.prompts || [])
          setPagination(prev => ({
            ...prev,
            total: data.total,
            totalPages: data.totalPages
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch public prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和搜索/筛选变化时获取数据
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPublicPrompts()
    }, 300)
    
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, selectedTag, sortBy, sortOrder, pagination.page])

  // 键盘事件处理 - 图片查看器
  useEffect(() => {
    if (!showImageViewer) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowImageViewer(false)
      } else if (e.key === 'ArrowLeft' && viewerImages.length > 1) {
        setCurrentImageIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight' && viewerImages.length > 1) {
        setCurrentImageIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showImageViewer, viewerImages.length])

  // 复制提示词内容
  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopiedId(prompt.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 获取所有标签的 key 列表（用于筛选显示）
  const allTagKeys = useMemo(() => {
    return allTags.map(tag => tag.key)
  }, [allTags])

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col">
      {/* 星星点点动态背景 */}
      <ParticlesBackground />
      
      <TopNavbar lang={lang} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <Globe className="w-10 h-10 text-[var(--primary-100)]" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] bg-clip-text text-transparent">
                {t('pageTitle')}
              </h1>
            </div>
            {!loading && pagination.total > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--primary-100)]/10 to-[var(--secondary-400)]/10 border border-[var(--primary-100)]/30 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-[var(--primary-100)]" />
                <span className="text-sm font-medium text-[var(--text-200)]">
                  {t('totalPrompts')}
                  <span className="mx-1 text-lg font-bold text-[var(--primary-100)]">
                    {pagination.total}
                  </span>
                  {t('totalPromptsUnit')}
                </span>
              </div>
            )}
          </div>
          <p className="text-[var(--text-200)] text-lg max-w-2xl mx-auto">
            {t('pageDescription')}
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-[var(--bg-200)] backdrop-blur-lg rounded-2xl p-6 mb-8 border border-[var(--bg-300)] shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-300)]" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="w-full pl-10 pr-4 py-3 bg-[var(--bg-300)] border border-[var(--bg-400)] rounded-lg text-[var(--text-100)] placeholder-[var(--text-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)] focus:border-transparent"
              />
            </div>
            {/* 排序选择 */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-4 py-3 bg-[var(--bg-300)] border border-[var(--bg-400)] rounded-lg text-[var(--text-100)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)]"
            >
              <option value="desc">{t('sortOrder.desc')}</option>
              <option value="asc">{t('sortOrder.asc')}</option>
            </select>

            {/* 视图模式切换 */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--primary-100)] text-white'
                    : 'bg-[var(--bg-300)] text-[var(--text-200)] hover:bg-[var(--bg-400)]'
                }`}
                title={t('viewMode.list')}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('image')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'image'
                    ? 'bg-[var(--primary-100)] text-white'
                    : 'bg-[var(--bg-300)] text-[var(--text-200)] hover:bg-[var(--bg-400)]'
                }`}
                title={t('viewMode.image')}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          
          </div>

          {/* 标签筛选 */}
          {allTagKeys.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[var(--text-200)] text-sm">{t('filterByTag')}:</span>
                <button
                  onClick={() => {
                    setSelectedTag(null)
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTag === null
                      ? 'bg-[var(--primary-100)] text-white'
                      : 'bg-[var(--bg-300)] text-[var(--text-200)] hover:bg-[var(--bg-400)]'
                  }`}
                >
                  {t('allTags')}
                </button>
                {allTagKeys.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(selectedTag === tag ? null : tag)
                      setPagination(prev => ({ ...prev, page: 1 }))
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTag === tag
                        ? 'bg-[var(--primary-100)] text-white'
                        : 'bg-[var(--bg-300)] text-[var(--text-200)] hover:bg-[var(--bg-400)]'
                    }`}
                  >
                    {getName(tag)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 提示词列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-100)]"></div>
            <span className="ml-4 text-[var(--text-200)]">{t('loading')}</span>
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-[var(--text-300)] mx-auto mb-4" />
            <p className="text-[var(--text-200)] text-lg">
              {searchQuery || selectedTag ? t('noPromptsFound') : t('noPromptsYet')}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {prompts.map((prompt) => {
                const hasImages = Array.isArray(prompt.imageUrls) && prompt.imageUrls.filter((url: string) => url && url.trim()).length > 0
                const firstImage = hasImages ? prompt.imageUrls!.filter((url: string) => url && url.trim())[0] : null
                
                return (
                <div
                  key={prompt.id}
                  className="bg-[var(--bg-200)] backdrop-blur-lg rounded-xl border border-[var(--bg-300)] hover:border-[var(--primary-100)]/50 transition-all duration-300 overflow-hidden group shadow-lg relative flex flex-col cursor-pointer"
                  onClick={() => setSelectedPrompt(prompt)}
                >

                  {/* 图片模式：显示图片区域 */}
                  {viewMode === 'image' && (
                    <div className="w-full h-48 bg-[var(--bg-300)] flex items-center justify-center overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={prompt.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="flex flex-col items-center justify-center text-[var(--text-300)] gap-2"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span class="text-sm">${t('noImage')}</span></div>`
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--text-300)] gap-2">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">{t('noImage')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    {/* 顶部信息栏：时间、图片标识和复制按钮 */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="text-xs text-[var(--text-300)]">
                        {formatDateTime(prompt.updatedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.isArray(prompt.imageUrls) && prompt.imageUrls.filter((url: string) => url && url.trim()).length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const validImages = prompt.imageUrls!.filter((url: string) => url && url.trim())
                              setViewerImages(validImages)
                              setCurrentImageIndex(0)
                              setShowImageViewer(true)
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                            title={t('hasImages')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(prompt)
                          }}
                          className="p-1.5 hover:bg-[var(--bg-300)] rounded-lg transition-colors"
                          title={copiedId === prompt.id ? t('copied') : t('copyPrompt')}
                        >
                          {copiedId === prompt.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-[var(--text-300)] hover:text-[var(--primary-100)]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="flex-1">
                      {/* 标题 */}
                      <h3 className="text-base font-semibold text-[var(--text-100)] mb-2 truncate group-hover:text-[var(--primary-100)] transition-colors">
                        {prompt.title}
                      </h3>
                      
                      {/* 描述 */}
                      <p className="text-[var(--text-200)] text-xs mb-3 line-clamp-2 h-8">
                        {prompt.description || t('noDescription')}
                      </p>
                      
                      {/* 内容预览 */}
                      <div className="bg-[var(--bg-300)] rounded-lg p-2 mb-3 max-h-20 overflow-hidden">
                        <p className="text-[var(--text-200)] text-xs line-clamp-3 whitespace-pre-wrap">
                          {prompt.content}
                        </p>
                      </div>
                      
                      {/* 标签 */}
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {prompt.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs bg-[var(--primary-100)]/20 text-[var(--primary-100)] rounded"
                            >
                              {getName(tag)}
                            </span>
                          ))}
                          {prompt.tags.length > 2 && (
                            <span className="px-2 py-0.5 text-xs text-[var(--text-300)]">
                              +{prompt.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-[var(--bg-300)] text-[var(--text-100)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-400)] transition-colors"
                >
                  ←
                </button>
                <span className="text-[var(--text-200)] px-4">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-[var(--bg-300)] text-[var(--text-100)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-400)] transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 提示词详情模态框 */}
      {selectedPrompt && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className="bg-[var(--bg-200)] rounded-2xl border border-[var(--bg-300)] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-start justify-between p-6 border-b border-[var(--bg-300)]">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-[var(--text-100)] flex-1">
                    {selectedPrompt.title}
                  </h2>
                  {Array.isArray(selectedPrompt.imageUrls) && selectedPrompt.imageUrls.filter((url: string) => url && url.trim()).length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const validImages = selectedPrompt.imageUrls!.filter((url: string) => url && url.trim())
                        setViewerImages(validImages)
                        setCurrentImageIndex(0)
                        setShowImageViewer(true)
                      }}
                      className="inline-flex items-center px-2 py-1 text-sm bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                      title={t('hasImages')}
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('imagesCount', { count: selectedPrompt.imageUrls.filter((url: string) => url && url.trim()).length })}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-300)]">
                  <span>{formatDateTime(selectedPrompt.updatedAt)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="p-2 hover:bg-[var(--bg-300)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-200)]" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* 描述 */}
              {selectedPrompt.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--text-200)] mb-2">
                    {t('description') || '描述'}
                  </h3>
                  <p className="text-[var(--text-100)]">
                    {selectedPrompt.description}
                  </p>
                </div>
              )}

              {/* 标签 */}
              {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--text-200)] mb-2">
                    {t('tags') || '标签'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm bg-[var(--primary-100)]/20 text-[var(--primary-100)] rounded-full"
                      >
                        {getName(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 完整内容 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-200)] mb-2">
                  {t('content') || '内容'}
                </h3>
                <div className="bg-[var(--bg-300)] rounded-lg p-4">
                  <pre className="text-[var(--text-100)] text-sm whitespace-pre-wrap font-mono">
                    {selectedPrompt.content}
                  </pre>
                </div>
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="p-6 border-t border-[var(--bg-300)] flex gap-3">
              <button
                onClick={() => {
                  handleCopy(selectedPrompt)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary-100)] hover:bg-[var(--primary-200)] text-white rounded-lg transition-colors"
              >
                {copiedId === selectedPrompt.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('copyPrompt')}
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedPrompt(null)}
                className="px-6 py-3 bg-[var(--bg-300)] hover:bg-[var(--bg-400)] text-[var(--text-100)] rounded-lg transition-colors"
              >
                {t('close') || '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片查看器模态框 */}
      {showImageViewer && viewerImages.length > 0 && (
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
              {currentImageIndex + 1} / {viewerImages.length}
            </div>

            {/* 左箭头 */}
            {viewerImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))
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
                src={viewerImages[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>

            {/* 右箭头 */}
            {viewerImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))
                }}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* 键盘提示 */}
            {viewerImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white text-sm">
                使用 ← → 键切换图片
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