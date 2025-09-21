'use client'

import { useMemo } from 'react'

// Tags data type definitions
export interface TagLabel {
  name: string
  description: string
}

export interface TagCategory {
  category_name: string
  labels: TagLabel[]
}

export interface TagSection {
  title: string
  description: string
  categories: Record<string, TagCategory>
}

export interface TagsData {
  prompt_tags_classification: {
    scenario_tags: TagSection
    intent_tags: TagSection
  }
}

export interface FlatTag {
  name: string
  description: string
  categoryName: string
  sectionType: 'scenario' | 'intent'
  sectionTitle: string
}

/**
 * Hook for managing prompt tags data
 * Reads tags from environment variables and provides utilities for tag management
 */
export function useTags(language: 'cn' | 'en' | 'ja' = 'cn') {
  const tagsData = useMemo(() => {
    try {
      let envVar: string
      switch (language) {
        case 'en':
          envVar = process.env.PROMPT_TAGS_EN || '{}'
          break
        case 'ja':
          envVar = process.env.PROMPT_TAGS_JA || '{}'
          break
        default:
          envVar = process.env.PROMPT_TAGS_CN || '{}'
      }
      
      const parsed = JSON.parse(envVar) as TagsData
      return parsed
    } catch (error) {
      console.error('Failed to parse tags data:', error)
      return null
    }
  }, [language])

  // Get flattened list of all tags organized by category
  const tagsByCategory = useMemo(() => {
    if (!tagsData?.prompt_tags_classification) return []

    const categories: Array<{
      categoryName: string
      sectionType: 'scenario' | 'intent'
      sectionTitle: string
      tags: TagLabel[]
    }> = []

    // Process scenario tags
    const scenarioTags = tagsData.prompt_tags_classification.scenario_tags
    Object.entries(scenarioTags.categories).forEach(([categoryKey, category]) => {
      categories.push({
        categoryName: category.category_name,
        sectionType: 'scenario',
        sectionTitle: scenarioTags.title,
        tags: category.labels
      })
    })

    // Process intent tags
    const intentTags = tagsData.prompt_tags_classification.intent_tags
    Object.entries(intentTags.categories).forEach(([categoryKey, category]) => {
      categories.push({
        categoryName: category.category_name,
        sectionType: 'intent',
        sectionTitle: intentTags.title,
        tags: category.labels
      })
    })

    return categories
  }, [tagsData])

  // Get flattened list of all tags
  const allTags = useMemo(() => {
    return tagsByCategory.flatMap(category =>
      category.tags.map(tag => ({
        ...tag,
        categoryName: category.categoryName,
        sectionType: category.sectionType,
        sectionTitle: category.sectionTitle
      }))
    )
  }, [tagsByCategory])

  // Search tags by name
  const searchTags = (query: string): FlatTag[] => {
    if (!query.trim()) return allTags
    
    const lowerQuery = query.toLowerCase()
    return allTags.filter(tag =>
      tag.name.toLowerCase().includes(lowerQuery) ||
      tag.description.toLowerCase().includes(lowerQuery) ||
      tag.categoryName.toLowerCase().includes(lowerQuery)
    )
  }

  // Get tags by section type
  const getTagsBySection = (sectionType: 'scenario' | 'intent') => {
    return tagsByCategory.filter(category => category.sectionType === sectionType)
  }

  return {
    tagsData,
    tagsByCategory,
    allTags,
    searchTags,
    getTagsBySection,
    isLoaded: !!tagsData
  }
}