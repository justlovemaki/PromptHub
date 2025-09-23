import React from 'react'
import { Input, Card } from '@promptmanager/ui-components'

export interface SearchToolbarProps {
  // 搜索相关
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string

  // 筛选相关
  filterStatus: string
  onFilterChange: (value: string) => void
  filterOptions?: { value: string; label: string }[]

  // 排序相关
  sortBy: any
  onSortByChange: (value: any) => void
  sortByOptions?: { value: any; label: string }[]

  sortOrder: any
  onSortOrderChange: (value: any) => void
  
  // 翻译函数
  t?: (key: string, options?: any) => string
}

/**
 * 通用的搜索工具栏组件
 * 支持搜索输入、筛选条件、排序字段和排序方向的配置
 */
const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filterStatus,
  onFilterChange,
  filterOptions,
  sortBy,
  onSortByChange,
  sortByOptions,
  sortOrder,
  onSortOrderChange,
  t
}) => {
  // 设置默认值
  const defaultSearchPlaceholder = t ? t('search.placeholder') : "搜索...";
  const defaultFilterOptions = [
    { value: 'all', label: t ? t('search.filter.all') : '全部' },
    { value: 'public', label: t ? t('search.filter.public') : '公开' },
    { value: 'private', label: t ? t('search.filter.private') : '私有' }
  ];
  const defaultSortByOptions = [
    { value: 'updatedAt', label: t ? t('search.sortBy.updatedAt') : '更新时间' },
    { value: 'createdAt', label: t ? t('search.sortBy.createdAt') : '创建时间' },
    { value: 'title', label: t ? t('search.sortBy.title') : '标题' },
    { value: 'useCount', label: t ? t('search.sortBy.useCount') : '使用次数' }
  ];
  
  // 使用默认值或传入的值
  const actualSearchPlaceholder = searchPlaceholder || defaultSearchPlaceholder;
  const actualFilterOptions = filterOptions || defaultFilterOptions;
  const actualSortByOptions = sortByOptions || defaultSortByOptions;
  
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索输入框 */}
        <div className="flex-1">
          <Input
            key="search-input"
            placeholder={actualSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* 筛选和排序控件 */}
        <div className="flex gap-2">
          {/* 筛选下拉框 */}
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue min-w-[100px]"
          >
            {actualFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 排序字段下拉框 */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue min-w-[100px]"
          >
            {actualSortByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 排序方向下拉框 */}
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue min-w-[80px]"
          >
            <option value="desc">{t ? t('search.sortOrder.desc') : 'Descending'}</option>
            <option value="asc">{t ? t('search.sortOrder.asc') : 'Ascending'}</option>
          </select>
        </div>
      </div>
    </Card>
  )
}

export default SearchToolbar