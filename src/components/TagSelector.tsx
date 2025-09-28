'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTags } from '../hooks/useTags'
import { Input, Button } from '@promptmanager/ui-components'

interface TagSelectorProps {
  selectedKeys: string[]
  onChange: (keys: string[]) => void
  language: string
  placeholder?: string
  className?: string
  maxTags?: number
  isEditing?: boolean // 新增：用于标识是否为编辑模式
  existingTags?: (string | { name: string; count: number })[] // 新增：支持显示已存在的标签，兼容新旧格式
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedKeys,
  onChange,
  language,
  placeholder = '点击选择标签...',
  className = '',
  maxTags = 10,
  isEditing = false,
  existingTags = []
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const { tagsByCategory, searchTags, isLoaded, allTags } = useTags(language)

  // Create lookup maps for performance
  const keyToNameMap = useMemo(() => new Map(allTags.map(t => [t.key, t.name])), [allTags])
  
  // Create a list of selected tag objects { key, name } for stable rendering
  const selectedTagObjects = useMemo(
    () => selectedKeys
      .map(key => ({
        key,
        name: keyToNameMap.get(key)
      }))
      .filter((tag): tag is { key: string; name: string } => !!tag.name),
    [selectedKeys, keyToNameMap]
  )

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close modal on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleTagToggle = (tagKey: string) => {
    if (selectedKeys.includes(tagKey)) {
      // Remove tag
      onChange(selectedKeys.filter(key => key !== tagKey))
    } else {
      // Add tag (if under limit)
      if (selectedKeys.length < maxTags) {
        onChange([...selectedKeys, tagKey])
      }
    }
  }

  const handleRemoveTag = (keyToRemove: string) => {
    onChange(selectedKeys.filter(key => key !== keyToRemove))
  }

  const handleOpenModal = () => {
    setIsOpen(true)
    setSearchQuery('')
  }

