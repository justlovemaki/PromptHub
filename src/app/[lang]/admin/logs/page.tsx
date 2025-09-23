'use client'

import { useState, useEffect } from 'react'
import { useAuth, api } from '@promptmanager/core-logic'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import type { SystemLog } from '@promptmanager/core-logic'
import AdminPageWrapper from '../../../../components/admin/AdminPageWrapper'
import { useTranslation } from '@/i18n/client'

interface LogsPageProps {
  params: {
    lang: string
  }
}

export default function LogsPage({ params }: LogsPageProps) {
  const { t } = useTranslation(params.lang, 'logs')
  const { lang } = params
  const { isLoading } = useAuth()

  // 日志级别标签组件
  const LogLevelBadge: React.FC<{ level: string }> = ({ level }) => {
    const colors = {
      INFO: 'bg-blue-100 text-blue-800',
      WARN: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800',
      DEBUG: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[level as keyof typeof colors] || colors.INFO}`}>
        {t(`levelLabels.${level}`) || level}
      </span>
    )
  }

  // 分类标签组件
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
        {t(`categoryLabels.${category}`) || category}
      </span>
    )
  }

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

  // 搜索、筛选、排序变化时重新获取数据（防抖处理）
  useEffect(() => {
    if (!isLoading) {
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
    if (!isLoading && currentPage > 0) {
      fetchLogs(currentPage, searchTerm, sortField, sortOrder);
    }
  }, [isLoading, currentPage])

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

      const result = await api.getSystemLogs(query, lang)

      if (result.success) {
        setLogs(result.data.logs || [])
        setTotalPages(result.data.totalPages || 1)
        setTotalLogs(result.data.total || 0)
      } else {
        setError(t('loading.getFailed'))
      }
    } catch (error) {
      console.error('Fetch logs error:', error)
      setError(error instanceof Error ? error.message : t('loading.getFailed'))
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

  return (
    <AdminPageWrapper lang={lang}>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-1">
                {t('description')}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {t('totalLogs', { count: totalLogs })}
            </div>
          </div>
        </div>

        {/* 搜索和筛选工具栏 */}
        <SearchToolbar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('searchPlaceholder')}
          filterStatus={filterLevel}
          onFilterChange={(value) => handleFilterChange(value, 'level')}
          filterOptions={[
            { value: 'all', label: t('filterOptions.allLevels') },
            { value: 'INFO', label: t('levels.info') },
            { value: 'WARN', label: t('levels.warn') },
            { value: 'ERROR', label: t('levels.error') },
            { value: 'DEBUG', label: t('levels.debug') }
          ]}
          sortBy={sortField}
          onSortByChange={(value) => {
            setSortField(value as string)
            setCurrentPage(1)
          }}
          sortByOptions={[
            { value: 'timestamp', label: t('sortOptions.time') },
            { value: 'level', label: t('sortOptions.level') },
            { value: 'category', label: t('sortOptions.category') }
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
            <h2 className="text-lg font-semibold text-gray-900">{t('tableHeaders.listTitle')}</h2>
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
                {t('retry')}
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? t('empty.noMatch') : t('empty.noData')}
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
                      {t('tableHeaders.time')}
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
                      {t('tableHeaders.level')}
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
                      {t('tableHeaders.category')}
                      {sortField === 'category' && (
                        <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="col-span-6">{t('tableHeaders.message')}</div>
                </div>
              </div>

              {/* 表格内容 */}
              <div className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      <div className="col-span-2">
                        <span className="text-gray-500 text-xs">
                          {new Date(log.timestamp).toLocaleString(params.lang)}
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
                              {t('details.showDetails')}
                            </summary>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-xs break-words">
                              <pre className="whitespace-pre-wrap">{log.details}</pre>
                            </div>
                          </details>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          {log.ip && (
                            <span title={`${t('details.ip')}: ${log.ip}`}>{t('details.ip')}: {log.ip}</span>
                          )}
                          {log.userEmail && (
                            <span title={`${t('details.user')}: ${log.userEmail}`}>{t('details.user')}: {log.userEmail}</span>
                          )}
                          {log.userAgent && (
                            <span className="truncate max-w-xs" title={log.userAgent}>
                              {t('details.userAgent')}: {log.userAgent}
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
                      {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('pagination.previous')}
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
                        {t('pagination.next')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  )
}