'use client'

import UserPageWrapper from '../../../components/admin/UserPageWrapper'
import { useAuth, api, type Prompt, type CreatePromptRequest, type UpdatePromptRequest, type PromptListQuery, type PromptListResponse, type PromptStats } from '@promptmanager/core-logic'
import { useState, useEffect } from 'react'
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalTitle, Card, DataTable, Loading } from '@promptmanager/ui-components'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import { PromptUseButton } from '../../../components/PromptUseButton'
import TagSelector from '../../../components/TagSelector'
import { useTranslation } from '@/i18n/client'

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
  const { user, isLoading, error } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [stats, setStats] = useState<PromptStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [operationLoading, setOperationLoading] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

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
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title' | 'useCount'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 新建/编辑表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: [] as string[], // Changed to array
    visibility: 'private'
  })

  // 页面加载时获取提示词列表和统计数据
  useEffect(() => {
    if (user && user.personalSpaceId && !hasInitialized) {
      setHasInitialized(true)
      fetchPrompts()
      fetchStats()
      fetchRecentPrompts()
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

  // 获取提示词列表
  const fetchPrompts = async () => {
    try {
      setPromptsLoading(true)
      
      const query: PromptListQuery = {
        spaceId: user?.personalSpaceId,
        search: searchQuery || undefined,
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

  // 搜索和筛选变化时重新获取数据，重置到第一页
  useEffect(() => {
    if (hasInitialized) {
      const debounceTimer = setTimeout(() => {
        if (pagination.page !== 1) {
          setPagination(prev => ({ ...prev, page: 1 }))
        } else {
          fetchPrompts()
        }
      }, 300)
      
      return () => clearTimeout(debounceTimer)
    }
  }, [searchQuery, filterStatus, sortBy, sortOrder])

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
        tags: formData.tags.length > 0 ? formData.tags : undefined,
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
        setShowCreateModal(false)
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
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        isPublic: formData.visibility === 'public'
      }

      const response = await api.updatePrompt(updateData, params.lang)
      
      if (response.success) {
        // 更新成功后重新获取当前页数据和统计数据
        fetchPrompts()
        fetchStats()
        fetchRecentPrompts()
        setShowEditModal(false)
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
    if (!confirm(tDashboard('deleteConfirm'))) {
      return
    }
    
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
    setShowEditModal(true)
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
          <div className="font-medium text-gray-900">{record.title}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      )
    },
    {
      key: 'useCount',
      title: tDashboard('table.usageCount'),
      width: 150,
      sortable: true,
      render: (prompt: number) => (
        <div className="text-sm text-gray-900 font-medium flex items-center gap-1">
          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {prompt ? tDashboard('public') : tDashboard('private')}
        </span>
      )
    },
    {
      key: 'tags',
      title: tDashboard('table.tags'),
      width: 200,
      render: (prompt: string[]) => {
        // 解析tags字段
        let tagsArray: string[] = prompt
        
        return (
          <div className="flex flex-wrap gap-1">
            {tagsArray.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
            {tagsArray.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">+{tagsArray.length - 3}</span>
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
        <div className="text-sm text-gray-500">
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
        <div className="text-sm text-gray-500">
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
      width: 180,
      render: (prompt: Prompt) => (
        <div className="flex space-x-2">
          <PromptUseButton
            prompt={prompt}
            variant="outline"
            size="sm"
            lang={params.lang}
            onRefreshPrompts={() => {
              fetchPrompts()
              fetchStats()
            }}
          >
            {tDashboard('use')}
          </PromptUseButton>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditModal(prompt)}
            disabled={operationLoading}
          >
            {tDashboard('edit')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeletePrompt(prompt.id || '')}
            disabled={operationLoading}
          >
            {tDashboard('delete')}
          </Button>
        </div>
      )
    }
  ]

  return (
      <UserPageWrapper lang={params.lang} error={error}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tDashboard('pageTitle')}</h1>
              <p className="text-gray-600 mt-1">{tDashboard('pageDescription')}</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              {tDashboard('createNewPrompt')}
            </Button>
          </div>
        </div>

        {/* 最近更新的提示词 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{tDashboard('recentPrompts.title')}</h2>
                <p className="text-gray-600 text-sm mt-1">{tDashboard('recentPrompts.description')}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchRecentPrompts}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
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
                <div className="text-red-500 mb-2">{tDashboard('loadingFailed')}</div>
                <p className="text-gray-600 text-sm mb-4">{recentPromptsError}</p>
                <button
                  onClick={fetchRecentPrompts}
                  className="text-brand-blue hover:text-brand-blue/80 font-medium text-sm"
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
                        ? 'text-xs bg-green-100 text-green-800 px-2 py-1 rounded'
                        : 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded',
                      text: prompt.isPublic ? tDashboard('public') : tDashboard('private')
                    }

                    return (
                      <div key={prompt.id} className="bg-gray-50 rounded-lg border hover:shadow-md transition-shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate" title={prompt.title}>
                            {prompt.title}
                          </h3>
                          <span className={visibilityBadge.className}>{visibilityBadge.text}</span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2" title={prompt.description || tDashboard('noDescription')}>
                          {prompt.description || tDashboard('noDescription')}
                        </p>

                        {/* 标签显示 */}
                        {prompt.tags && prompt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {prompt.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {prompt.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{prompt.tags.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mb-4">
                          <div>{tDashboard('table.updatedAt')}：{prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleString(params.lang, {
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

                        <div className="flex space-x-2">
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
                    <div className="text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">{tDashboard('noPromptsYet')}</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      {tDashboard('createFirstPrompt')}
                    </button>
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
                <p className="text-sm font-medium text-gray-600">{tDashboard('totalPrompts')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '-' : (stats?.totalPrompts || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{tDashboard('publicPrompts')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '-' : (stats?.publicPrompts || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 104 0 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{tDashboard('privatePrompts')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '-' : (stats?.privatePrompts || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{tDashboard('monthlyCreated')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '-' : (stats?.monthlyCreated || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

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
                <div className="text-gray-500 mb-4">
                  {searchQuery || filterStatus !== 'all' ? tDashboard('noPromptsFound') : tDashboard('noPromptsYet')}
                </div>
                {!searchQuery && filterStatus === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    {tDashboard('createFirstPrompt')}
                  </Button>
                )}
              </div>
            }
            onSort={(key, direction) => {
              setSortBy(key as 'createdAt' | 'updatedAt' | 'title' | 'useCount')
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

        {/* 创建提示词模态框 */}
        <Modal
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open)
            if (!open) resetForm()
          }}
        >
          <ModalContent size="2xl">
            <ModalHeader>
              <ModalTitle>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{tDashboard('createModal.title')}</div>
                    <div className="text-sm text-gray-500 font-normal">{tDashboard('createModal.description')}</div>
                  </div>
                </div>
              </ModalTitle>
            </ModalHeader>
            
            <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="grid gap-6">
                {/* 基本信息区域 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-3">
                    <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {tDashboard('basicInfo')}
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('title')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={tDashboard('placeholders.title')}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('description')}
                      </label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={tDashboard('placeholders.description')}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                    </div>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-3">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {tDashboard('promptContent')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {tDashboard('content')} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={tDashboard('placeholders.content')}
                      rows={6}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none rounded-xl px-4 py-3"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {tDashboard('characterCount')}{formData.content.length}
                    </div>
                  </div>
                </div>

                {/* 设置区域 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-3">
                    <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {tDashboard('settings')}
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('visibility')}
                      </label>
                      <div className="relative">
                        <select
                          value={formData.visibility}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 appearance-none pr-10"
                        >
                          <option value="private">{tDashboard('privateVisibility')}</option>
                          <option value="public">{tDashboard('publicVisibility')}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('tags')}
                      </label>
                      <TagSelector
                        selectedTags={formData.tags}
                        onChange={(tags) => setFormData({ ...formData, tags })}
                        language={params.lang === 'zh-CN' ? 'cn' : params.lang === 'en' ? 'en' : 'ja'}
                        placeholder={tDashboard('tagSelectorPlaceholder')}
                        className=""
                        isEditing={!!editingPrompt}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部操作区域 */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
              <div className="text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {tDashboard('requiredFieldsHint')}
                </span>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleCreatePrompt} 
                  disabled={operationLoading || !formData.title.trim() || !formData.content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  {operationLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {tDashboard('creating')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {tDashboard('createPrompt')}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>

        {/* 编辑提示词模态框 */}
        <Modal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open)
            if (!open) {
              resetForm()
              setEditingPrompt(null)
            }
          }}
        >
          <ModalContent size="2xl">
            <ModalHeader>
              <ModalTitle>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{tDashboard('editPrompt')}</div>
                    <div className="text-sm text-gray-500 font-normal">{tDashboard('editPromptDescription')}</div>
                  </div>
                </div>
              </ModalTitle>
            </ModalHeader>
            
            <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="grid gap-6">
                {/* 基本信息区域 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-3">
                    <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {tDashboard('basicInfo')}
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('title')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={tDashboard('placeholders.title')}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('description')}
                      </label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={tDashboard('placeholders.description')}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                    </div>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-3">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {tDashboard('promptContent')}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {tDashboard('content')} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={tDashboard('placeholders.content')}
                      rows={6}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none rounded-xl px-4 py-3"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {tDashboard('characterCount')}{formData.content.length}
                    </div>
                  </div>
                </div>

                {/* 设置区域 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b border-gray-100 pb-3">
                    <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {tDashboard('settings')}
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('visibility')}
                      </label>
                      <div className="relative">
                        <select
                          value={formData.visibility}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 appearance-none pr-10"
                        >
                          <option value="private">{tDashboard('privateVisibility')}</option>
                          <option value="public">{tDashboard('publicVisibility')}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tDashboard('tags')}
                      </label>
                      <TagSelector
                        selectedTags={formData.tags}
                        onChange={(tags) => setFormData({ ...formData, tags })}
                        language={params.lang === 'zh-CN' ? 'cn' : params.lang === 'en' ? 'en' : 'ja'}
                        placeholder={tDashboard('tagSelectorPlaceholder')}
                        className=""
                        isEditing={!!editingPrompt}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部操作区域 */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
              <div className="text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {tDashboard('changesWillTakeEffect')}
                </span>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleEditPrompt} 
                  disabled={operationLoading || !formData.title.trim() || !formData.content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  {operationLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {tDashboard('saving')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {tDashboard('saveChanges')}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      </div>
    </UserPageWrapper>
  )
}