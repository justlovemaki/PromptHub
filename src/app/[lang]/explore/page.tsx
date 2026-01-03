'use client'

import { useState, useEffect, useMemo, use, useCallback } from 'react'
import { Sparkles, Search, Copy, Check, Globe, X, LayoutGrid, List, Heart, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/i18n/client'
import { useTags } from '@/hooks/useTags'
import { useSession } from '@/lib/auth-client'
import { api } from '@promptmanager/core-logic'
import ParticlesBackground from '@/components/landing/ParticlesBackground'
import TopNavbar from '@/components/layout/TopNavbar'
import Footer from '@/components/layout/Footer'
import { trackPromptAction, trackFavorite, trackSearch, trackFilter, trackViewModeChange } from '@/lib/umami'

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

export default function ExplorePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params)
  const { t } = useTranslation(lang, 'explore')
  const { allTags } = useTags(lang)
  const { data: session } = useSession()
  
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
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [pageInput, setPageInput] = useState('')

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

  // 点击外部关闭排序下拉框
  useEffect(() => {
    if (!isSortOpen) return
    const handleClickOutside = () => setIsSortOpen(false)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [isSortOpen])

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
      // 追踪复制事件
      trackPromptAction('copy', prompt.id, {
        content_length: prompt.content.length,
        source: 'explore',
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // 获取所有标签的 key 列表（用于筛选显示）
  const allTagKeys = useMemo(() => {
    return allTags.map(tag => tag.key)
  }, [allTags])

  // 获取收藏状态
  const fetchFavoriteStatus = useCallback(async (promptIds: string[]) => {
    if (!session?.user || promptIds.length === 0) return
    
    try {
      const result = await api.checkFavorites(promptIds, lang)
      
      if (result.success && result.data?.favorites) {
        setFavorites(prev => ({ ...prev, ...result.data.favorites }))
      }
    } catch (error) {
      console.error('Failed to fetch favorite status:', error)
    }
  }, [session?.user, lang])

  // 当提示词列表更新时，获取收藏状态
  useEffect(() => {
    if (prompts.length > 0 && session?.user) {
      const promptIds = prompts.map(p => p.id)
      fetchFavoriteStatus(promptIds)
    }
  }, [prompts, session?.user, fetchFavoriteStatus])

  // 切换收藏状态
  const handleToggleFavorite = async (promptId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    if (!session?.user) return
    
    setFavoriteLoading(promptId)
    const isFavorited = favorites[promptId]
    
    try {
      if (isFavorited) {
        // 取消收藏
        const result = await api.removeFavorite(promptId, lang)
        
        if (result.success) {
          setFavorites(prev => ({ ...prev, [promptId]: false }))
          // 追踪取消收藏事件
          trackFavorite('remove', promptId)
        }
      } else {
        // 添加收藏
        const result = await api.addFavorite(promptId, lang)
        
        if (result.success) {
          setFavorites(prev => ({ ...prev, [promptId]: true }))
          // 追踪添加收藏事件
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
      {/* 星星点点动态背景 */}
      <ParticlesBackground />
      
      <TopNavbar lang={lang} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 flex-1">
        {/* 页面标题 */}
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
              <div className="p-3 bg-gradient-to-br from-[var(--primary-100)] to-[var(--secondary-400)] rounded-2xl shadow-lg shadow-[var(--primary-100)]/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] bg-clip-text text-transparent pb-1">
                {t('pageTitle')}
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
          <p className="text-[var(--text-200)] text-lg max-w-2xl mx-auto leading-relaxed">
            {t('pageDescription')}
          </p>
        </motion.div>

        {/* 搜索和筛选 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-[var(--bg-200)]/60 backdrop-blur-xl rounded-3xl p-6 mb-10 border border-white/10 shadow-2xl shadow-black/5"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-300)] group-focus-within:text-[var(--primary-100)] transition-colors" />
              <input
                type="text"
                placeholder={t('searchPlaceholder') || '搜索提示词标题、作者或标签...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                onBlur={() => {
                  // 当用户完成搜索输入时追踪搜索事件
                  if (searchQuery.trim()) {
                    trackSearch(searchQuery, pagination.total)
                  }
                }}
                className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-100)]/50 border border-[var(--bg-400)]/30 rounded-2xl text-[var(--text-100)] placeholder-[var(--text-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)]/50 focus:border-[var(--primary-100)]/50 transition-all shadow-inner"
              />
            </div>
            
            <div className="flex gap-3">
              {/* 排序选择 */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 pl-4 pr-10 py-3.5 bg-[var(--bg-100)]/50 border border-[var(--bg-400)]/30 rounded-2xl text-[var(--text-100)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)]/50 transition-all cursor-pointer shadow-inner min-w-[140px] text-left"
                >
                  <Filter className="w-4 h-4 text-[var(--primary-100)]" />
                  <span className="text-sm font-medium">
                    {sortOrder === 'desc' ? t('sortOrder.desc') : t('sortOrder.asc')}
                  </span>
                  <ChevronRight className={`absolute right-4 w-4 h-4 text-[var(--text-300)] transition-transform duration-200 ${isSortOpen ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 5, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-full min-w-[160px] bg-[var(--bg-200)] border border-[var(--bg-300)] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                    >
                      <div className="p-1">
                        <button
                          onClick={() => {
                            setSortOrder('desc')
                            setIsSortOpen(false)
                            // 追踪排序变更
                            trackFilter('sort', 'desc')
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                            sortOrder === 'desc'
                              ? 'bg-[var(--primary-100)] text-white'
                              : 'text-[var(--text-200)] hover:bg-[var(--bg-300)]'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${sortOrder === 'desc' ? 'bg-white' : 'bg-transparent'}`} />
                          {t('sortOrder.desc')}
                        </button>
                        <button
                          onClick={() => {
                            setSortOrder('asc')
                            setIsSortOpen(false)
                            // 追踪排序变更
                            trackFilter('sort', 'asc')
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                            sortOrder === 'asc'
                              ? 'bg-[var(--primary-100)] text-white'
                              : 'text-[var(--text-200)] hover:bg-[var(--bg-300)]'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${sortOrder === 'asc' ? 'bg-white' : 'bg-transparent'}`} />
                          {t('sortOrder.asc')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 视图模式切换 */}
              <div className="flex bg-[var(--bg-100)]/50 p-1 rounded-2xl border border-[var(--bg-400)]/30 shadow-inner">
                <button
                  onClick={() => {
                    setViewMode('list')
                    // 追踪视图模式切换
                    trackViewModeChange('list')
                  }}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-[var(--primary-100)] shadow-md'
                      : 'text-[var(--text-300)] hover:text-[var(--text-100)]'
                  }`}
                  title={t('viewMode.list')}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setViewMode('image')
                    // 追踪视图模式切换
                    trackViewModeChange('image')
                  }}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'image'
                      ? 'bg-white text-[var(--primary-100)] shadow-md'
                      : 'text-[var(--text-300)] hover:text-[var(--text-100)]'
                  }`}
                  title={t('viewMode.image')}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 标签筛选 */}
          {allTagKeys.length > 0 && (
            <div className="mt-6 flex items-start gap-3">
              <div className="mt-1.5 flex-shrink-0">
                <div className="px-2 py-1 text-[var(--text-300)] text-xs font-bold uppercase tracking-wider">{t('filterByTag')}:</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedTag(null)
                    setPagination(prev => ({ ...prev, page: 1 }))
                    // 追踪标签筛选清除
                    trackFilter('tag', 'all')
                  }}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    selectedTag === null
                      ? 'bg-[var(--primary-100)] text-white shadow-lg shadow-[var(--primary-100)]/20'
                      : 'bg-[var(--bg-100)]/50 text-[var(--text-200)] hover:bg-white hover:text-[var(--primary-100)] border border-transparent hover:border-[var(--primary-100)]/20'
                  }`}
                >
                  {t('allTags')}
                </button>
                {allTagKeys.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTag = selectedTag === tag ? null : tag
                      setSelectedTag(newTag)
                      setPagination(prev => ({ ...prev, page: 1 }))
                      // 追踪标签筛选
                      trackFilter('tag', newTag || 'all')
                    }}
                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-[var(--primary-100)] text-white shadow-lg shadow-[var(--primary-100)]/20'
                        : 'bg-[var(--bg-100)]/50 text-[var(--text-200)] hover:bg-white hover:text-[var(--primary-100)] border border-transparent hover:border-[var(--primary-100)]/20'
                    }`}
                  >
                    {getName(tag)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

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
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence mode='popLayout'>
                {prompts.map((prompt, idx) => {
                  const hasImages = Array.isArray(prompt.imageUrls) && prompt.imageUrls.filter((url: string) => url && url.trim()).length > 0
                  const firstImage = hasImages ? prompt.imageUrls!.filter((url: string) => url && url.trim())[0] : null
                  
                  return (
                    <motion.div
                      layout
                      key={prompt.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className="group relative flex flex-col bg-[var(--bg-200)]/40 backdrop-blur-md rounded-3xl border border-white/10 hover:border-[var(--primary-100)]/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[var(--primary-100)]/10 cursor-pointer"
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      {/* 悬停光晕效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-100)]/5 via-transparent to-[var(--secondary-400)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* 图片模式：显示图片区域 */}
                      {viewMode === 'image' && (
                        <div className="w-full h-44 bg-[var(--bg-300)]/50 relative overflow-hidden">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={prompt.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-[var(--text-300)] gap-2 bg-[var(--bg-300)]/30"><svg class="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span class="text-xs font-medium opacity-50">${t('noImage')}</span></div>`
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--text-300)] gap-2 bg-[var(--bg-300)]/30">
                              <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs font-medium opacity-50">{t('noImage')}</span>
                            </div>
                          )}
                          {/* 图片上的渐变层 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}

                      <div className="p-5 flex flex-col flex-1 relative z-10">
                        {/* 顶部信息栏：时间、作者 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 min-w-0">
                            {prompt.author ? (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--primary-100)]/10 rounded-full min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-100)] shrink-0" />
                                <span className="text-[10px] font-bold text-[var(--primary-100)] truncate">
                                  {prompt.author}
                                </span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-[var(--text-300)] font-medium">
                                {formatDateTime(prompt.updatedAt)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {hasImages && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const validImages = prompt.imageUrls!.filter((url: string) => url && url.trim())
                                  setViewerImages(validImages)
                                  setCurrentImageIndex(0)
                                  setShowImageViewer(true)
                                }}
                                className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-xl transition-all shadow-sm active:scale-95 group/img"
                                title={t('hasImages')}
                              >
                                <Sparkles className="w-3.5 h-3.5 group-hover/img:animate-pulse" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopy(prompt)
                              }}
                              className="p-2 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                              title={copiedId === prompt.id ? t('copied') : t('copyPrompt')}
                            >
                              {copiedId === prompt.id ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-[var(--text-300)] group-hover:text-[var(--primary-100)]" />
                              )}
                            </button>
                            {session?.user && (
                              <button
                                onClick={(e) => handleToggleFavorite(prompt.id, e)}
                                disabled={favoriteLoading === prompt.id}
                                className={`p-2 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 ${
                                  favorites[prompt.id]
                                    ? 'bg-red-50 text-red-500'
                                    : 'text-[var(--text-300)] hover:text-red-500 hover:bg-red-50'
                                }`}
                                title={favorites[prompt.id] ? t('unfavorite') : t('favorite')}
                              >
                                {favoriteLoading === prompt.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Heart className={`w-3.5 h-3.5 ${favorites[prompt.id] ? 'fill-current' : ''}`} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 内容区域 */}
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-[var(--text-100)] mb-2.5 line-clamp-1 group-hover:text-[var(--primary-100)] transition-colors leading-tight">
                            {prompt.title}
                          </h3>
                          
                          <p className="text-[var(--text-200)] text-xs mb-2 line-clamp-2 h-10 leading-relaxed opacity-80">
                            {prompt.description || t('noDescription')}
                          </p>
                          
                          <div className="bg-[var(--bg-100)]/50 rounded-2xl p-3 mb-4 group-hover:bg-white transition-colors border border-transparent group-hover:border-[var(--primary-100)]/10">
                            <p className="text-[var(--text-200)] text-[11px] line-clamp-3 whitespace-pre-wrap leading-relaxed font-mono opacity-90">
                              {prompt.content}
                            </p>
                          </div>
                          
                          {/* 底部信息 */}
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--bg-400)]/10">
                            <div className="flex flex-wrap gap-1.5">
                              {prompt.tags && prompt.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-[var(--bg-300)]/50 text-[var(--text-300)] rounded-lg group-hover:bg-[var(--primary-100)]/10 group-hover:text-[var(--primary-100)] transition-colors uppercase tracking-tight"
                                >
                                  {getName(tag)}
                                </span>
                              ))}
                              {prompt.tags && prompt.tags.length > 2 && (
                                <span className="px-1.5 py-0.5 text-[10px] text-[var(--text-300)] font-medium opacity-50">
                                  +{prompt.tags.length - 2}
                                </span>
                              )}
                            </div>
                            
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-12 mb-8"
              >
                {/* 首页按钮 */}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2.5 sm:p-3 bg-white/40 backdrop-blur-md text-[var(--text-100)] rounded-xl sm:rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--primary-100)] hover:text-white transition-all shadow-md active:scale-95 group"
                  title={t('pagination.firstPage')}
                >
                  <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* 上一页按钮 */}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2.5 sm:p-3 bg-white/40 backdrop-blur-md text-[var(--text-100)] rounded-xl sm:rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--primary-100)] hover:text-white transition-all shadow-md active:scale-95 group"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                
                {/* 页码显示 */}
                <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white/40 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner border border-white/20">
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-100)]">
                    {pagination.page} <span className="text-[var(--text-300)] font-medium mx-1">/</span> {pagination.totalPages}
                  </span>
                </div>

                {/* 下一页按钮 */}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2.5 sm:p-3 bg-white/40 backdrop-blur-md text-[var(--text-100)] rounded-xl sm:rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--primary-100)] hover:text-white transition-all shadow-md active:scale-95 group"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 尾页按钮 */}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2.5 sm:p-3 bg-white/40 backdrop-blur-md text-[var(--text-100)] rounded-xl sm:rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--primary-100)] hover:text-white transition-all shadow-md active:scale-95 group"
                  title={t('pagination.lastPage')}
                >
                  <ChevronsRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 页码输入框 */}
                <div className="flex items-center gap-2 ml-2 sm:ml-4">
                  <input
                    type="number"
                    min={1}
                    max={pagination.totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const page = parseInt(pageInput)
                        if (page >= 1 && page <= pagination.totalPages) {
                          setPagination(prev => ({ ...prev, page }))
                          setPageInput('')
                        }
                      }
                    }}
                    placeholder={t('pagination.pageInputPlaceholder')}
                    className="w-14 sm:w-16 px-2 sm:px-3 py-2 sm:py-2.5 bg-white/40 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl text-center text-xs sm:text-sm font-medium text-[var(--text-100)] placeholder-[var(--text-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)]/50 focus:border-[var(--primary-100)]/50 transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => {
                      const page = parseInt(pageInput)
                      if (page >= 1 && page <= pagination.totalPages) {
                        setPagination(prev => ({ ...prev, page }))
                        setPageInput('')
                      }
                    }}
                    disabled={!pageInput || parseInt(pageInput) < 1 || parseInt(pageInput) > pagination.totalPages}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--primary-100)] text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--primary-200)] transition-all shadow-md active:scale-95"
                  >
                    {t('pagination.goToPage')}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* 提示词详情模态框 */}
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
              className="bg-[var(--bg-200)] rounded-[2rem] border border-[var(--bg-300)] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部装饰渐变 */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[var(--primary-100)]/5 to-transparent pointer-events-none" />

              {/* 头部 */}
              <div className="relative flex items-center justify-between p-6 md:p-8 border-b border-[var(--bg-300)]">
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-100)] leading-tight tracking-tight">
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
                        className="inline-flex items-center px-4 py-1.5 text-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-2xl hover:bg-purple-500/20 transition-all font-bold"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('imagesCount', { count: selectedPrompt.imageUrls.filter((url: string) => url && url.trim()).length })}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {selectedPrompt.author && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-[var(--primary-100)]/10 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary-100)]" />
                        <span className="font-bold text-[var(--primary-100)]">{selectedPrompt.author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[var(--text-300)] font-medium">
                      <Globe className="w-4 h-4 opacity-50" />
                      {formatDateTime(selectedPrompt.updatedAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all shadow-sm active:scale-90 shrink-0"
                >
                  <X className="w-6 h-6 text-[var(--text-200)]" />
                </button>
              </div>

              {/* 内容 */}
              <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-240px)]">
                {/* 描述 */}
                {selectedPrompt.description && (
                  <div className="mb-6 md:mb-8">
                    <h3 className="text-xs font-bold text-[var(--primary-100)] uppercase tracking-widest mb-2 md:mb-3 opacity-80">
                      {t('description') || '描述'}
                    </h3>
                    <p className="text-[var(--text-100)] text-base md:text-lg leading-relaxed font-medium opacity-90">
                      {selectedPrompt.description}
                    </p>
                  </div>
                )}

                {/* 标签 */}
                {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-[var(--primary-100)] uppercase tracking-widest mb-3 opacity-80">
                      {t('tags') || '标签'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPrompt.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-1.5 text-sm font-bold bg-[var(--bg-300)]/50 text-[var(--text-300)] rounded-xl border border-white/5"
                        >
                          {getName(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 完整内容 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-[var(--primary-100)] uppercase tracking-widest opacity-80">
                      {t('content') || '内容'}
                    </h3>
                  </div>
                  <div className="bg-[var(--bg-300)]/50 rounded-2xl p-4 md:p-6 border border-[var(--bg-400)]/30 shadow-inner">
                    <pre className="text-[var(--text-100)] text-sm md:text-base whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedPrompt.content}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 底部操作按钮 */}
              <div className="p-6 md:p-8 pt-4 border-t border-[var(--bg-300)] flex flex-col sm:flex-row gap-3 md:gap-4 bg-[var(--bg-100)]/50">
                <button
                  onClick={() => handleCopy(selectedPrompt)}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-[var(--primary-100)] to-[var(--secondary-400)] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[var(--primary-100)]/20 hover:shadow-xl hover:shadow-[var(--primary-100)]/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {copiedId === selectedPrompt.id ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      {t('copyPrompt')}
                    </>
                  )}
                </button>
                {session?.user && (
                  <button
                    onClick={() => handleToggleFavorite(selectedPrompt.id)}
                    disabled={favoriteLoading === selectedPrompt.id}
                    className={`flex items-center justify-center gap-3 px-6 py-3.5 font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] ${
                      favorites[selectedPrompt.id]
                        ? 'bg-red-500 text-white shadow-red-500/20'
                        : 'bg-[var(--bg-200)] text-[var(--text-100)] border border-[var(--bg-300)]'
                    }`}
                  >
                    {favoriteLoading === selectedPrompt.id ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Heart className={`w-5 h-5 ${favorites[selectedPrompt.id] ? 'fill-current' : ''}`} />
                    )}
                    {favorites[selectedPrompt.id] ? t('unfavorite') : t('favorite')}
                  </button>
                )}
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="px-8 py-3.5 bg-[var(--bg-300)]/50 hover:bg-[var(--bg-300)] text-[var(--text-100)] font-bold rounded-2xl transition-all"
                >
                  {t('close') || '关闭'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 图片查看器模态框 */}
      <AnimatePresence>
        {showImageViewer && viewerImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4"
            onClick={() => setShowImageViewer(false)}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowImageViewer(false)}
                className="absolute top-6 right-6 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all z-10 backdrop-blur-md border border-white/10 active:scale-90"
              >
                <X className="w-8 h-8 text-white" />
              </button>

              {/* 图片计数 */}
              <div className="absolute top-6 left-6 px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white font-bold tracking-widest z-10">
                {currentImageIndex + 1} <span className="opacity-30 mx-1">/</span> {viewerImages.length}
              </div>

              {/* 左箭头 */}
              {viewerImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))
                  }}
                  className="absolute left-6 p-5 bg-white/5 hover:bg-white/10 rounded-3xl transition-all z-10 backdrop-blur-md border border-white/10 active:scale-90 group"
                >
                  <ChevronLeft className="w-10 h-10 text-white group-hover:-translate-x-1 transition-transform" />
                </button>
              )}

              {/* 图片 */}
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="max-w-[90vw] max-h-[90vh] flex items-center justify-center relative group"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={viewerImages[currentImageIndex]}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E'
                  }}
                />
              </motion.div>

              {/* 右箭头 */}
              {viewerImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))
                  }}
                  className="absolute right-6 p-5 bg-white/5 hover:bg-white/10 rounded-3xl transition-all z-10 backdrop-blur-md border border-white/10 active:scale-90 group"
                >
                  <ChevronRight className="w-10 h-10 text-white group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* 键盘提示 */}
              {viewerImages.length > 1 && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white/50 text-xs font-bold uppercase tracking-[0.2em]">
                  Use <span className="text-white px-1.5 py-0.5 bg-white/10 rounded-md mx-1">←</span> and <span className="text-white px-1.5 py-0.5 bg-white/10 rounded-md mx-1">→</span> to navigate
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 页脚 */}
      <Footer lang={lang} />
    </div>
  )
}