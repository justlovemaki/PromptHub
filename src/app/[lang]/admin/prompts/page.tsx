'use client'

import React, { useState, useEffect } from 'react'
import AdminPanelLayout from '@/components/layout/AdminPanelLayout'
import SearchToolbar from '../../../../../packages/ui-components/src/components/search-toolbar'
import { DataTable, Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalTitle } from '@promptmanager/ui-components'
import TagSelector from '@/components/TagSelector'
import { api, useAuth } from '@promptmanager/core-logic'
import type { Prompt } from '@promptmanager/core-logic'

interface AdminPromptsPageProps {
  params: {
    lang: string
  }
}

interface PromptFormData {
  title: string
  content: string
  description: string
  tags: string[]
  isPublic: boolean
}

const AdminPromptsPage: React.FC<AdminPromptsPageProps> = ({ params }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  
  // PromptManagement 组件的状态
  const [isClient, setIsClient] = useState(false)
  const { isAdmin, isLoading } = useAuth()
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
    isPublic: false
  })
  const [operationLoading, setOperationLoading] = useState(false)

  // 客户端 hydration 检查
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 获取提示词列表
  const fetchPrompts = async (page = currentPage, search = searchQuery, sort = sortBy, order = sortOrder) => {
    try {
      setLoading(true)

      const response = await api.getAdminPrompts({
        page,
        limit: 8,
        search: search || undefined,
        sortBy: sort || 'updatedAt',
        sortOrder: order || 'desc',
        isPublic: filterStatus === 'public' ? true : filterStatus === 'private' ? false : undefined
      })

      if (response.success) {
        setPrompts(response.data.prompts || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalPrompts(response.data.total || 0)
      } else {
        console.error('获取提示词失败')
      }
    } catch (error) {
      console.error('获取提示词错误:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索、筛选、排序变化时重新获取数据（防抖处理）
  useEffect(() => {
    if (isClient && isAdmin && !isLoading) {
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
  useEffect(() => {
    if (isClient && isAdmin && !isLoading && currentPage > 0) {
      fetchPrompts()
    }
  }, [isClient, isAdmin, isLoading, currentPage])

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
      isPublic: prompt.isPublic || false
    })
    setIsEditModalOpen(true)
  }

  // 删除提示词
  const handleDelete = async (promptId: string) => {
    if (!confirm('确定要删除这个提示词吗？此操作不可恢复。')) return

    try {
      setOperationLoading(true)
      const response = await api.deletePrompt({ id: promptId })
      if (response.success) {
        await fetchPrompts()
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('删除提示词错误:', error)
      alert('删除失败')
    } finally {
      setOperationLoading(false)
    }
  }

  // 创建提示词
  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('标题和内容不能为空')
      return
    }

    try {
      setOperationLoading(true)
      const response = await api.createPrompt({
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        isPublic: formData.isPublic,
        spaceId: 'admin'
      })

      if (response.success) {
        setIsCreateModalOpen(false)
        resetForm()
        await fetchPrompts()
      } else {
        alert('创建失败')
      }
    } catch (error) {
      console.error('创建提示词错误:', error)
      alert('创建失败')
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
      isPublic: false
    })
  }

  // 更新提示词
  const handleUpdate = async () => {
    if (!editingPrompt) return

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('标题和内容不能为空')
      return
    }

    try {
      setOperationLoading(true)
      const response = await api.updatePrompt({
        id: editingPrompt.id,
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        isPublic: formData.isPublic
      })

      if (response.success) {
        setIsEditModalOpen(false)
        setEditingPrompt(null)
        resetForm()
        await fetchPrompts()
      } else {
        alert('更新失败')
      }
    } catch (error) {
      console.error('更新提示词错误:', error)
      alert('更新失败')
    } finally {
      setOperationLoading(false)
    }
  }

  // 在服务端渲染期间显示加载状态
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-96">
      </div>
    )
  }

  // 权限检查
  if (isLoading) {
    return (
      <AdminPanelLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </AdminPanelLayout>
    )
  }

  // 权限检查
  if (!isAdmin) {
    return (
      <AdminPanelLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">访问被拒绝</div>
            <p className="text-gray-600">您没有管理员权限，无法访问此功能。</p>
          </div>
        </div>
      </AdminPanelLayout>
    )
  }

  return (
    <AdminPanelLayout lang={params.lang}>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">提示词管理</h1>
              <p className="text-gray-600 mt-1">
                管理系统中的所有提示词，进行创建、编辑、删除等操作
              </p>
            </div>
            <div className="text-sm text-gray-500">
              共 {totalPrompts} 条提示词
            </div>
          </div>
        </div>

        {/* 搜索工具栏 */}
        <SearchToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="搜索提示词..."
          filterStatus={filterStatus}
          onFilterChange={handleFilterChange}
          filterOptions={[
            { value: 'all', label: '全部' },
            { value: 'public', label: '公开' },
            { value: 'private', label: '私有' }
          ]}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          sortByOptions={[
            { value: 'updatedAt', label: '更新时间' },
            { value: 'createdAt', label: '创建时间' },
            { value: 'title', label: '标题' },
            { value: 'useCount', label: '使用次数' }
          ]}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />

        {/* 提示词列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
              </div>
            ) : prompts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">暂无提示词</div>
              </div>
            ) : (
              <DataTable
                data={prompts}
                columns={[
                  {
                    key: 'title',
                    title: '标题',
                    width: '25%',
                    render: (value: string, record: Prompt) => (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{value}</span>
                          <div className="flex gap-1">
                            {record.isPublic && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                公开
                              </span>
                            )}
                          </div>
                        </div>
                        {record.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{record.description}</p>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'tags',
                    title: '标签',
                    width: '20%',
                    render: (value: string[], record: Prompt) => (
                      <div className="flex flex-wrap gap-1">
                        {value && value.length > 0 ? (
                          value.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">暂无标签</span>
                        )}
                        {value && value.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                            +{value.length - 3}
                          </span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'useCount',
                    title: '使用次数',
                    width: '15%',
                    render: (value: number) => (
                      <span className="px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                        {value || 0} 次
                      </span>
                    )
                  },
                  {
                    key: 'createdAt',
                    title: '创建时间',
                    width: '20%',
                    render: (value: string) => (
                      <div className="text-sm text-gray-600">
                        <div>{new Date(value).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(value).toLocaleTimeString()}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'updatedAt',
                    title: '更新时间',
                    width: '20%',
                    render: (value: string, record: Prompt) => (
                      <div className="text-sm text-gray-600">
                        {record.updatedAt !== record.createdAt ? (
                          <>
                            <div>{new Date(value).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(value).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">未更新</span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    title: '操作',
                    width: '15%',
                    render: (_, record: Prompt) => (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(record)}
                          disabled={operationLoading}
                          className="px-2 py-1 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(record.id)}
                          disabled={operationLoading}
                          className="px-2 py-1 text-xs border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </Button>
                      </div>
                    )
                  }
                ]}
                empty="暂无提示词"
              />
            )}
          </div>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {currentPage} 页 / 共 {totalPages} 页
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}

        {/* 创建提示词模态框 */}
        <Modal
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            setIsCreateModalOpen(open)
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
                    <div className="text-xl font-bold text-gray-900">创建新提示词</div>
                    <div className="text-sm text-gray-500 font-normal">创建一个新的 AI 提示词模板</div>
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
                    基本信息
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        标题 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="为你的提示词起一个清晰的标题"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        描述
                      </label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="简短描述这个提示词的用途和场景"
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
                    提示词内容
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      内容 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="输入提示词的具体内容..."
                      rows={6}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none rounded-xl px-4 py-3"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      字符数：{formData.content.length}
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
                    设置选项
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        可见性
                      </label>
                      <div className="relative">
                        <select
                          value={formData.isPublic ? 'public' : 'private'}
                          onChange={(e) => setFormData({ ...formData, isPublic: e.target.value === 'public' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 appearance-none pr-10"
                        >
                          <option value="private">🔒 私有 - 仅自己可见</option>
                          <option value="public">🌐 公开 - 所有人可见</option>
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
                        标签
                      </label>
                      <TagSelector
                        selectedTags={formData.tags}
                        onChange={(tags) => setFormData({ ...formData, tags })}
                        language="cn"
                        placeholder="点击选择标签..."
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
                  填写必填字段后即可创建
                </span>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleCreate}
                  disabled={operationLoading || !formData.title.trim() || !formData.content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  {operationLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      创建中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      创建提示词
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>

        {/* 编辑提示词模态框 */}
        <Modal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open)
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
                    <div className="text-xl font-bold text-gray-900">编辑提示词</div>
                    <div className="text-sm text-gray-500 font-normal">修改已有的提示词内容和设置</div>
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
                    基本信息
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        标题 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="为你的提示词起一个清晰的标题"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        描述
                      </label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="简短描述这个提示词的用途和场景"
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
                    提示词内容
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      内容 <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="输入提示词的具体内容..."
                      rows={6}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none rounded-xl px-4 py-3"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      字符数：{formData.content.length}
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
                    设置选项
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        可见性
                      </label>
                      <div className="relative">
                        <select
                          value={formData.isPublic ? 'public' : 'private'}
                          onChange={(e) => setFormData({ ...formData, isPublic: e.target.value === 'public' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 appearance-none pr-10"
                        >
                          <option value="private">🔒 私有 - 仅自己可见</option>
                          <option value="public">🌐 公开 - 所有人可见</option>
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
                        标签
                      </label>
                      <TagSelector
                        selectedTags={formData.tags}
                        onChange={(tags) => setFormData({ ...formData, tags })}
                        language="cn"
                        placeholder="点击选择标签..."
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
                  修改后的内容将立即生效
                </span>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleUpdate}
                  disabled={operationLoading || !formData.title.trim() || !formData.content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  {operationLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      保存更改
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      </div>
    </AdminPanelLayout>
  )
}

export default AdminPromptsPage