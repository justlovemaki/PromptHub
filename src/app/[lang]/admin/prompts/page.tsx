'use client'

import React, { useState, useEffect, useMemo, use } from 'react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import { DataTable, Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalTitle } from '@promptmanager/ui-components'
import TagSelector from '@/components/TagSelector'
import PromptModal from '@/components/PromptModal'
import { api, useAuth } from '@promptmanager/core-logic'
import type { Prompt } from '@promptmanager/core-logic'
import { useTranslation } from '@/i18n/client'
import { useTags } from '@/hooks/useTags'
import { UI_CONFIG, PromptVisibility, PROMPT_VISIBILITY } from '@/lib/constants';

interface AdminPromptsPageProps {
  params: Promise<{
    lang: string
  }>
}

interface PromptFormData {
  title: string
  content: string
  description: string
  tags: string[]
  imageUrls: string[]
  author: string
  visibility: PromptVisibility
}

export default function AdminPromptsPage({ params }: AdminPromptsPageProps) {
  const { lang } = use(params)
  const { t: tAdminPrompt } = useTranslation(lang, 'admin')
  const { t: tCommon } = useTranslation(lang, 'common')

  // 状态管理
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all') // 审核状态筛选
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // PromptManagement 组件的状态
  const { isLoading, setLanguage } = useAuth()

  // 标签相关
  const { getTagNameByKey, allTags } = useTags(lang)

  // 创建标签键到名称的映射，用于快速查找
  const keyToNameMap = useMemo(() => new Map(allTags.map(t => [t.key, t.name])), [allTags])
  const getName = (key: string) => keyToNameMap.get(key) || key
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPrompts, setTotalPrompts] = useState(0)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    content: '',
    description: '',
    tags: [],
    imageUrls: [],
    author: '',
    visibility: PROMPT_VISIBILITY.PRIVATE
  })
  const [operationLoading, setOperationLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 审核确认弹窗状态
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [pendingApproval, setPendingApproval] = useState<{ promptId: string; promptTitle: string; approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' } | null>(null)

  // 设置语言属性
  useEffect(() => {
    setLanguage(lang);
  }, [lang, setLanguage]);

  // 获取提示词列表
  const fetchPrompts = async (
    page = currentPage,
    search = searchQuery,
    sort = sortBy,
    order = sortOrder,
    filter = filterStatus,
    approval = approvalFilter
  ) => {
    try {
      setLoading(true)
      setError(null)

      // 当选择审核状态筛选时，自动添加 isPublic: true 条件
      // 因为审核状态只对公开的提示词有意义
      let isPublicParam: boolean | undefined = undefined
      if (approval !== 'all') {
        isPublicParam = true // 审核筛选时强制只查公开提示词
      } else if (filter === 'public') {
        isPublicParam = true
      } else if (filter === 'private') {
        isPublicParam = false
      }

      const response = await api.getAdminPrompts({
        page,
        limit: 8,
        search: search || undefined,
        sortBy: sort || 'updatedAt',
        sortOrder: order || 'desc',
        isPublic: isPublicParam,
        approvalStatus: approval !== 'all' ? approval : undefined
      }, lang)

      if (response.success) {
        setPrompts(response.data.prompts || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalPrompts(response.data.total || 0)
      } else {
        const errorMessage = (response as any).error?.message || tAdminPrompt('fetchFailed')
        setError(errorMessage)
        setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
        console.error(errorMessage)
      }
    } catch (error) {
      console.error(tAdminPrompt('fetchError'), error)
      const errorMessage = tAdminPrompt('promptsManagement.fetchError') || '网络错误，请稍后重试'
      setError(errorMessage)
      setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
    } finally {
      setLoading(false)
    }
  }

  // 搜索、筛选、排序变化时重新获取数据（防抖处理）
  useEffect(() => {
    if (!isLoading) {
      const debounceTimer = setTimeout(() => {
        // 总是重置到第一页并获取数据
        setCurrentPage(1)
        fetchPrompts(1, searchQuery, sortBy, sortOrder, filterStatus, approvalFilter)
      }, searchQuery ? 300 : 0) // 有搜索词时延迟300ms

      return () => clearTimeout(debounceTimer)
    }
  }, [searchQuery, filterStatus, approvalFilter, sortBy, sortOrder])

  // 页码变化时获取数据（仅当页码不是由上面的 useEffect 触发时）
  useEffect(() => {
    if (!isLoading && currentPage > 1) {
      fetchPrompts(currentPage, searchQuery, sortBy, sortOrder, filterStatus, approvalFilter)
    }
  }, [currentPage])

  // 处理搜索变化
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // 处理筛选变化
  const handleFilterChange = (value: string) => {
    setFilterStatus(value)
  }

  // 处理排序字段变化
  const handleSortByChange = (value: string) => {
    setSortBy(value)
  }

  // 处理排序顺序变化
  const handleSortOrderChange = (value: 'desc' | 'asc') => {
    setSortOrder(value)
  }

  // 处理审核状态筛选变化
  const handleApprovalFilterChange = (value: string) => {
    setApprovalFilter(value as 'all' | 'PENDING' | 'APPROVED' | 'REJECTED')
  }

  // 打开审核确认弹窗
  const openApprovalModal = (promptId: string, promptTitle: string, approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    setPendingApproval({ promptId, promptTitle, approvalStatus })
    setApprovalModalOpen(true)
  }

  // 关闭审核确认弹窗
  const closeApprovalModal = () => {
    setApprovalModalOpen(false)
    setPendingApproval(null)
  }

  // 确认审核操作
  const confirmApproval = async () => {
    if (!pendingApproval) return

    try {
      setOperationLoading(true)
      setError(null)

      const response = await api.approvePrompt(pendingApproval.promptId, pendingApproval.approvalStatus, lang)
      if (response.success) {
        closeApprovalModal()
        await fetchPrompts()
      } else {
        const errorMessage = (response as any).error?.message || tAdminPrompt('messages.approveFailed')
        setError(errorMessage)
        setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
      }
    } catch (error) {
      console.error(tAdminPrompt('messages.approveError'), error)
      const errorMessage = tAdminPrompt('messages.approveError') || '审核操作失败，请稍后重试'
      setError(errorMessage)
      setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
    } finally {
      setOperationLoading(false)
    }
  }

  // 打开编辑模态框
  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      title: prompt.title || '',
      content: prompt.content || '',
      description: prompt.description || '',
      tags: prompt.tags || [],
      imageUrls: (prompt as any).imageUrls || [],
      author: (prompt as any).author || '',
      visibility: prompt.isPublic ? PROMPT_VISIBILITY.PUBLIC : PROMPT_VISIBILITY.PRIVATE
    })
    setIsEditModalOpen(true)
  }

  // 删除提示词
  const handleDelete = async (promptId: string) => {
    if (!confirm(tAdminPrompt('deleteConfirm'))) return

    try {
      setOperationLoading(true)
      setError(null)

      const response = await api.deletePrompt({ id: promptId }, lang)
      if (response.success) {
        await fetchPrompts()
      } else {
        const errorMessage = (response as any).error?.message || tAdminPrompt('deleteFailed')
        setError(errorMessage)
        setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
      }
    } catch (error) {
      console.error(tAdminPrompt('deleteError'), error)
      const errorMessage = tAdminPrompt('messages.deleteError') || '网络错误，请稍后重试'
      setError(errorMessage)
      setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
    } finally {
      setOperationLoading(false)
    }
  }

  // 创建提示词
  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      const { t: tDashboard } = useTranslation(lang, 'dashboard')
      setError(tDashboard('titleAndContentRequired') || '标题和内容为必填项')
      setTimeout(() => setError(null), UI_CONFIG.TOAST_DEFAULT_DURATION)
      return
    }

    try {
      setOperationLoading(true)
      setError(null)

      const response = await api.createPrompt({
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        imageUrls: formData.imageUrls?.filter(url => url.trim() !== '') || undefined,
        author: formData.author,
        isPublic: formData.visibility === 'public',
        spaceId: 'admin'
      }, lang)

      if (response.success) {
        setIsCreateModalOpen(false)
        resetForm()
        await fetchPrompts()
      } else {
        const errorMessage = (response as any).error?.message || tAdminPrompt('createFailed')
        setError(errorMessage)
        setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
      }
    } catch (error) {
      console.error(tAdminPrompt('createError'), error)
      const errorMessage = tAdminPrompt('messages.createError') || '网络错误，请稍后重试'
      setError(errorMessage)
      setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
    } finally {
      setOperationLoading(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      description: '',
      tags: [],
      imageUrls: [],
      author: '',
      visibility: PROMPT_VISIBILITY.PRIVATE
    })
  }

  // 更新提示词
  const handleUpdate = async () => {
    if (!editingPrompt) return

    if (!formData.title.trim() || !formData.content.trim()) {
      const { t: tDashboard } = useTranslation(lang, 'dashboard')
      setError(tDashboard('titleAndContentRequired') || '标题和内容为必填项')
      setTimeout(() => setError(null), UI_CONFIG.TOAST_DEFAULT_DURATION)
      return
    }

    try {
      setOperationLoading(true)
      setError(null)

      const response = await api.updatePrompt({
        id: editingPrompt.id,
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        imageUrls: formData.imageUrls?.filter(url => url.trim() !== '') || undefined,
        author: formData.author,
        isPublic: formData.visibility === 'public'
      }, lang)

      if (response.success) {
        setIsEditModalOpen(false)
        setEditingPrompt(null)
        resetForm()
        await fetchPrompts()
      } else {
        const errorMessage = (response as any).error?.message || tAdminPrompt('updateFailed')
        setError(errorMessage)
        setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
      }
    } catch (error) {
      console.error(tAdminPrompt('updateError'), error)
      const errorMessage = tAdminPrompt('messages.updateError') || '网络错误，请稍后重试'
      setError(errorMessage)
      setTimeout(() => setError(null), UI_CONFIG.TOAST_ERROR_DURATION)
    } finally {
      setOperationLoading(false)
    }
  }

  return (
    <AdminPageWrapper lang={lang}>
      <div className="space-y-6">
        {/* 错误消息显示 */}
        {error && (
          <div className="bg-error-300 border-l-4 border-error-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-error-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-error-500">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-error-400 hover:text-error-500"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-100">{tAdminPrompt('promptsManagement.title')}</h1>
              <p className="text-text-200 mt-1">
                {tAdminPrompt('promptsManagement.description')}
              </p>
            </div>
            <div className="text-sm text-text-300">
              {tAdminPrompt('promptsManagement.totalCount', { count: totalPrompts })}
            </div>
          </div>
        </div>

        {/* 搜索工具栏 */}
        <SearchToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder={tAdminPrompt('search.placeholder')}
          filterStatus={filterStatus}
          onFilterChange={handleFilterChange}
          filterOptions={[
            { value: 'all', label: tAdminPrompt('filter.all') },
            { value: 'public', label: tAdminPrompt('filter.public') },
            { value: 'private', label: tAdminPrompt('filter.private') }
          ]}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          sortByOptions={[
            { value: 'updatedAt', label: tAdminPrompt('sort.updatedAt') },
            { value: 'createdAt', label: tAdminPrompt('sort.createdAt') },
            { value: 'title', label: tAdminPrompt('sort.title') },
            { value: 'useCount', label: tAdminPrompt('sort.useCount') }
          ]}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
          t={tAdminPrompt}
        />

        {/* 审核状态筛选 */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-200">{tAdminPrompt('approval.filterLabel') || '审核状态'}:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: tAdminPrompt('approval.all') || '全部' },
                { value: 'PENDING', label: tAdminPrompt('approval.pending') || '待审核' },
                { value: 'APPROVED', label: tAdminPrompt('approval.approved') || '已通过' },
                { value: 'REJECTED', label: tAdminPrompt('approval.rejected') || '已拒绝' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleApprovalFilterChange(option.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    approvalFilter === option.value
                      ? 'bg-primary-100 text-white'
                      : 'bg-bg-200 text-text-200 hover:bg-bg-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 提示词列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100"></div>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-300">{tAdminPrompt('messages.noPrompts')}</div>
              </div>
            ) : (
              <DataTable
                data={prompts}
                columns={[
                  {
                    key: 'title',
                    title: tAdminPrompt('table.title'),
                    width: '30%',
                    render: (value: string, record: Prompt) => (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-100">{value}</span>
                          {Array.isArray((record as any).imageUrls) && (record as any).imageUrls.filter((url: string) => url && url.trim()).length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded" title={tAdminPrompt('table.hasResources')}>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {(record as any).imageUrls.filter((url: string) => url && url.trim()).length}
                            </span>
                          )}
                          <div className="flex gap-1">
                            {record.isPublic && (
                              <span className="px-2 py-0.5 text-xs bg-primary-300 text-primary-100 rounded-full">
                                {tAdminPrompt('visibility.public')}
                              </span>
                            )}
                            {record.isPublic && (
                              <>
                                {(record as any).approvalStatus === 'APPROVED' && (
                                  <span className="px-2 py-0.5 text-xs bg-success-300 text-success-500 rounded-full">
                                    {tAdminPrompt('approval.approved') || '已通过'}
                                  </span>
                                )}
                                {(record as any).approvalStatus === 'PENDING' && (
                                  <span className="px-2 py-0.5 text-xs bg-warning-300 text-warning-500 rounded-full">
                                    {tAdminPrompt('approval.pending') || '待审核'}
                                  </span>
                                )}
                                {(record as any).approvalStatus === 'REJECTED' && (
                                  <span className="px-2 py-0.5 text-xs bg-error-300 text-error-500 rounded-full">
                                    {tAdminPrompt('approval.rejected') || '已拒绝'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {record.description && (
                          <p className="text-sm text-text-200 line-clamp-2">{record.description}</p>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'author',
                    title: tAdminPrompt('table.author') || '作者',
                    width: '8%',
                    render: (value: string) => (
                      <span className="text-sm text-text-200">{value || '-'}</span>
                    )
                  },
                  {
                    key: 'creatorName',
                    title: tAdminPrompt('table.creatorName') || '创建用户',
                    width: '10%',
                    render: (value: string, record: any) => (
                      <div className="space-y-0.5">
                        <span className="text-sm text-text-200 block">{value || '-'}</span>
                        {record.creatorEmail && (
                          <span className="text-xs text-text-300 block truncate" title={record.creatorEmail}>
                            {record.creatorEmail}
                          </span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'tags',
                    title: tAdminPrompt('table.tags'),
                    width: '10%',
                    render: (value: string[], record: Prompt) => {
                      const tagsToDisplay = (value || []).map(getName).slice(0, 3)
                      const remainingCount = (value?.length || 0) - 3

                      return (
                        <div className="flex flex-wrap gap-1">
                          {tagsToDisplay.length > 0 ? (
                            tagsToDisplay.map((tagName, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 text-xs bg-bg-200 text-text-200 rounded"
                                >
                                  {tagName}
                                </span>
                              ))
                            ) : (
                              <span className="text-text-300 text-sm">
                                {/* {tAdminPrompt('table.noTags')} */}
                              </span>
                            )}
                            {remainingCount > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-bg-300 text-text-200 rounded">
                                +{remainingCount}
                              </span>
                          )}
                        </div>
                      )
                    }
                  },
                  {
                    key: 'useCount',
                    title: tAdminPrompt('table.useCount'),
                    width: '8%',
                    render: (value: number) => (
                      <span className="px-2 py-1 text-sm bg-secondary-400 text-secondary-500 rounded-full">
                        {value || 0}{tAdminPrompt('table.times')}
                      </span>
                    )
                  },
                  {
                    key: 'createdAt',
                    title: tAdminPrompt('table.createdAt'),
                    width: '12%',
                    render: (value: string) => (
                      <div className="text-sm text-text-200">
                        <div>{new Date(value).toLocaleDateString(lang)}</div>
                        <div className="text-xs text-text-300">
                          {new Date(value).toLocaleTimeString(lang)}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'updatedAt',
                    title: tAdminPrompt('table.updatedAt'),
                    width: '12%',
                    render: (value: string, record: Prompt) => (
                      <div className="text-sm text-text-200">
                        {record.updatedAt !== record.createdAt ? (
                          <>
                            <div>{new Date(value).toLocaleDateString(lang)}</div>
                            <div className="text-xs text-text-300">
                              {new Date(value).toLocaleTimeString(lang)}
                            </div>
                          </>
                        ) : (
                          <span className="text-text-300">{tAdminPrompt('table.notUpdated')}</span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    title: tAdminPrompt('table.actions'),
                    width: '16%',
                    render: (_, record: Prompt) => (
                      <div className="flex gap-1">
                        {/* 审核按钮 - 只对公开提示词显示 */}
                        {record.isPublic && (
                          <>
                            {/* 审核通过按钮 */}
                            {(record as any).approvalStatus !== 'APPROVED' && (
                              <button
                                onClick={() => openApprovalModal(record.id, record.title, 'APPROVED')}
                                disabled={operationLoading}
                                className="p-1.5 rounded-md text-success-500 hover:bg-success-300/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={tAdminPrompt('buttons.approve') || '审核通过'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                            {/* 审核拒绝按钮 */}
                            {(record as any).approvalStatus !== 'REJECTED' && (
                              <button
                                onClick={() => openApprovalModal(record.id, record.title, 'REJECTED')}
                                disabled={operationLoading}
                                className="p-1.5 rounded-md text-error-500 hover:bg-error-300/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={tAdminPrompt('buttons.reject') || '审核拒绝'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                            {/* 重置为待审核按钮 */}
                            {(record as any).approvalStatus !== 'PENDING' && (
                              <button
                                onClick={() => openApprovalModal(record.id, record.title, 'PENDING')}
                                disabled={operationLoading}
                                className="p-1.5 rounded-md text-warning-500 hover:bg-warning-300/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={tAdminPrompt('buttons.resetToPending') || '重置为待审核'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(record)}
                          disabled={operationLoading}
                          className="p-1.5 rounded-md text-primary-100 hover:bg-primary-300/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={tAdminPrompt('buttons.edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={operationLoading}
                          className="p-1.5 rounded-md text-error-500 hover:bg-error-300/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={tAdminPrompt('buttons.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )
                  }
                ]}
                empty={tAdminPrompt('promptManagement.noPrompts')}
                pagination={{
                  current: currentPage,
                  pageSize: 8,
                  total: totalPrompts,
                  onChange: (page) => {
                    setCurrentPage(page);
                    fetchPrompts(page, searchQuery, sortBy, sortOrder);
                  }
                }}
                t={tCommon}
              />
            )}
          </div>
        </div>


        {/* 审核确认弹窗 */}
        <Modal open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
          <ModalContent className="sm:max-w-md">
            <ModalHeader>
              <ModalTitle>
                {pendingApproval?.approvalStatus === 'APPROVED'
                  ? (tAdminPrompt('approval.confirmApproveTitle') || '确认审核通过')
                  : pendingApproval?.approvalStatus === 'REJECTED'
                  ? (tAdminPrompt('approval.confirmRejectTitle') || '确认审核拒绝')
                  : (tAdminPrompt('approval.confirmResetTitle') || '确认重置为待审核')
                }
              </ModalTitle>
            </ModalHeader>
            <div className="p-6 pt-0">
              <p className="text-text-200 mb-4">
                {pendingApproval?.approvalStatus === 'APPROVED'
                  ? (tAdminPrompt('approval.confirmApproveMessage', { title: pendingApproval?.promptTitle }) || `确定要审核通过提示词「${pendingApproval?.promptTitle}」吗？审核通过后，该提示词将在提示词广场公开显示。`)
                  : pendingApproval?.approvalStatus === 'REJECTED'
                  ? (tAdminPrompt('approval.confirmRejectMessage', { title: pendingApproval?.promptTitle }) || `确定要拒绝提示词「${pendingApproval?.promptTitle}」吗？拒绝后，该提示词将不会在提示词广场显示。`)
                  : (tAdminPrompt('approval.confirmResetMessage', { title: pendingApproval?.promptTitle }) || `确定要将提示词「${pendingApproval?.promptTitle}」重置为待审核状态吗？`)
                }
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeApprovalModal}
                  disabled={operationLoading}
                >
                  {tAdminPrompt('approval.cancel') || '取消'}
                </Button>
                <Button
                  variant={pendingApproval?.approvalStatus === 'REJECTED' ? 'destructive' : 'default'}
                  onClick={confirmApproval}
                  disabled={operationLoading}
                >
                  {operationLoading
                    ? (tCommon('processing') || '处理中...')
                    : (pendingApproval?.approvalStatus === 'APPROVED'
                        ? (tAdminPrompt('buttons.approve') || '审核通过')
                        : pendingApproval?.approvalStatus === 'REJECTED'
                        ? (tAdminPrompt('buttons.reject') || '审核拒绝')
                        : (tAdminPrompt('buttons.resetToPending') || '重置为待审核')
                      )
                  }
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>

        {/* 提示词模态框 - 用于创建和编辑 */}
        <PromptModal
          open={isCreateModalOpen || isEditModalOpen}
          onOpenChange={(open) => {
            if (editingPrompt) { // 如果当前是编辑模式
              setIsEditModalOpen(open);
              if (!open) {
                setEditingPrompt(null);
                resetForm();
              }
            } else { // 否则是创建模式
              setIsCreateModalOpen(open);
              if (!open) {
                resetForm();
              }
            }
          }}
          formData={formData}
          setFormData={setFormData}
          editingPrompt={editingPrompt}
          operationLoading={operationLoading}
          onSubmit={editingPrompt ? handleUpdate : handleCreate}
          lang={lang}
          existingTags={allTags.map(tag => tag.key)}
        />
      </div>
    </AdminPageWrapper>
  )
}
