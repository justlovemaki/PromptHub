'use client'

import { useState, useEffect } from 'react'
import AdminPageWrapper from '../../../../components/admin/AdminPageWrapper'
import { useAuth, api } from '@promptmanager/core-logic'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import { DataTable } from '@promptmanager/ui-components/src/components/data-table'
import { useTranslation } from '@/i18n/client'
import { USER_ROLES, SUBSCRIPTION_STATUS } from '@/lib/constants'

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
        <div className="flex space-x-3">
          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-text-100">
              {user.name || tAdmin('users.unnamedUser')}
            </p>
            <p className="text-text-300 text-xs truncate max-w-xs">
              {user.email}
            </p>
          </div>
        </div>
      ),
      width: 300,
    },
    {
      key: 'role' as const,
      title: tAdmin('users.tableHeaders.role'),
      render: (value: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
          user.role === USER_ROLES.ADMIN
            ? 'bg-error-400 text-error-500'
            : 'bg-bg-200 text-text-200'
        }`}>
          {user.role === USER_ROLES.ADMIN ? tAdmin('users.roleAdmin') : tAdmin('users.roleUser')}
        </span>
      ),
      width: 120,
      sortable: true,
    },
    {
      key: 'subscriptionStatus' as const,
      title: tAdmin('users.tableHeaders.subscriptionStatus'),
      render: (value: any, user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
          user.subscriptionStatus === SUBSCRIPTION_STATUS.PRO
            ? 'bg-success-400 text-success-500'
            : user.subscriptionStatus === SUBSCRIPTION_STATUS.TEAM
            ? 'bg-primary-300 text-primary-100'
            : 'bg-bg-200 text-text-200'
        }`}>
          {user.subscriptionStatus === SUBSCRIPTION_STATUS.PRO ? tAdmin('users.subscriptionPro') :
           user.subscriptionStatus === SUBSCRIPTION_STATUS.TEAM ? tAdmin('users.subscriptionTeam') : tAdmin('users.subscriptionFree')}
        </span>
      ),
      width: 150,
      sortable: true,
    },
    {
      key: 'createdAt' as const,
      title: tAdmin('users.tableHeaders.createdAt'),
      render: (value: any, user: User) => (
        <span className="text-text-300 text-xs">
          {new Date(user.createdAt).toLocaleDateString(params.lang)}
        </span>
      ),
      width: 120,
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
            className="text-primary-100 hover:text-primary-100/80 p-1.5 rounded-md hover:bg-primary-300/20 transition-colors"
            title={tAdmin('buttons.edit')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      ),
      width: 80,
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
        query.role = filterRole as typeof USER_ROLES[keyof typeof USER_ROLES]
      }
      if (filterSubscription !== 'all') {
        query.subscriptionStatus = filterSubscription as typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS]
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
              <h1 className="text-2xl font-bold text-text-100">{tAdmin('users.title')}</h1>
              <p className="text-text-200 mt-1">
                {tAdmin('users.description')}
              </p>
            </div>
            <div className="text-sm text-text-300">
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
            { value: USER_ROLES.ADMIN, label: tAdmin('users.filterOptions.admin') },
            { value: USER_ROLES.USER, label: tAdmin('users.filterOptions.user') }
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
          <div className="px-6 py-4 border-b border-bg-300">
            <h2 className="text-lg font-semibold text-text-100">{tAdmin('users.listTitle')}</h2>
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
              onChange: (page) => {
                setCurrentPage(page);
                fetchUsers(page, searchTerm, sortField, sortOrder);
              }
            }}
            t={tAdmin}
          />
        </div>
      </div>

      {/* 编辑用户模态框 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-bg-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-100">{tAdmin('users.editUserTitle')}</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-text-300 hover:text-text-200"
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
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {tAdmin('users.emailLabel')}
                  </label>
                  <p className="text-text-100 bg-bg-200 px-3 py-2 rounded">
                    {editingUser.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {tAdmin('users.nameLabel')}
                  </label>
                  <input
                    type="text"
                    defaultValue={editingUser.name || ''}
                    placeholder={tAdmin('users.namePlaceholder')}
                    className="w-full px-3 py-2 border border-bg-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {tAdmin('users.roleLabel')}
                  </label>
                  <select
                    defaultValue={editingUser.role}
                    className="w-full px-3 py-2 border border-bg-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-transparent"
                  >
                    <option value={USER_ROLES.USER}>{tAdmin('users.roleUser')}</option>
                    <option value={USER_ROLES.ADMIN}>{tAdmin('users.roleAdmin')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-200 mb-2">
                    {tAdmin('users.subscriptionStatusLabel')}
                  </label>
                  <select
                    defaultValue={editingUser.subscriptionStatus}
                    className="w-full px-3 py-2 border border-bg-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-transparent"
                  >
                    <option value={SUBSCRIPTION_STATUS.FREE}>{tAdmin('users.subscriptionFree')}</option>
                    <option value={SUBSCRIPTION_STATUS.PRO}>{tAdmin('users.subscriptionPro')}</option>
                    <option value={SUBSCRIPTION_STATUS.TEAM}>{tAdmin('users.subscriptionTeam')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-bg-300 flex justify-end space-x-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium text-text-200 bg-bg-200 border border-bg-300 rounded-lg hover:bg-bg-300"
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
                className="px-4 py-2 text-sm font-medium text-white bg-primary-100 border border-transparent rounded-lg hover:bg-primary-100/90 disabled:opacity-50"
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