  const handleCloseModal = () => {
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Filter categories and tags based on search and editing mode
  const getFilteredCategories = () => {
    let categories = tagsByCategory;

    if (!searchQuery.trim()) {
      return categories;
    }

    const searchResults = searchTags(searchQuery)
    const categoriesWithFilteredTags = categories.map(category => ({
      ...category,
      tags: category.tags.filter(tag =>
        searchResults.some(result => result.name === tag.name)
      )
    })).filter(category => category.tags.length > 0)

    return categoriesWithFilteredTags;
  }

  // 获取与搜索匹配的现有标签
  const getMatchingExistingTags = () => {
    if (!searchQuery.trim()) {
      return existingTags.length > 0 ? existingTags : [];
    }

    return existingTags.filter(tag => {
      // 如果existingTags是对象数组，使用name字段；如果是字符串数组，直接使用
      const tagName = typeof tag === 'string' ? tag : tag.name;
      const searchTerm = searchQuery.toLowerCase();
      return tagName.toLowerCase().includes(searchTerm);
    });
  }

  // 检查是否在搜索模式下
  const isSearchMode = searchQuery.trim() !== '';

  if (!isLoaded) {
    return (
      <div className={`${className}`}>
        <div className="border border-bg-300 rounded-xl px-4 py-3 bg-bg-200 text-text-300">
          加载标签数据中...
        </div>
      </div>
    )
  }

  const filteredCategories = getFilteredCategories()

  // Modal content
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg-900/50"
        onClick={handleCloseModal}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-300 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-100">选择标签</h3>
            <p className="text-sm text-text-300 mt-1">
              已选择 {selectedKeys.length}/{maxTags} 个标签
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-text-300 hover:text-text-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-bg-200">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索标签..."
            className="w-full rounded-xl px-4 py-3"
          />
        </div>

        {/* Selected tags display */}
        <div className="px-6 py-4 border-b border-bg-200">
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedTagObjects.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-300 text-primary-100 text-sm rounded-full"
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.key)}
                  className="ml-1 text-primary-100 hover:text-primary-100 transition-colors"
                  type="button"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {selectedKeys.length === 0 && (
              <span className="text-text-300 text-sm py-2">暂无选择的标签</span>
            )}
          </div>
        </div>

        {/* Tags content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 显示现有标签 - 如果有搜索匹配的现有标签 */}
          {getMatchingExistingTags().length > 0 && (
            <div className="mb-6 space-y-3">
              {/* 现有标签头部 */}
              <div className="border-b border-bg-300 pb-2">
                <h4 className="text-base font-medium text-text-100">现有标签</h4>
                <p className="text-sm text-text-300">来自您现有的提示词</p>
              </div>
              
              {/* 现有标签列表 */}
              <div className="flex flex-wrap gap-2">
                {getMatchingExistingTags().map((tagItem, index) => {
                  // 处理可能的字符串或对象格式
                  const tagKey = typeof tagItem === 'string' ? tagItem : tagItem.name;
                  const tagName = keyToNameMap.get(tagKey) || tagKey;
                  const isSelected = selectedKeys.includes(tagKey);
                  const isDisabled = !isSelected && selectedKeys.length >= maxTags;
                  
                  return (
                    <button
                      key={`existing-${tagKey}-${index}`}
                      onClick={() => !isDisabled && handleTagToggle(tagKey)}
                      disabled={isDisabled}
                      className={`
                        px-4 py-2 text-sm rounded-lg border transition-all duration-200
                        ${isSelected
                          ? 'bg-primary-100 text-white border-primary-100 hover:bg-primary-200'
                          : isDisabled
                            ? 'bg-bg-200 text-text-300 border-bg-300 cursor-not-allowed'
                            : 'bg-bg-100 text-text-200 border-bg-300 hover:bg-bg-200 hover:border-bg-400'
                        }
                      `}
                      title={`现有标签: ${typeof tagItem === 'string' ? tagName : `${tagName} (使用次数: ${tagItem.count})`}`}
                      type="button"
                    >
                      {tagName}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* 原始分类标签 */}
          {filteredCategories.length === 0 && getMatchingExistingTags().length === 0 ? (
            <div className="text-center text-text-300 py-12">
              {searchQuery ? '未找到匹配的标签' : '暂无可用标签'}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div key={`${category.sectionType}-${category.categoryName}`} className="space-y-3">
                  {/* Category header */}
                  <div className="border-b border-bg-300 pb-2">
                    <h4 className="text-base font-medium text-text-100">
                      {category.categoryName}
                    </h4>
                    <p className="text-sm text-text-300">
                      {category.sectionTitle}
                    </p>
                  </div>
                  
                  {/* Tags in this category */}
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag, index) => {
                      const isSelected = selectedKeys.includes(tag.key)
                      const isDisabled = !isSelected && selectedKeys.length >= maxTags
                      
                      return (
                        <button
                          key={`${tag.key}-${index}`}
                          onClick={() => !isDisabled && handleTagToggle(tag.key)}
                          disabled={isDisabled}
                          className={`
                            px-4 py-2 text-sm rounded-lg border transition-all duration-200
                            ${isSelected
                              ? 'bg-primary-100 text-white border-primary-100 hover:bg-primary-200'
                              : isDisabled
                                ? 'bg-bg-200 text-text-300 border-bg-300 cursor-not-allowed'
                                : 'bg-bg-100 text-text-200 border-bg-300 hover:bg-bg-200 hover:border-bg-400'
                            }
                          `}
                          title={tag.description}
                          type="button"
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bg-300 flex justify-end">
          <Button
            onClick={handleCloseModal}
            className="px-6 py-2 bg-primary-100 hover:bg-primary-200 text-white rounded-xl"
          >
            完成选择
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={className}>
      {/* Selected tags display */}
      <div className="mb-2">
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {selectedTagObjects.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-300 text-primary-100 text-sm rounded-full"
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.key)}
                className="ml-1 text-primary-100 hover:text-primary-100 transition-colors"
                type="button"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {selectedKeys.length === 0 && (
            <span className="text-text-300 text-sm py-1">暂无选择的标签</span>
          )}
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={handleOpenModal}
        className="w-full px-4 py-3 border border-bg-300 rounded-xl text-left text-text-300 hover:border-bg-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent"
        type="button"
      >
        {placeholder}
      </button>

      {/* Modal portal */}
      {mounted && isOpen && createPortal(modalContent, document.body)}
    </div>
  )
}

export default TagSelector