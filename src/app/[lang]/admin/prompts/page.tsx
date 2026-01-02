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
    author: '',
    visibility: PROMPT_VISIBILITY.PRIVATE
  })
  const [operationLoading, setOperationLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 设置语言属性
  useEffect(() => {
    setLanguage(lang);
  }, [lang, setLanguage]);

  // 获取提示词列表
  const fetchPrompts = async (page = currentPage, search = searchQuery, sort = sortBy, order = sortOrder) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.getAdminPrompts({
        page,
        limit: 8,
        search: search || undefined,
        sortBy: sort || 'updatedAt',
        sortOrder: order || 'desc',
        isPublic: filterStatus === 'public' ? true : filterStatus === 'private' ? false : undefined
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
        if (currentPage !== 1) {
          setCurrentPage(1) // 重置到第一页
        } else {
          fetchPrompts(1, searchQuery, sortBy, sortOrder) // 立即获取数据
        }
      }, searchQuery ? 300 : 0) // 有搜索词时延迟300ms

      return () => clearTimeout(debounceTimer)
    }
  }, [searchQuery, filterStatus, sortBy, sortOrder])

  // 页码变化时获取数据
  // useEffect(() => {
  //   if (!isLoading && currentPage > 0) {
  //     fetchPrompts()
  //   }
  // }, [isLoading, currentPage])

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

  // 打开编辑模态框
  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      title: prompt.title || '',
      content: prompt.content || '',
      description: prompt.description || '',
      tags: prompt.tags || [],
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

        {/* 提示词列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100"></div>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-300">{tAdminPrompt('noPrompts')}</div>
              </div>
            ) : (
              <DataTable
                data={prompts}
                columns={[
                  {
                    key: 'title',
                    title: tAdminPrompt('table.title'),
                    width: '25%',
                    render: (value: string, record: Prompt) => (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-100">{value}</span>
                          <div className="flex gap-1">
                            {record.isPublic && (
                              <span className="px-2 py-0.5 text-xs bg-primary-300 text-primary-100 rounded-full">
                                {tAdminPrompt('visibility.public')}
                              </span>
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
                    width: '15%',
                    render: (value: string) => (
                      <span className="text-sm text-text-200">{value || '-'}</span>
                    )
                  },
                  {
                    key: 'tags',
                    title: tAdminPrompt('table.tags'),
                    width: '15%',
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
                    width: '15%',
                    render: (value: number) => (
                      <span className="px-2 py-1 text-sm bg-secondary-400 text-secondary-500 rounded-full">
                        {value || 0}{tAdminPrompt('table.times')}
                      </span>
                    )
                  },
                  {
                    key: 'createdAt',
                    title: tAdminPrompt('table.createdAt'),
                    width: '20%',
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
                    width: '20%',
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
                    width: '10%',
                    render: (_, record: Prompt) => (
                      <div className="flex gap-1">
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
