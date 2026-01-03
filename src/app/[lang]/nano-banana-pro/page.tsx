'use client'

import { useState, useEffect, use, useRef } from 'react'
import { Sparkles, Search, Copy, Check, Heart, X, ChevronLeft, ChevronRight, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/i18n/client'
import { useSession } from '@/lib/auth-client'
import { api } from '@promptmanager/core-logic'
import { usePathname } from 'next/navigation'
import ParticlesBackground from '@/components/landing/ParticlesBackground'
import TopNavbar from '@/components/layout/TopNavbar'
import Footer from '@/components/layout/Footer'
import { trackPromptAction, trackFavorite, trackSearch } from '@/lib/umami'

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

interface PromptListResponse {
  prompts: Prompt[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function NanoBananaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const { t } = useTranslation(lang, 'nanobanana')
  const { data: session } = useSession()
  const pathname = usePathname()
  
  // 获取当前路径并转换为标题格式（首字母大写，连字符转空格）
  const getFormattedPath = () => {
    // 移除语言前缀 (如 /zh-CN, /en, /ja)
    const pathWithoutLang = pathname.replace(/^\/(zh-CN|en|ja)/, '')
    // 移除开头的斜杠
    const cleanPath = pathWithoutLang.replace(/^\//, '')
    // 分割路径（按斜杠）
    const parts = cleanPath.split('/')
    // 处理每个部分：将连字符替换为空格，每个单词首字母大写
    const formatted = parts
      .map(part => {
        // 按连字符分割
        const words = part.split('-')
        // 每个单词首字母大写
        return words
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      })
      .join(' ')
    return formatted || 'Home'
  }
  
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasMore: true
  })

  // Masonry layout state
  const [columns, setColumns] = useState<Prompt[][]>([])
  const containerRef = useRef<HTMLDivElement>(null)

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

  // 获取带图片的提示词
  const fetchPrompts = async (page: number, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true)
      else setLoadingMore(true)

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortOrder: 'desc',
        sortBy: 'updatedAt'
      })
      
      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      const response = await fetch(`/api/prompts/images?${queryParams.toString()}`, {
        headers: {
          'Accept-Language': lang
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const data = result.data as PromptListResponse
          
          if (isLoadMore) {
            // 去重：使用 Map 确保每个 ID 只出现一次
            setPrompts(prev => {
              const existingIds = new Set(prev.map(p => p.id))
              const newPrompts = data.prompts.filter(p => !existingIds.has(p.id))
              return [...prev, ...newPrompts]
            })
          } else {
            setPrompts(data.prompts || [])
          }

          setPagination(prev => ({
            ...prev,
            page: data.page,
            total: data.total,
            totalPages: data.totalPages,
            hasMore: data.page < data.totalPages
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Calculate columns for masonry layout
  useEffect(() => {
    const calculateColumns = () => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.offsetWidth
      let numColumns = 1
      if (containerWidth >= 1280) numColumns = 4
      else if (containerWidth >= 1024) numColumns = 3
      else if (containerWidth >= 640) numColumns = 2

      const newColumns: Prompt[][] = Array.from({ length: numColumns }, () => [])
      
      prompts.forEach((prompt, index) => {
        newColumns[index % numColumns].push(prompt)
      })
      
      setColumns(newColumns)
    }

    calculateColumns()
    window.addEventListener('resize', calculateColumns)
    return () => window.removeEventListener('resize', calculateColumns)
  }, [prompts])

  // Initial fetch and search
  useEffect(() => {
    // Only fetch if search query is empty or user pressed enter (handled separately)
    // But since we want "search after finishing typing", we can use a longer debounce
    const debounceTimer = setTimeout(() => {
      fetchPrompts(1)
    }, 800) // Increased debounce time
    
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Load more on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !pagination.hasMore) return

      if (
        window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - 200
      ) {
        fetchPrompts(pagination.page + 1, true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loading, loadingMore, pagination.hasMore, pagination.page])

  // Check favorites
  useEffect(() => {
    const checkFavorites = async () => {
      if (!session?.user || prompts.length === 0) return
      
      const newPromptIds = prompts
        .filter(p => favorites[p.id] === undefined)
        .map(p => p.id)

      if (newPromptIds.length === 0) return

      try {
        const result = await api.checkFavorites(newPromptIds, lang)
        if (result.success && result.data?.favorites) {
          setFavorites(prev => ({ ...prev, ...result.data.favorites }))
        }
      } catch (error) {
        console.error('Failed to fetch favorite status:', error)
      }
    }

    checkFavorites()
  }, [prompts, session?.user, lang])

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (selectedPrompt || showImageViewer) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedPrompt, showImageViewer])

  // Keyboard events for image viewer
  useEffect(() => {
    if (!showImageViewer) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowImageViewer(false)
      } else if (e.key === 'ArrowLeft' && viewerImages.length > 1) {
        setCurrentImageIndex(prev => (prev === 0 ? viewerImages.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight' && viewerImages.length > 1) {
        setCurrentImageIndex(prev => (prev === viewerImages.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showImageViewer, viewerImages.length])

  // Handlers
  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopiedId(prompt.id)
      trackPromptAction('copy', prompt.id, {
        content_length: prompt.content.length,
        source: 'nanobanana',
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleToggleFavorite = async (promptId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!session?.user) return
    
    setFavoriteLoading(promptId)
    const isFavorited = favorites[promptId]
    
    try {
      if (isFavorited) {
        const result = await api.removeFavorite(promptId, lang)
        if (result.success) {
          setFavorites(prev => ({ ...prev, [promptId]: false }))
          trackFavorite('remove', promptId)
        }
      } else {
        const result = await api.addFavorite(promptId, lang)
        if (result.success) {
          setFavorites(prev => ({ ...prev, [promptId]: true }))
          trackFavorite('add', promptId)
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setFavoriteLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] relative flex flex-col selection:bg-[var(--primary-100)] selection:text-white">
      <ParticlesBackground />
      <TopNavbar lang={lang} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center justify-center mb-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="flex items-center space-x-3 mb-3"
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] bg-clip-text text-transparent pb-1">
                {getFormattedPath()}
              </h1>
            </motion.div>
            
            <AnimatePresence>
              {!loading && pagination.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-200)]/50 border border-[var(--primary-100)]/20 rounded-full backdrop-blur-md shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[var(--primary-100)] animate-pulse" />
                  <span className="text-sm font-medium text-[var(--text-200)]">
                    {t('totalPrompts')}
                    <span className="mx-1 text-lg font-bold text-[var(--primary-100)]">
                      {pagination.total}
                    </span>
                    {t('totalPromptsUnit')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-300)] group-focus-within:text-[var(--primary-100)] transition-colors" />
            <input
              type="text"
              placeholder={t('searchPlaceholder') || 'Search prompts...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchPrompts(1)
                  if (searchQuery.trim()) {
                    trackSearch(searchQuery, pagination.total)
                  }
                }
              }}
              onBlur={() => {
                if (searchQuery.trim()) {
                  trackSearch(searchQuery, pagination.total)
                }
              }}
              className="w-full pl-12 pr-4 py-4 bg-[var(--bg-200)]/60 backdrop-blur-xl border border-white/10 rounded-2xl text-[var(--text-100)] placeholder-[var(--text-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)]/50 transition-all shadow-lg"
            />
          </div>
        </motion.div>

        {/* Waterfall Grid */}
        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-6">
              {column.map((prompt) => {
                const firstImage = prompt.imageUrls?.[0]
                
                return (
                  <motion.div
                    layout
                    key={prompt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative flex flex-col bg-[var(--bg-200)]/40 backdrop-blur-md rounded-3xl border border-white/10 hover:border-[var(--primary-100)]/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[var(--primary-100)]/10"
                  >
                    {/* Image */}
                    <div
                      className="w-full relative overflow-hidden group-hover:shadow-inner min-h-[200px] cursor-pointer"
                      onClick={() => {
                        if (prompt.imageUrls && prompt.imageUrls.length > 0) {
                          setViewerImages(prompt.imageUrls.filter(Boolean))
                          setCurrentImageIndex(0)
                          setShowImageViewer(true)
                        }
                      }}
                    >
                      {firstImage ? (
                        <div className="relative">
                          {/* Placeholder with 3:2 aspect ratio */}
                          <div className="w-full pb-[66.67%] bg-[var(--bg-300)]/30" />
                          <img
                            src={firstImage}
                            alt={prompt.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.classList.remove('absolute', 'inset-0', 'h-full');
                              img.classList.add('relative', 'h-auto');
                              const placeholder = img.previousElementSibling as HTMLElement;
                              if (placeholder) placeholder.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-[3/2] bg-[var(--bg-300)]/30 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-[var(--text-300)] opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Content */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <h3 className="text-base font-bold text-[var(--text-100)] mb-2 line-clamp-2 group-hover:text-[var(--primary-100)] transition-colors">
                        {prompt.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--bg-400)]/10">
                        <div className="flex items-center gap-2">
                          {prompt.author && (
                            <span className="text-xs font-medium text-[var(--text-300)] bg-[var(--primary-100)]/10 px-2 py-0.5 rounded-full text-[var(--primary-100)] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-100)]" />
                              {prompt.author}
                            </span>
                          )}
                            <span className="text-xs text-[var(--text-300)]">
                              {formatDateTime(prompt.updatedAt)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(prompt)
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {copiedId === prompt.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-[var(--text-300)] group-hover:text-[var(--primary-100)]" />
                            )}
                          </button>
                          {session?.user && (
                            <button
                              onClick={(e) => handleToggleFavorite(prompt.id, e)}
                              disabled={favoriteLoading === prompt.id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                favorites[prompt.id]
                                  ? 'text-red-500 bg-red-500/10'
                                  : 'text-[var(--text-300)] hover:text-red-500 hover:bg-red-500/10'
                              }`}
                            >
                              {favoriteLoading === prompt.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Heart className={`w-4 h-4 ${favorites[prompt.id] ? 'fill-current' : ''}`} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Loading State */}
        {(loading || loadingMore) && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--primary-100)]"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && prompts.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-[var(--text-300)] mx-auto mb-4" />
            <p className="text-[var(--text-200)] text-lg">
              {searchQuery ? t('noPromptsFound') : t('noPromptsYet')}
            </p>
          </div>
        )}
      </main>

      {/* Prompt Detail Modal */}
      <AnimatePresence>
        {selectedPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPrompt(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[var(--bg-200)] rounded-[2rem] border border-[var(--bg-300)] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Side (Left/Top) */}
              {selectedPrompt.imageUrls && selectedPrompt.imageUrls.length > 0 && (
                <div className="w-full md:w-1/2 bg-black/5 relative min-h-[300px] md:min-h-full group">
                  <img
                    src={selectedPrompt.imageUrls[0]}
                    alt={selectedPrompt.title}
                    className="w-full h-full object-contain md:object-cover absolute inset-0 cursor-pointer"
                    onClick={() => {
                      setViewerImages(selectedPrompt.imageUrls!.filter(Boolean))
                      setCurrentImageIndex(0)
                      setShowImageViewer(true)
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium backdrop-blur-md">
                      {t('viewImages')}
                    </span>
                  </div>
                </div>
              )}

              {/* Content Side (Right/Bottom) */}
              <div className={`flex-1 flex flex-col max-h-[50vh] md:max-h-full ${(!selectedPrompt.imageUrls || selectedPrompt.imageUrls.length === 0) ? 'w-full' : ''}`}>
                {/* Header */}
                <div className="p-6 border-b border-[var(--bg-300)] flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-100)] mb-2">
                      {selectedPrompt.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-300)]">
                      {selectedPrompt.author && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[var(--primary-100)]" />
                          {selectedPrompt.author}
                        </span>
                      )}
                      <span>{formatDateTime(selectedPrompt.updatedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPrompt(null)}
                    className="p-2 hover:bg-[var(--bg-300)] rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-[var(--text-200)]" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {selectedPrompt.description && (
                    <div>
                      <h3 className="text-xs font-bold text-[var(--primary-100)] uppercase tracking-widest mb-2 opacity-80">
                        {t('description')}
                      </h3>
                      <p className="text-[var(--text-100)] leading-relaxed opacity-90">
                        {selectedPrompt.description}
                      </p>
                    </div>
                  )}

                  {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPrompt.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-[var(--bg-300)]/50 rounded-lg text-sm text-[var(--text-200)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="bg-[var(--bg-300)]/30 rounded-xl p-4 border border-[var(--bg-400)]/20">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-[var(--text-100)]">
                      {selectedPrompt.content}
                    </pre>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-6 border-t border-[var(--bg-300)] bg-[var(--bg-100)]/30">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCopy(selectedPrompt)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-100)] text-white rounded-xl font-medium hover:bg-[var(--primary-100)]/90 transition-colors shadow-lg shadow-[var(--primary-100)]/20"
                    >
                      {copiedId === selectedPrompt.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copiedId === selectedPrompt.id ? t('copied') : t('copyPrompt')}
                    </button>
                    
                    {session?.user && (
                      <button
                        onClick={() => handleToggleFavorite(selectedPrompt.id)}
                        disabled={favoriteLoading === selectedPrompt.id}
                        className={`px-4 py-3 rounded-xl border transition-colors ${
                          favorites[selectedPrompt.id]
                            ? 'bg-red-500/10 border-red-500/20 text-red-500'
                            : 'border-[var(--bg-300)] text-[var(--text-200)] hover:bg-[var(--bg-300)]'
                        }`}
                      >
                        {favoriteLoading === selectedPrompt.id ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Heart className={`w-5 h-5 ${favorites[selectedPrompt.id] ? 'fill-current' : ''}`} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer */}
      <AnimatePresence>
        {showImageViewer && viewerImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowImageViewer(false)}
          >
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center">
              {viewerImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(prev => (prev === 0 ? viewerImages.length - 1 : prev - 1))
                    }}
                    className="absolute left-4 p-4 text-white/70 hover:text-white bg-white/10 rounded-full"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(prev => (prev === viewerImages.length - 1 ? 0 : prev + 1))
                    }}
                    className="absolute right-4 p-4 text-white/70 hover:text-white bg-white/10 rounded-full"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}

              <img
                src={viewerImages[currentImageIndex]}
                alt="Full size view"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              {viewerImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full text-sm">
                  {currentImageIndex + 1} / {viewerImages.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer lang={lang} />
    </div>
  )
}