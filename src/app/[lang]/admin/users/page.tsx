'use client'

import { useState, useEffect } from 'react'
import AdminPanelLayout from '../../../../components/layout/AdminPanelLayout'
import { useAuth, api } from '@promptmanager/core-logic'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'

import type { User } from '@promptmanager/core-logic'


export default function AdminUsersPage({ params }: { params: { lang: string } }) {
  const [isClient, setIsClient] = useState(false)
  const { isAdmin, isLoading } = useAuth()

  // 用户数据状态
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 分页和搜索状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // 筛选状态
  const [filterRole, setFilterRole] = useState('all')
  const [filterSubscription, setFilterSubscription] = useState('all')

  // 编辑状态
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // 客户端 hydration 检查
  useEffect(() => {
    setIsClient(true)
  }, [])


  // 搜索、筛选、排序变化时重新获取数据（防抖处理）
  useEffect(() => {
    if (isClient && isAdmin && !isLoading) {
      const debounceTimer = setTimeout(() => {
        if (currentPage !== 1) {
          setCurrentPage(1) // 重置到第一页
        } else {
          fetchUsers(1, searchTerm, sortField, sortOrder) // 立即获取数据
        }
      }, searchTerm ? 300 : 0) // 有搜索词时延迟300ms

      return () => clearTimeout(debounceTimer)
    }
  }, [searchTerm, filterRole, filterSubscription, sortField, sortOrder])

  // 页码变化时获取数据
  useEffect(() => {
    if (isClient && isAdmin && !isLoading && currentPage > 0) {
      fetchUsers(currentPage, searchTerm, sortField, sortOrder);
    }
  }, [isClient, isAdmin, isLoading, currentPage])

  // 加载用户数据
  const fetchUsers = async (page = 1, search = '', sort = 'createdAt', order = 'desc') => {
    try {
      setLoading(true)
      setError(null)

      const query: any = {
        page,
        limit: pageSize,
        sort: sort,
        order: order,
        search: search || undefined
      }

      // 添加筛选条件
      if (filterRole !== 'all') {
        query.role = filterRole as 'USER' | 'ADMIN'
      }
      if (filterSubscription !== 'all') {
        query.subscriptionStatus = filterSubscription as 'FREE' | 'PRO' | 'TEAM'
      }

      const result = await api.getAdminUsers(query)

      if (result.success) {
        setUsers(result.data.users || [])
        setTotalPages(result.data.totalPages || 1)
        setTotalUsers(result.data.total || 0)
      } else {
        setError('获取用户数据失败')
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      setError(error instanceof Error ? error.message : '获取用户数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新用户信息
  const updateUser = async (userId: string, updates: any) => {
    try {
      setIsUpdating(true)

      const result = await api.updateAdminUser({
        userId,
        ...(updates.role !== undefined && { role: updates.role }),
        ...(updates.subscriptionStatus !== undefined && { subscriptionStatus: updates.subscriptionStatus }),
        ...(updates.subscriptionEndDate !== undefined && { subscriptionEndDate: updates.subscriptionEndDate }),
        ...(updates.name !== undefined && { name: updates.name }),
      })

      if (result.success) {
        // 重新加载用户数据
        fetchUsers(currentPage, searchTerm, sortField, sortOrder)
        setEditingUser(null)
        return true
      } else {
        setError('更新用户失败')
        return false
      }
    } catch (error) {
      console.error('Update user error:', error)
      setError(error instanceof Error ? error.message : '更新用户失败')
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  // 处理排序
  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortOrder(newOrder)
    setCurrentPage(1) // 排序时重置到第一页
  }

  // 处理筛选变化
  const handleFilterChange = (value: string, filterType: 'role' | 'subscription') => {
    if (filterType === 'role') {
      setFilterRole(value)
    } else {
      setFilterSubscription(value)
    }
    setCurrentPage(1) // 筛选时重置到第一页
  }


  // 在服务端渲染期间显示布局和加载状态
  if (!isClient) {
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
            <p className="text-gray-600">您没有管理员权限，无法访问此页面。</p>
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
              <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
              <p className="text-gray-600 mt-1">
                管理系统用户账户、权限和订阅状态
              </p>
            </div>
            <div className="text-sm text-gray-500">
              共 {totalUsers} 个用户
            </div>
          </div>
        </div>

        {/* 搜索和筛选工具栏 */}
        <SearchToolbar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="搜索用户邮箱、姓名..."
          filterStatus={filterRole}
          onFilterChange={(value) => handleFilterChange(value, 'role')}
          filterOptions={[
            { value: 'all', label: '所有角色' },
            { value: 'ADMIN', label: '管理员' },
            { value: 'USER', label: '普通用户' }
          ]}
          sortBy={sortField}
          onSortByChange={(value) => {
            setSortField(value as string)
            setCurrentPage(1)
          }}
          sortByOptions={[
            { value: 'createdAt', label: '创建时间' },
            { value: 'name', label: '姓名' },
            { value: 'email', label: '邮箱' }
          ]}
          sortOrder={sortOrder}
          onSortOrderChange={(value) => {
            setSortOrder(value as string)
            setCurrentPage(1)
          }}
        />

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={() => fetchUsers(currentPage, searchTerm, sortField, sortOrder)}
                className="px-4 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue/90"
              >
                重试
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? '未找到匹配的用户' : '暂无用户数据'}
            </div>
          ) : (
            <>
              {/* 表头 */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-900">
                  <div className="col-span-3">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-gray-700"
                    >
                      用户信息
                      {sortField === 'name' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center hover:text-gray-700"
                    >
                      角色
                      {sortField === 'role' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort('subscriptionStatus')}
                      className="flex items-center hover:text-gray-700"
                    >
                      订阅状态
                      {sortField === 'subscriptionStatus' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center hover:text-gray-700"
                    >
                      创建时间
                      {sortField === 'createdAt' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-3">操作</div>
                </div>
              </div>

              {/* 表格内容 */}
              <div className="divide-y divide-gray-200">
                {users.map((user) => (
                  <div key={user.id} className="px-6 py-4">
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-brand-blue rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name || '未设置姓名'}
                            </p>
                            <p className="text-gray-500 text-xs truncate max-w-xs">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          user.subscriptionStatus === 'PRO'
                            ? 'bg-green-100 text-green-800'
                            : user.subscriptionStatus === 'TEAM'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.subscriptionStatus === 'PRO' ? 'Pro' :
                           user.subscriptionStatus === 'TEAM' ? 'Team' : 'Free'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500 text-xs">
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-brand-blue hover:text-brand-blue/80 text-sm"
                          >
                            编辑
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      第 {currentPage} 页，共 {totalPages} 页
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded ${
                              pageNum === currentPage
                                ? 'bg-brand-blue text-white border-brand-blue'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 编辑用户模态框 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">编辑用户</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    {editingUser.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    defaultValue={editingUser.name || ''}
                    placeholder="请输入用户姓名"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    角色
                  </label>
                  <select
                    defaultValue={editingUser.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    <option value="USER">普通用户</option>
                    <option value="ADMIN">管理员</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    订阅状态
                  </label>
                  <select
                    defaultValue={editingUser.subscriptionStatus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="TEAM">Team</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  const modalForm = document.querySelector('.fixed.inset-0 .bg-white') as HTMLElement
                  const formContainer = modalForm?.querySelector('div.space-y-4') as HTMLElement
                  const updates: any = {}

                  // 获取角色和订阅状态的select元素
                  const roleSelect = formContainer?.querySelectorAll('select')[0] as HTMLSelectElement
                  const subscriptionStatusSelect = formContainer?.querySelectorAll('select')[1] as HTMLSelectElement

                  // 收集文本输入
                  const nameInput = formContainer?.querySelector('input[type="text"]') as HTMLInputElement
                  if (nameInput) {
                    updates.name = nameInput.value
                  }

                  // 收集角色选择
                  if (roleSelect) {
                    updates.role = roleSelect.value
                  }

                  // 收集订阅状态选择
                  if (subscriptionStatusSelect) {
                    updates.subscriptionStatus = subscriptionStatusSelect.value
                  }

                  const success = await updateUser(editingUser.id, updates)
                  if (success) {
                    setEditingUser(null)
                  }
                }}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-blue border border-transparent rounded-lg hover:bg-brand-blue/90 disabled:opacity-50"
              >
                {isUpdating ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanelLayout>
  )
}