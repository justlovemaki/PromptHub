'use client'

import { useState, useEffect } from 'react'
import AdminPageWrapper from '../../../../components/admin/AdminPageWrapper'
import { useAuth, api } from '@promptmanager/core-logic'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import { DataTable } from '@promptmanager/ui-components/src/components/data-table'
import { useTranslation } from '@/i18n/client'

import type { User } from '@promptmanager/core-logic'


export default function AdminUsersPage({ params }: { params: { lang: string } }) {
  const { t: tAdmin } = useTranslation(params.lang, 'admin')
  const { t: tCommon } = useTranslation(params.lang, 'common')
  const { isLoading, setLanguage } = useAuth()

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

  // 设置语言属性
  useEffect(() => {
    setLanguage(params.lang);
  }, [params.lang, setLanguage]);

  // DataTable 列配置
  const columns = [
    {
      key: 'userInfo' as const,
      title: tAdmin('users.tableHeaders.userInfo'),
      render: (value: any, user: User) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-brand-blue rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.name || tAdmin('users.unnamedUser')}
            </p>
            <p className="text-gray-500 text-xs truncate max-w-xs">
              {user.email}
            </p>
          </div>
        </div>
      ),
      width: 300,
      align: 'left' as const,
    },
    {
      key: 'role' as const,
      title: tAdmin('users.tableHeaders.role'),
      render: (value: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
          user.role === 'ADMIN'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {user.role === 'ADMIN' ? tAdmin('users.roleAdmin') : tAdmin('users.roleUser')}
        </span>
      ),
      width: 120,
      align: 'center' as const,
      sortable: true,
    },
    {
      key: 'subscriptionStatus' as const,
      title: tAdmin('users.tableHeaders.subscriptionStatus'),
      render: (value: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
          user.subscriptionStatus === 'PRO'
            ? 'bg-green-100 text-green-800'
            : user.subscriptionStatus === 'TEAM'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {user.subscriptionStatus === 'PRO' ? tAdmin('users.subscriptionPro') :
           user.subscriptionStatus === 'TEAM' ? tAdmin('users.subscriptionTeam') : tAdmin('users.subscriptionFree')}
        </span>
      ),
      width: 150,
      align: 'center' as const,
      sortable: true,
    },
    {
      key: 'createdAt' as const,
      title: tAdmin('users.tableHeaders.createdAt'),
      render: (value: any, user: User) => (
        <span className="text-gray-500 text-xs">
          {new Date(user.createdAt).toLocaleDateString(params.lang)}
        </span>
      ),
      width: 120,
      align: 'center' as const,
      sortable: true,
    },
    {
      key: 'actions' as const,
      title: tAdmin('users.tableHeaders.actions'),
      render: (value: any, user: User) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingUser(user)
            }}
            className="text-brand-blue hover:text-brand-blue/80 text-sm"
          >
            {tAdmin('buttons.edit')}
          </button>
        </div>
      ),
      width: 100,
      align: 'center' as const,
    }
  ]

  // 搜索、筛选、排序变化时重新获取数据（防抖处理）
  useEffect(() => {
    if (!isLoading) {
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
  // useEffect(() => {
  //   if (!isLoading && currentPage > 0) {
  //     fetchUsers(currentPage, searchTerm, sortField, sortOrder);
  //   }
  // }, [isLoading, currentPage])

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

      const result = await api.getAdminUsers(query, params.lang)

      if (result.success) {
        setUsers(result.data.users || [])
        setTotalPages(result.data.totalPages || 1)
        setTotalUsers(result.data.total || 0)
      } else {
        setError(tAdmin('users.fetchFailed'))
      }
    } catch (error) {
      console.error('Fetch users error:', error)
      setError(error instanceof Error ? error.message : tAdmin('users.fetchFailed'))
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
      }, params.lang)

      if (result.success) {
        // 重新加载用户数据
        fetchUsers(currentPage, searchTerm, sortField, sortOrder)
        setEditingUser(null)
        return true
      } else {
        setError(tAdmin('users.updateFailed'))
        return false
      }
    } catch (error) {
      console.error('Update user error:', error)
      setError(error instanceof Error ? error.message : tAdmin('users.updateFailed'))
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


  return (
    <AdminPageWrapper lang={params.lang}>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tAdmin('users.title')}</h1>
              <p className="text-gray-600 mt-1">
                {tAdmin('users.description')}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {tAdmin('users.totalUsers', { count: totalUsers })}
            </div>
          </div>
        </div>

        {/* 搜索和筛选工具栏 */}
        <SearchToolbar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={tAdmin('users.searchPlaceholder')}
          filterStatus={filterRole}
          onFilterChange={(value) => handleFilterChange(value, 'role')}
          filterOptions={[
            { value: 'all', label: tAdmin('users.filterOptions.allRoles') },
            { value: 'ADMIN', label: tAdmin('users.filterOptions.admin') },
            { value: 'USER', label: tAdmin('users.filterOptions.user') }
          ]}
          sortBy={sortField}
          onSortByChange={(value) => {
            setSortField(value as string)
            setCurrentPage(1)
          }}
          sortByOptions={[
            { value: 'createdAt', label: tAdmin('users.sortOptions.createdAt') },
            { value: 'name', label: tAdmin('users.sortOptions.name') },
            { value: 'email', label: tAdmin('users.sortOptions.email') }
          ]}
          sortOrder={sortOrder}
          onSortOrderChange={(value) => {
            setSortOrder(value as string)
            setCurrentPage(1)
          }}
          t={tAdmin}
        />

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{tAdmin('users.listTitle')}</h2>
          </div>

          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            empty={searchTerm ? tAdmin('users.empty.noMatch') : tAdmin('users.empty.noData')}
            onSort={(key, direction) => {
              const sortMap: Record<string, string> = {
                'userInfo': 'name',
                'role': 'role',
                'subscriptionStatus': 'subscriptionStatus',
                'createdAt': 'createdAt'
              }
              const actualSortField = sortMap[key] || key
              setSortField(actualSortField)
              setSortOrder(direction)
              setCurrentPage(1)
            }}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalUsers,
              onChange: (page) => setCurrentPage(page)
            }}
            t={tAdmin}
          />
        </div>
      </div>

      {/* 编辑用户模态框 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{tAdmin('users.editUserTitle')}</h3>
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
                    {tAdmin('users.emailLabel')}
                  </label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                    {editingUser.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tAdmin('users.nameLabel')}
                  </label>
                  <input
                    type="text"
                    defaultValue={editingUser.name || ''}
                    placeholder={tAdmin('users.namePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tAdmin('users.roleLabel')}
                  </label>
                  <select
                    defaultValue={editingUser.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    <option value="USER">{tAdmin('users.roleUser')}</option>
                    <option value="ADMIN">{tAdmin('users.roleAdmin')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tAdmin('users.subscriptionStatusLabel')}
                  </label>
                  <select
                    defaultValue={editingUser.subscriptionStatus}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    <option value="FREE">{tAdmin('users.subscriptionFree')}</option>
                    <option value="PRO">{tAdmin('users.subscriptionPro')}</option>
                    <option value="TEAM">{tAdmin('users.subscriptionTeam')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                {tCommon('cancel')}
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
                {isUpdating ? tCommon('updating') : tCommon('update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  )
}