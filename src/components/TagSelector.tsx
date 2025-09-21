'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTags } from '../hooks/useTags'
import { Input, Button } from '@promptmanager/ui-components'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  language?: 'cn' | 'en' | 'ja'
  placeholder?: string
  className?: string
  maxTags?: number
  isEditing?: boolean // 新增：用于标识是否为编辑模式
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onChange,
  language = 'cn',
  placeholder = '点击选择标签...',
  className = '',
  maxTags = 10,
  isEditing = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const { tagsByCategory, searchTags, isLoaded } = useTags(language)

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

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      // Remove tag
      onChange(selectedTags.filter(tag => tag !== tagName))
    } else {
      // Add tag (if under limit)
      if (selectedTags.length < maxTags) {
        onChange([...selectedTags, tagName])
      }
    }
  }

  const handleRemoveTag = (tagName: string) => {
    onChange(selectedTags.filter(tag => tag !== tagName))
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
    let categories = tagsByCategory

    if (!searchQuery.trim()) {
      return categories
    }

    const searchResults = searchTags(searchQuery)
    const categoriesWithFilteredTags = categories.map(category => ({
      ...category,
      tags: category.tags.filter(tag => 
        searchResults.some(result => result.name === tag.name)
      )
    })).filter(category => category.tags.length > 0)

    return categoriesWithFilteredTags
  }

  if (!isLoaded) {
    return (
      <div className={`${className}`}>
        <div className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-500">
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
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCloseModal}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">选择标签</h3>
            <p className="text-sm text-gray-500 mt-1">
              已选择 {selectedTags.length}/{maxTags} 个标签
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100">
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索标签..."
            className="w-full rounded-xl px-4 py-3"
          />
        </div>

        {/* Selected tags display */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedTags.map((tagName) => (
              <span
                key={tagName}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tagName}
                <button
                  onClick={() => handleRemoveTag(tagName)}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                  type="button"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {selectedTags.length === 0 && (
              <span className="text-gray-400 text-sm py-2">暂无选择的标签</span>
            )}
          </div>
        </div>

        {/* Tags content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              {searchQuery ? '未找到匹配的标签' : '暂无可用标签'}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div key={`${category.sectionType}-${category.categoryName}`} className="space-y-3">
                  {/* Category header */}
                  <div className="border-b border-gray-200 pb-2">
                    <h4 className="text-base font-medium text-gray-900">
                      {category.categoryName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {category.sectionTitle}
                    </p>
                  </div>
                  
                  {/* Tags in this category */}
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name)
                      const isDisabled = !isSelected && selectedTags.length >= maxTags
                      
                      return (
                        <button
                          key={tag.name}
                          onClick={() => !isDisabled && handleTagToggle(tag.name)}
                          disabled={isDisabled}
                          className={`
                            px-4 py-2 text-sm rounded-lg border transition-all duration-200
                            ${isSelected 
                              ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                              : isDisabled
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
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
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button
            onClick={handleCloseModal}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
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
          {selectedTags.map((tagName) => (
            <span
              key={tagName}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {tagName}
              <button
                onClick={() => handleRemoveTag(tagName)}
                className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                type="button"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {selectedTags.length === 0 && (
            <span className="text-gray-400 text-sm py-1">暂无选择的标签</span>
          )}
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={handleOpenModal}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left text-gray-500 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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