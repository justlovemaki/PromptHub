'use client'

import { useState, useEffect } from 'react'
import { useAuth, api } from '@promptmanager/core-logic'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import type { SystemLog } from '@promptmanager/core-logic'
import AdminPanelLayout from '../../../../components/layout/AdminPanelLayout'

interface LogsPageProps {
  params: {
    lang: string
  }
}

const LogLevelBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors = {
    INFO: 'bg-blue-100 text-blue-800',
    WARN: 'bg-yellow-100 text-yellow-800',
    ERROR: 'bg-red-100 text-red-800',
    DEBUG: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[level as keyof typeof colors] || colors.INFO}`}>
      {level}
    </span>
  )
}

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const colors = {
    AUTH: 'bg-purple-100 text-purple-800',
    API: 'bg-green-100 text-green-800',
    USER: 'bg-blue-100 text-blue-800',
    SYSTEM: 'bg-gray-100 text-gray-800',
    SECURITY: 'bg-red-100 text-red-800',
    PERFORMANCE: 'bg-orange-100 text-orange-800'
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[category as keyof typeof colors] || colors.SYSTEM}`}>
      {category}
    </span>
  )
}

export default function LogsPage({ params }: LogsPageProps) {
  const { lang } = params
  const [isClient, setIsClient] = useState(false)
  const { isAdmin, isLoading } = useAuth()

  // 日志数据状态
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 分页和搜索状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')

  // 筛选状态
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

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
          fetchLogs(1, searchTerm, sortField, sortOrder) // 立即获取数据
        }
      }, searchTerm ? 300 : 0) // 有搜索词时延迟300ms

      return () => clearTimeout(debounceTimer)
    }
  }, [searchTerm, filterLevel, filterCategory, sortField, sortOrder])

  // 页码变化时获取数据
  useEffect(() => {
    if (isClient && isAdmin && !isLoading && currentPage > 0) {
      fetchLogs(currentPage, searchTerm, sortField, sortOrder);
    }
  }, [isClient, isAdmin, isLoading, currentPage])

  // 加载日志数据
  const fetchLogs = async (page = 1, search = '', sort = 'timestamp', order = 'desc') => {
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
      if (filterLevel !== 'all') {
        query.level = filterLevel as 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
      }
      if (filterCategory !== 'all') {
        query.category = filterCategory as 'AUTH' | 'API' | 'USER' | 'SYSTEM' | 'SECURITY' | 'PERFORMANCE'
      }

      const result = await api.getSystemLogs(query)

      if (result.success) {
        setLogs(result.data.logs || [])
        setTotalPages(result.data.totalPages || 1)
        setTotalLogs(result.data.total || 0)
      } else {
        setError('获取系统日志失败')
      }
    } catch (error) {
      console.error('Fetch logs error:', error)
      setError(error instanceof Error ? error.message : '获取系统日志失败')
    } finally {
      setLoading(false)
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
  const handleFilterChange = (value: string, filterType: 'level' | 'category') => {
    if (filterType === 'level') {
      setFilterLevel(value)
    } else {
      setFilterCategory(value)
    }
    setCurrentPage(1) // 筛选时重置到第一页
  }

  // 在服务端渲染期间显示布局和加载状态
  if (!isClient) {
    return (
      <AdminPanelLayout lang={lang}>
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
      <AdminPanelLayout lang={lang}>
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
    <AdminPanelLayout lang={lang}>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">系统日志管理</h1>
              <p className="text-gray-600 mt-1">
                查看和管理系统操作日志
              </p>
            </div>
            <div className="text-sm text-gray-500">
              共 {totalLogs} 条日志
            </div>
          </div>
        </div>

        {/* 搜索和筛选工具栏 */}
        <SearchToolbar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="搜索日志内容..."
          filterStatus={filterLevel}
          onFilterChange={(value) => handleFilterChange(value, 'level')}
          filterOptions={[
            { value: 'all', label: '所有级别' },
            { value: 'INFO', label: 'INFO' },
            { value: 'WARN', label: 'WARN' },
            { value: 'ERROR', label: 'ERROR' },
            { value: 'DEBUG', label: 'DEBUG' }
          ]}
          sortBy={sortField}
          onSortByChange={(value) => {
            setSortField(value as string)
            setCurrentPage(1)
          }}
          sortByOptions={[
            { value: 'timestamp', label: '时间' },
            { value: 'level', label: '级别' },
            { value: 'category', label: '分类' }
          ]}
          sortOrder={sortOrder}
          onSortOrderChange={(value) => {
            setSortOrder(value as string)
            setCurrentPage(1)
          }}
        />

        {/* 日志列表 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">日志列表</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={() => fetchLogs(currentPage, searchTerm, sortField, sortOrder)}
                className="px-4 py-2 bg-brand-blue text-white rounded hover:bg-brand-blue/90"
              >
                重试
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? '未找到匹配的日志' : '暂无日志数据'}
            </div>
          ) : (
            <>
              {/* 表头 */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-900">
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort('timestamp')}
                      className="flex items-center hover:text-gray-700"
                    >
                      时间
                      {sortField === 'timestamp' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort('level')}
                      className="flex items-center hover:text-gray-700"
                    >
                      级别
                      {sortField === 'level' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort('category')}
                      className="flex items-center hover:text-gray-700"
                    >
                      分类
                      {sortField === 'category' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-6">消息</div>
                </div>
              </div>

              {/* 表格内容 */}
              <div className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-2">
                        <span className="text-gray-500 text-xs">
                          {new Date(log.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <LogLevelBadge level={log.level} />
                      </div>
                      <div className="col-span-2">
                        <CategoryBadge category={log.category} />
                      </div>
                      <div className="col-span-6">
                        <div className="flex items-start space-x-2">
                          <p className="text-gray-800 font-medium break-words flex-1">
                            {log.message}
                          </p>
                          {log.statusCode && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded whitespace-nowrap">
                              {log.statusCode}
                            </span>
                          )}
                        </div>
                        {log.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                              查看详情
                            </summary>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-xs break-words">
                              <pre className="whitespace-pre-wrap">{log.details}</pre>
                            </div>
                          </details>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          {log.ip && (
                            <span title={`IP: ${log.ip}`}>IP: {log.ip}</span>
                          )}
                          {log.userEmail && (
                            <span title={`用户: ${log.userEmail}`}>用户: {log.userEmail}</span>
                          )}
                          {log.userAgent && (
                            <span className="truncate max-w-xs" title={log.userAgent}>
                              UA: {log.userAgent}
                            </span>
                          )}
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
    </AdminPanelLayout>
  )
}