'use client'

import { useState, useEffect } from 'react'
import { useAuth, api } from '@promptmanager/core-logic'
import SearchToolbar from '@promptmanager/ui-components/src/components/search-toolbar'
import { DataTable } from '@promptmanager/ui-components/src/components/data-table'
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
  const { isLoading, setLanguage } = useAuth()


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

  // 设置语言属性
  useEffect(() => {
    setLanguage(params.lang);
  }, [params.lang, setLanguage]);

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
  // useEffect(() => {
  //   if (!isLoading && currentPage > 0) {
  //     fetchLogs(currentPage, searchTerm, sortField, sortOrder);
  //   }
  // }, [isLoading, currentPage])

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
          t={t}
        />

        {/* 日志列表 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('tableHeaders.listTitle')}</h2>
          </div>

          <DataTable
            data={logs}
            columns={[
              {
                key: 'timestamp',
                title: t('tableHeaders.time'),
                width: '16.67%',
                sortable: true,
                render: (value: string) => (
                  <span className="text-gray-500 text-xs">
                    {new Date(value).toLocaleString(params.lang)}
                  </span>
                )
              },
              {
                key: 'level',
                title: t('tableHeaders.level'),
                width: '16.67%',
                sortable: true,
                render: (value: string) => {
                  const colors = {
                    INFO: 'bg-blue-100 text-blue-800',
                    WARN: 'bg-yellow-100 text-yellow-800',
                    ERROR: 'bg-red-100 text-red-800',
                    DEBUG: 'bg-gray-100 text-gray-800'
                  }
                  return (
                    <span className={`px-2 py-1 text-xs rounded-full ${colors[value as keyof typeof colors] || colors.INFO}`}>
                      {t(`levelLabels.${value}`) || value}
                    </span>
                  )
                }
              },
              {
                key: 'category',
                title: t('tableHeaders.category'),
                width: '16.67%',
                sortable: true,
                render: (value: string) => {
                  const colors = {
                    AUTH: 'bg-purple-100 text-purple-800',
                    API: 'bg-green-100 text-green-800',
                    USER: 'bg-blue-100 text-blue-800',
                    SYSTEM: 'bg-gray-100 text-gray-800',
                    SECURITY: 'bg-red-100 text-red-800',
                    PERFORMANCE: 'bg-orange-100 text-orange-800'
                  }
                  return (
                    <span className={`px-2 py-1 text-xs rounded-full ${colors[value as keyof typeof colors] || colors.SYSTEM}`}>
                      {t(`categoryLabels.${value}`) || value}
                    </span>
                  )
                }
              },
              {
                key: 'message',
                title: t('tableHeaders.message'),
                width: '50%',
                render: (value: string, record: SystemLog) => (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <p className="text-gray-800 font-medium break-words flex-1">
                        {value}
                      </p>
                      {record.statusCode && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded whitespace-nowrap">
                          {record.statusCode}
                        </span>
                      )}
                    </div>
                    {record.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                          {t('details.showDetails')}
                        </summary>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-xs break-words">
                          <pre className="whitespace-pre-wrap">{record.details}</pre>
                        </div>
                      </details>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {record.ip && (
                        <span title={`${t('details.ip')}: ${record.ip}`}>{t('details.ip')}: {record.ip}</span>
                      )}
                      {record.userEmail && (
                        <span title={`${t('details.user')}: ${record.userEmail}`}>{t('details.user')}: {record.userEmail}</span>
                      )}
                      {record.userAgent && (
                        <span className="truncate max-w-xs" title={record.userAgent}>
                          {t('details.userAgent')}: {record.userAgent}
                        </span>
                      )}
                    </div>
                  </div>
                )
              }
            ]}
            loading={loading}
            empty={searchTerm ? t('empty.noMatch') : t('empty.noData')}
            onSort={(key, direction) => {
              setSortField(key)
              setSortOrder(direction)
              setCurrentPage(1)
            }}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalLogs,
              onChange: (page) => setCurrentPage(page)
            }}
            t={t}
          />
        </div>
      </div>
    </AdminPageWrapper>
  )
}