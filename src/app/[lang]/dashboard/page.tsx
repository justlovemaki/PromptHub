'use client'

import UserPageWrapper from '../../../components/admin/UserPageWrapper'
import { useAuth, api, type Prompt, type CreatePromptRequest, type UpdatePromptRequest, type PromptListQuery, type PromptListResponse, type PromptStats } from '@promptmanager/core-logic'
import { useState, useEffect, useMemo } from 'react'
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalTitle, Card, DataTable, Loading } from '@promptmanager/ui-components'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import { PromptUseButton } from '../../../components/PromptUseButton'
import TagSelector from '../../../components/TagSelector'
import { useTranslation } from '@/i18n/client'
import { useTags } from '../../../hooks/useTags'
import { PromptSortField } from '@/lib/constants'
import PromptModal from '../../../components/PromptModal'

// 添加样式
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`

export default function PromptsManagementPage({ params }: { params: { lang: string } }) {
  const { t: tDashboard } = useTranslation(params.lang, 'dashboard')
  const { user, isLoading, error, setLanguage } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [stats, setStats] = useState<PromptStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [operationLoading, setOperationLoading] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const lang = params.lang
  const { getTagNameByKey, allTags } = useTags(lang)

  // Create a lookup map for faster name retrieval
  const keyToNameMap = useMemo(() => new Map(allTags.map(t => [t.key, t.name])), [allTags])
  const getName = (key: string) => keyToNameMap.get(key) || key

  // 标签状态
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [existingTagsLoading, setExistingTagsLoading] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)  // 新增：当前选中的标签


  // 最近更新的提示词状态
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([])
  const [recentPromptsError, setRecentPromptsError] = useState<string | null>(null)
  
  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0
  })
  const [sortBy, setSortBy] = useState<PromptSortField>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 新建/编辑表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: [] as string[], // Changed to array
    visibility: 'private' as 'public' | 'private'
  })

  // 设置语言属性
  useEffect(() => {
    setLanguage(params.lang);
  }, [params.lang, setLanguage]);

  // 页面加载时获取提示词列表和统计数据
  useEffect(() => {
    if (user && user.personalSpaceId && !hasInitialized) {
      setHasInitialized(true)
      // 检查URL参数中是否有editid
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('editid');
      
      if (editId) {
        // 如果有editid参数，先查询特定ID的提示词
        fetchPromptById(editId);
      } else {
        // 否则正常获取提示词列表
        fetchPrompts()
      }
      fetchStats()
      fetchRecentPrompts()
      fetchExistingTags()
    }
  }, [user?.personalSpaceId])

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setStatsLoading(true)

      const response = await api.getPromptStats({
        spaceId: user?.personalSpaceId || ''
      }, params.lang)

      if (response.success) {
        setStats(response.data)
      } else {
        console.error(tDashboard('errors.fetchStats'), (response as any).error?.message || tDashboard('error.unknown'))
      }
    } catch (error) {
      console.error(tDashboard('errors.fetchStats'), error)
    } finally {
      setStatsLoading(false)
    }
  }

  // 获取最近更新的提示词
  const fetchRecentPrompts = async () => {
    if (!user?.personalSpaceId) return

    try {
      setRecentPromptsError(null)

      const response = await api.getPrompts({
        spaceId: user?.personalSpaceId,
        page: 1,
        limit: 5,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      }, params.lang)

      if (response.success) {
        const data = response.data as PromptListResponse
        setRecentPrompts(data.prompts || [])
      } else {
        setRecentPromptsError((response as any).error?.message || tDashboard('errors.fetchRecentPrompts'))
      }
    } catch (error) {
      console.error(tDashboard('errors.fetchRecentPrompts'), error)
      setRecentPromptsError(tDashboard('errors.network'))
    }
  }

  // 获取已存在的标签列表
  const fetchExistingTags = async () => {
    try {
      setExistingTagsLoading(true)
      const response = await api.getPromptTags({ spaceId: user?.personalSpaceId, search: '' }, params.lang)
      if (response.success) {
        // 将API返回的标签对象数组转换为字符串数组，以便现有代码继续工作
        const tagStrings = (response.data || []).map(tagObj => tagObj.name);
        setExistingTags(tagStrings)
      } else {
        console.error(tDashboard('errors.fetchTags'), (response as any).error?.message || tDashboard('error.unknown'))
        setExistingTags([])
      }
    } catch (error) {
      console.error(tDashboard('errors.fetchTags'), error)
      setExistingTags([])
    } finally {
      setExistingTagsLoading(false)
    }
  }

  // 获取提示词列表
  const fetchPrompts = async () => {
    try {
      setPromptsLoading(true)
      
      const query: PromptListQuery = {
        spaceId: user?.personalSpaceId,
        search: searchQuery,
        tag: selectedTag ,
        isPublic: filterStatus === 'all' ? undefined : filterStatus === 'public',
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      }
      
      const response = await api.getPrompts(query, params.lang)
      
      if (response.success) {
        const data = response.data as PromptListResponse
        setPrompts(data.prompts || [])
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages
        })
      } else {
        console.error(tDashboard('errors.fetchPrompts'), (response as any).error?.message || tDashboard('error.unknown'))
      }
    } catch (error) {
      console.error(tDashboard('errors.fetchPrompts'), error)
    } finally {
      setPromptsLoading(false)
    }
  }

  // 根据ID获取单个提示词
  const fetchPromptById = async (promptId: string) => {
    try {
      setPromptsLoading(true)
      
      const query: PromptListQuery = {
        spaceId: user?.personalSpaceId,
        id: promptId, // 使用ID查询参数
        page: 1,
        limit: 1, // 只查询一个提示词，提高效率
        sortBy,
        sortOrder
      }
      
      const response = await api.getPrompts(query, params.lang)
      
      if (response.success) {
        const data = response.data as PromptListResponse
        if (data.prompts && data.prompts.length > 0) {
          // 找到了提示词，打开编辑对话框
          setPrompts(data.prompts || [])
          const promptToEdit = data.prompts[0]
          openEditModal(promptToEdit)
        } else {
          // 如果没有找到提示词，仍然显示正常的提示词列表
          setPrompts([])
          setPagination({
            page: 1,
            limit: 8,
            total: 0,
            totalPages: 0
          })
        }
      } else {
        console.error(tDashboard('errors.fetchPrompts'), (response as any).error?.message || tDashboard('error.unknown'))
        // 出错时也显示正常列表
        fetchPrompts()
      }
    } catch (error) {
      console.error(tDashboard('errors.fetchPrompts'), error)
      // 出错时也显示正常列表
      fetchPrompts()
    } finally {
      setPromptsLoading(false)
    }
  }

  // 搜索和筛选变化时重新获取数据，重置到第一页
  useEffect(() => {
    if (hasInitialized) {
      const debounceTimer = setTimeout(() => {
        if (pagination.page !== 1) {
          setPagination(prev => ({ ...prev, page: 1 }))
        } else {
          fetchPrompts()
        }
        // 同时获取更新后的标签列表
        // fetchExistingTags()
      }, 300)
      
      return () => clearTimeout(debounceTimer)
    }
  }, [searchQuery, filterStatus, sortBy, sortOrder, selectedTag])  // 添加selectedTag到依赖数组

  // 分页变化时获取数据
  useEffect(() => {
    if (hasInitialized && pagination.page > 0) {
      fetchPrompts()
    }
  }, [pagination.page, pagination.limit])

  // 处理创建提示词
  const handleCreatePrompt = async () => {
    if (!user?.personalSpaceId) {
      console.error(tDashboard('errors.missingSpace'))
      return
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      console.error(tDashboard('titleAndContentRequired'))
      return
    }

    try {
      setOperationLoading(true)
      const createData: CreatePromptRequest = {
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags, // 传递实际的标签数组，包括空数组
        isPublic: formData.visibility === 'public',
        spaceId: user.personalSpaceId
      }

      const response = await api.createPrompt(createData, params.lang)
      
      if (response.success) {
        console.log('Prompt created:', response.data)
        // 创建成功后重新获取第一页数据和统计数据
        setPagination(prev => ({ ...prev, page: 1 }))
        fetchPrompts()
        fetchStats()
        fetchRecentPrompts()
        fetchExistingTags()
        setShowPromptModal(false)
        resetForm()
      } else {
        console.error(tDashboard('error.unknown'), (response as any).error?.message || tDashboard('error.unknown'))
      }
    } catch (error) {
      console.error('创建提示词错误:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  // 处理编辑提示词
  const handleEditPrompt = async () => {
    if (!editingPrompt) return

    if (!formData.title.trim() || !formData.content.trim()) {
      console.error(tDashboard('titleAndContentRequired'))
      return
    }
    
    try {
      setOperationLoading(true)
      const updateData: UpdatePromptRequest = {
        id: editingPrompt.id,
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags, // 传递实际的标签数组，包括空数组
        isPublic: formData.visibility === 'public'
      }

      const response = await api.updatePrompt(updateData, params.lang)
      
      if (response.success) {
        // 更新成功后重新获取当前页数据和统计数据
        fetchPrompts()
        fetchStats()
        fetchRecentPrompts()
        fetchExistingTags()
        setShowPromptModal(false)
        resetForm()
        setEditingPrompt(null)
      } else {
        console.error(tDashboard('error.unknown'), (response as any).error?.message || tDashboard('error.unknown'))
      }
    } catch (error) {
      console.error('更新提示词错误:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  // 处理删除提示词
  const handleDeletePrompt = async (promptId: string) => {
    try {
      setOperationLoading(true)
      const response = await api.deletePrompt({ id: promptId }, params.lang)
      
      if (response.success) {
        // 删除成功后重新获取当前页数据和统计数据
        fetchPrompts()
        fetchStats()
        fetchRecentPrompts()
      } else {
        console.error(tDashboard('errors.deletePrompt'), (response as any).error?.message || tDashboard('error.unknown'))
      }
    } catch (error) {
      console.error(tDashboard('errors.deletePromptError'), error)
    } finally {
      setOperationLoading(false)
    }
  }

  // 打开删除确认模态框
  const openDeleteConfirmModal = (prompt: Prompt) => {
    setDeletingPrompt(prompt)
    setShowDeleteConfirmModal(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      tags: [],
      visibility: 'private'
    })
  }

  // 打开编辑模态框
  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    // 解析tags字段（可能是JSON字符串）
    let tagsArray: string[] = prompt.tags
    
    setFormData({
      title: prompt.title || '',
      description: prompt.description || '',
      content: prompt.content || '',
      tags: tagsArray,
      visibility: prompt.isPublic ? 'public' : 'private'
    })
    setShowPromptModal(true)
  }

  // 过滤和搜索提示词（因为API已经处理了搜索和筛选，这里主要用于客户端的快速筛选）
  const filteredPrompts = prompts || []

  // 分页功能
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  // 表格列定义
  const columns = [
    {
      key: 'thisObj-title',
      title: tDashboard('table.title'),
      width: 300,
      sortable: true,
      render: (prompt: string, record: Prompt) => (
        <div>
          <div className="font-medium text-text-100">{record.title}</div>
          <div className="text-sm text-text-300">{record.description}</div>
        </div>
      )
    },
    {
      key: 'useCount',
      title: tDashboard('table.usageCount'),
      width: 150,
      sortable: true,
      render: (prompt: number) => (
        <div className="text-sm text-text-100 font-medium flex items-center gap-1">
          <svg className="h-4 w-4 text-primary-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {prompt || 0}
        </div>
      )
    },
    {
      key: 'isPublic',
      title: tDashboard('table.visibility'),
      width: 80,
      render: (prompt: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          prompt
            ? 'bg-success-400 text-success-500'
            : 'bg-primary-300 text-primary-100'
        }`}>
          {prompt ? tDashboard('public') : tDashboard('private')}
        </span>
      )
    },
    {
      key: 'tags',
      title: tDashboard('table.tags'),
      width: 200,
      render: (tagKeys: string[]) => {
        const tagsToDisplay = (tagKeys || []).map(getName).slice(0, 3)
        const remainingCount = (tagKeys?.length || 0) - 3

        return (
          <div className="flex flex-wrap gap-1">
            {tagsToDisplay.map((tagName, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-bg-200 text-text-200 rounded">
                {tagName}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="px-2 py-1 text-xs text-text-300">+{remainingCount}</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'createdAt',
      title: tDashboard('table.createdAt'),
      width: 140,
      sortable: true,
      render: (prompt: string) => (
        <div className="text-sm text-text-300">
          {prompt ? new Date(prompt).toLocaleString(params.lang, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }) : '-'}
        </div>
      )
    },
    {
      key: 'updatedAt',
      title: tDashboard('table.updatedAt'),
      width: 140,
      sortable: true,
      render: (prompt: string) => (
        <div className="text-sm text-text-300">
          {prompt ? new Date(prompt).toLocaleString(params.lang, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }) : '-'}
        </div>
      )
    },
    {
      key: 'thisObj-action',
      title: tDashboard('table.actions'),
      width: 120,
      render: (prompt: Prompt) => (
        <div className="flex items-center space-x-1">
          <PromptUseButton
            prompt={prompt}
            variant="ghost"
            size="sm"
            lang={params.lang}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            onRefreshPrompts={() => {
              fetchPrompts()
              fetchStats()
              fetchRecentPrompts()
            }}
          >
            <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </PromptUseButton>
          <button
            onClick={() => openEditModal(prompt)}
            disabled={operationLoading}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => openDeleteConfirmModal(prompt)}
            disabled={operationLoading}
            className="p-2 hover:bg-red-50 rounded-md transition-colors"
          >
            <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }
  ]

  return (
      <UserPageWrapper lang={params.lang} error={error}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-[var(--bg-100)] rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-100)]">{tDashboard('pageTitle')}</h1>
              <p className="text-[var(--text-200)] mt-1">{tDashboard('pageDescription')}</p>
            </div>
            <Button onClick={() => setShowPromptModal(true)}>
              {tDashboard('createNewPrompt')}
            </Button>
          </div>
        </div>

        {/* 最近更新的提示词 */}
        <div className="bg-[var(--bg-100)] rounded-lg shadow-sm border">
          <div className="p-6 border-b border-[var(--bg-300)]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-100)]">{tDashboard('recentPrompts.title')}</h2>
                <p className="text-[var(--text-200)] text-sm mt-1">{tDashboard('recentPrompts.description')}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                            fetchPrompts()
                            fetchStats()
                            fetchRecentPrompts()
                            fetchExistingTags()
                          }}
                  className="bg-[var(--bg-200)] hover:bg-[var(--bg-300)] text-[var(--text-100)] px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{tDashboard('refresh')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* 错误状态 */}
            {recentPromptsError && (
              <div className="text-center py-12">
                <div className="text-error-500 mb-2">{tDashboard('loadingFailed')}</div>
                <p className="text-text-200 text-sm mb-4">{recentPromptsError}</p>
                <button
                  onClick={() => {
                            fetchPrompts()
                            fetchStats()
                            fetchRecentPrompts()
                          }}
                  className="text-primary-100 hover:text-primary-200 font-medium text-sm"
                >
                  {tDashboard('retry')}
                </button>
              </div>
            )}

            {/* 提示词卡片 */}
            {!recentPromptsError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {recentPrompts.length > 0 ? (
                  recentPrompts.map((prompt) => {
                    // 获取可见性标签样式和文本
                    const visibilityBadge = {
                      className: prompt.isPublic
                        ? 'text-xs bg-success-400 text-success-500 px-2 py-1 rounded'
                        : 'text-xs bg-primary-300 text-primary-100 px-2 py-1 rounded',
                      text: prompt.isPublic ? tDashboard('public') : tDashboard('private')
                    }

                    return (
                      <div key={prompt.id} className="bg-gray-50 rounded-lg border hover:shadow-md transition-shadow p-4 flex flex-col h-68">
                        <div className="flex justify-between items-start mb-2 flex-shrink-0">
                          <h3 className="text-lg font-semibold text-text-100 truncate" title={prompt.title}>
                            {prompt.title}
                          </h3>
                          <span className={`${visibilityBadge.className} ml-2 flex-shrink-0`}>{visibilityBadge.text}</span>
                        </div>

                        <p className="text-text-200 text-sm mb-3 line-clamp-2 flex-grow" title={prompt.description || tDashboard('noDescription')}>
                          {prompt.description || tDashboard('noDescription')}
                        </p>

                        {/* 标签显示 */}
                        {prompt.tags && prompt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3 flex-shrink-0">
                            {prompt.tags.slice(0, 3).map((key, index) => (
                              <span key={index} className="text-xs bg-bg-300 text-text-200 px-2 py-1 rounded">
                                {getName(key)}
                              </span>
                            ))}
                            {prompt.tags.length > 3 && (
                              <span className="text-xs text-text-300">+{prompt.tags.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-text-300 mb-3 flex-shrink-0">
                          <div className="truncate">{tDashboard('table.updatedAt')}：{prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleString(params.lang, {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          }) : tDashboard('unknown')}</div>
                          <div>{tDashboard('table.usageCount')}：{prompt.useCount ?? 0}</div>
                        </div>

                        <div className="flex space-x-2 mt-auto flex-shrink-0">
                          <PromptUseButton
                            prompt={prompt}
                            variant="default"
                            size="sm"
                            className="flex-1"
                            lang={params.lang}
                            onRefreshPrompts={() => {
                              fetchPrompts()
                              fetchStats()
                              fetchRecentPrompts()
                            }}
                          >
                            {tDashboard('use')}
                          </PromptUseButton>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // 空状态
                  <div className="col-span-full text-center py-12">
                    <div className="text-text-300 mb-4">
                      <svg className="mx-auto h-12 w-12 text-text-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-text-200 mb-4">{tDashboard('noPromptsYet')}</p>
                    {/* <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      {tDashboard('createFirstPrompt')}
                    </button> */}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-200">{tDashboard('totalPrompts')}</p>
                <p className="text-2xl font-bold text-text-100">
                  {statsLoading ? '-' : (stats?.totalPrompts || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-300 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-primary-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-200">{tDashboard('publicPrompts')}</p>
                <p className="text-2xl font-bold text-text-100">
                  {statsLoading ? '-' : (stats?.publicPrompts || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-success-400 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 104 0 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-200">{tDashboard('privatePrompts')}</p>
                <p className="text-2xl font-bold text-text-100">
                  {statsLoading ? '-' : (stats?.privatePrompts || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-300 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-primary-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-200">{tDashboard('monthlyCreated')}</p>
                <p className="text-2xl font-bold text-text-100">
                  {statsLoading ? '-' : (stats?.monthlyCreated || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-warning-400 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* 已存在的标签列表 */}
        {existingTags.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-text-100">{tDashboard('existingTags')}</h3>
              {existingTagsLoading && (
                <div className="flex items-center text-sm text-text-300">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-text-300" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {tDashboard('loadingTags')}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {existingTags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary-100 text-white'  // 选中状态
                      : 'bg-primary-300 text-primary-100 hover:bg-primary-200'  // 未选中状态
                  }`}
                  onClick={() => {
                    // 切换标签选择，如果已选中则清除
                    const newSelectedTag = selectedTag === tag ? null : tag;
                    setSelectedTag(newSelectedTag);
                    // 清除文本搜索框中的内容，只保留标签搜索
                    setSearchQuery('');
                  }}
                >
                  {getName(tag) || tag}
                </span>
              ))}
              {/* 清除标签搜索按钮 */}
              {selectedTag && (
                <button
                  onClick={() => {
                    setSelectedTag(null);
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-bg-200 text-text-200 hover:bg-bg-300 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {tDashboard('clearTagSearch')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <SearchToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={tDashboard('searchPrompts')}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          t={tDashboard}
        />

        {/* 提示词列表 */}
        <Card>
          <DataTable
            columns={columns}
            data={filteredPrompts}
            rowKey="id"
            loading={promptsLoading}
            empty={
              <div className="text-center py-8">
                <div className="text-text-300 mb-4">
                  {searchQuery || filterStatus !== 'all' ? tDashboard('noPromptsFound') : tDashboard('noPromptsYet')}
                </div>
                {/* {!searchQuery && filterStatus === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    {tDashboard('createFirstPrompt')}
                  </Button>
                )} */}
              </div>
            }
            onSort={(key, direction) => {
              setSortBy(key as PromptSortField)
              setSortOrder(direction)
            }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: (page, pageSize) => {
                if (pageSize !== pagination.limit) {
                  handlePageSizeChange(pageSize)
                } else {
                  handlePageChange(page)
                }
              }
            }}
            t={tDashboard}
          />
        </Card>

        
        {/* 删除确认模态框 */}
        <Modal
          open={showDeleteConfirmModal}
          onOpenChange={(open) => {
            setShowDeleteConfirmModal(open)
            if (!open) setDeletingPrompt(null)
          }}
        >
          <ModalContent size="sm">
            <ModalHeader>
              <ModalTitle>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-error-400 to-error-500 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-text-100">{tDashboard('deleteConfirmModal.title')}</div>
                    <div className="text-sm text-text-300 font-normal">{tDashboard('deleteConfirmModal.description')}</div>
                  </div>
                </div>
              </ModalTitle>
            </ModalHeader>
            
            <div className="px-8 py-6 space-y-6">
              <div className="text-text-200">
                {tDashboard('deleteConfirmModal.message', { title: deletingPrompt?.title || '' })}
              </div>
            </div>
            
            <div className="px-8 py-6 bg-bg-200 border-t border-bg-200 flex justify-end items-center rounded-b-2xl space-x-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirmModal(false)
                  setDeletingPrompt(null)
                }}
                variant="outline"
                className="px-6 py-2"
              >
                {tDashboard('deleteConfirmModal.cancel')}
              </Button>
              <Button
                onClick={async () => {
                  if (deletingPrompt?.id) {
                    await handleDeletePrompt(deletingPrompt.id)
                    setShowDeleteConfirmModal(false)
                    setDeletingPrompt(null)
                  }
                }}
                className="px-6 py-2 bg-gradient-to-r from-error-400 to-error-500 hover:from-error-500 hover:to-error-400 transition-all duration-200 shadow-md hover:shadow-lg text-white rounded-xl"
              >
                {tDashboard('deleteConfirmModal.confirm')}
              </Button>
            </div>
          </ModalContent>
        </Modal>

        {/* 提示词新建/编辑模态框 */}
        <PromptModal
          open={showPromptModal}
          onOpenChange={(open) => {
            setShowPromptModal(open)
            if (!open) {
              resetForm()
              setEditingPrompt(null)
            }
          }}
          formData={formData}
          setFormData={setFormData}
          editingPrompt={editingPrompt}
          operationLoading={operationLoading}
          onSubmit={editingPrompt ? handleEditPrompt : handleCreatePrompt}
          lang={lang}
          existingTags={existingTags}
        />
      </div>
    </UserPageWrapper>
  )
}