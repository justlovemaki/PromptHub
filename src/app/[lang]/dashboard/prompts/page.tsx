'use client'

import AdminLayout from '../../../../components/layout/AdminLayout'
import { useAuth, api, type Prompt, type CreatePromptRequest, type UpdatePromptRequest, type PromptListQuery, type PromptListResponse, type PromptStats } from '@promptmanager/core-logic'
import { useState, useEffect } from 'react'
import { Button, Input, Textarea, Modal, ModalContent, ModalHeader, ModalTitle, Card, DataTable, Loading } from '@promptmanager/ui-components'
import { PromptUseButton } from '../../../../components/PromptUseButton'
import { ToastProvider } from '../../../../components/ToastProvider'

export default function PromptsManagementPage({ params }: { params: { lang: string } }) {
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
    tags: '',
    visibility: 'private'
  })

  // 页面加载时获取提示词列表和统计数据
  useEffect(() => {
    if (user && user.personalSpaceId && !hasInitialized) {
      setHasInitialized(true)
      fetchPrompts()
      fetchStats()
    }
  }, [user?.personalSpaceId])

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      
      const response = await api.getPromptStats({
        spaceId: user?.personalSpaceId || ''
      })
      
      if (response.success) {
        setStats(response.data)
      } else {
        console.error('获取统计数据失败:', (response as any).error?.message || '未知错误')
      }
    } catch (error) {
      console.error('获取统计数据错误:', error)
    } finally {
      setStatsLoading(false)
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
      
      const response = await api.getPrompts(query)
      
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
        console.error('获取提示词列表失败:', (response as any).error?.message || '未知错误')
      }
    } catch (error) {
      console.error('获取提示词列表错误:', error)
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

  // 错误状态
  if (error) {
    return (
      <AdminLayout lang={params.lang}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-4">加载失败</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // 处理创建提示词
  const handleCreatePrompt = async () => {
    if (!user?.personalSpaceId) {
      console.error('缺少用户空间信息')
      return
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      console.error('标题和内容不能为空')
      return
    }

    try {
      setOperationLoading(true)
      const createData: CreatePromptRequest = {
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        isPublic: formData.visibility === 'public',
        spaceId: user.personalSpaceId
      }

      const response = await api.createPrompt(createData)
      
      if (response.success) {
        console.log('Prompt created:', response.data)
        // 创建成功后重新获取第一页数据和统计数据
        setPagination(prev => ({ ...prev, page: 1 }))
        fetchPrompts()
        fetchStats()
        setShowCreateModal(false)
        resetForm()
      } else {
        console.error('创建提示词失败:', (response as any).error?.message || '未知错误')
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
      console.error('标题和内容不能为空')
      return
    }
    
    try {
      setOperationLoading(true)
      const updateData: UpdatePromptRequest = {
        id: editingPrompt.id,
        title: formData.title,
        content: formData.content,
        description: formData.description || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        isPublic: formData.visibility === 'public'
      }

      const response = await api.updatePrompt(updateData)
      
      if (response.success) {
        // 更新成功后重新获取当前页数据和统计数据
        fetchPrompts()
        fetchStats()
        setShowEditModal(false)
        resetForm()
        setEditingPrompt(null)
      } else {
        console.error('更新提示词失败:', (response as any).error?.message || '未知错误')
      }
    } catch (error) {
      console.error('更新提示词错误:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  // 处理删除提示词
  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('确定要删除这个提示词吗？此操作不可恢复。')) {
      return
    }
    
    try {
      setOperationLoading(true)
      const response = await api.deletePrompt({ id: promptId })
      
      if (response.success) {
        // 删除成功后重新获取当前页数据和统计数据
        fetchPrompts()
        fetchStats()
      } else {
        console.error('删除提示词失败:', (response as any).error?.message || '未知错误')
      }
    } catch (error) {
      console.error('删除提示词错误:', error)
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
      tags: '',
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
      tags: tagsArray.join(', '),
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
      title: '标题',
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
      key: 'isPublic',
      title: '可见性',
      width: 80,
      render: (prompt: boolean) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          prompt 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {prompt ? '公开' : '私有'}
        </span>
      )
    },
    {
      key: 'tags',
      title: '标签',
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
      title: '创建时间',
      width: 140,
      sortable: true,
      render: (prompt: string) => (
        <div className="text-sm text-gray-500">
          {prompt ? new Date(prompt).toLocaleString('zh-CN', {
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
      key: 'useCount',
      title: '使用次数',
      width: 100,
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
      key: 'updatedAt',
      title: '更新时间',
      width: 140,
      sortable: true,
      render: (prompt: string) => (
        <div className="text-sm text-gray-500">
          {prompt ? new Date(prompt).toLocaleString('zh-CN', {
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
      title: '操作',
      width: 180,
      render: (prompt: Prompt) => (
        <div className="flex space-x-2">
          <PromptUseButton
            prompt={prompt}
            variant="outline"
            size="sm"
            onRefreshPrompts={() => {
              fetchPrompts()
              fetchStats()
            }}
          >
            使用
          </PromptUseButton>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditModal(prompt)}
            disabled={operationLoading}
          >
            编辑
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => handleDeletePrompt(prompt.id || '')}
            disabled={operationLoading}
          >
            删除
          </Button>
        </div>
      )
    }
  ]

  return (
    <ToastProvider>
      <AdminLayout lang={params.lang}>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">提示词管理</h1>
              <p className="text-gray-600 mt-1">创建、编辑和管理你的 AI 提示词模板</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              创建新提示词
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">总提示词</p>
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
                <p className="text-sm font-medium text-gray-600">公开提示词</p>
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
                <p className="text-sm font-medium text-gray-600">私有提示词</p>
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
                <p className="text-sm font-medium text-gray-600">本月创建</p>
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
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索提示词标题、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="all">全部</option>
                <option value="public">公开</option>
                <option value="private">私有</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt' | 'title' | 'useCount')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="updatedAt">更新时间</option>
                <option value="createdAt">创建时间</option>
                <option value="title">标题</option>
                <option value="useCount">使用次数</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </Card>

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
                  {searchQuery || filterStatus !== 'all' ? '没有找到匹配的提示词' : '还没有创建任何提示词'}
                </div>
                {!searchQuery && filterStatus === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    创建第一个提示词
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
          <ModalContent size="xl">
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
            
            <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[65vh]">
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
                      placeholder="输入提示词的具体内容...\n\n提示：你可以使用变量占位符，如 {用户输入}、{主题} 等"
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
                          value={formData.visibility}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
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
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="写作, 营销, 创意"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                      <div className="mt-1 text-xs text-gray-500">用逗号分隔多个标签</div>
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
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open)
            if (!open) {
              resetForm()
              setEditingPrompt(null)
            }
          }}
        >
          <ModalContent size="xl">
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
            
            <div className="px-8 py-6 space-y-6 overflow-y-auto max-h-[65vh]">
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
                      placeholder="输入提示词的具体内容...\n\n提示：你可以使用变量占位符，如 {用户输入}、{主题} 等"
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
                          value={formData.visibility}
                          onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
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
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="写作, 营销, 创意"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl px-4 py-3"
                      />
                      <div className="mt-1 text-xs text-gray-500">用逗号分隔多个标签</div>
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
    </AdminLayout>
    </ToastProvider>
  )
}