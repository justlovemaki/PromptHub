'use client'

import React, { useState, useCallback, useMemo, memo } from 'react'
import { PromptUseDialog } from './PromptUseDialog'
import { Button } from '@promptmanager/ui-components'
import type { Prompt } from '@promptmanager/core-logic'

// ============== Hook：用于管理提示词使用对话框 ==============

export interface UsePromptDialogReturn {
  openDialog: (prompt: Prompt) => void
  closeDialog: () => void
  PromptDialog: React.ComponentType
}

export const usePromptDialog = (
  onCopySuccess?: (content: string) => void,
  onRefreshPrompts?: () => void,
  lang?: string
): UsePromptDialogReturn => {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [open, setOpen] = useState(false)

  const openDialog = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setOpen(false)
    // 延迟清理，等待动画完成
    setTimeout(() => {
      setSelectedPrompt(null)
    }, 300)
  }, [])

  const handleCopySuccess = useCallback((content: string) => {
    onCopySuccess?.(content)
    // 不在这里调用 toast，由 PromptUseDialog 内部处理
  }, [onCopySuccess])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // 延迟清理，等待动画完成
      setTimeout(() => {
        setSelectedPrompt(null)
      }, 300)
    }
  }, [])

  // 使用 memo 包装对话框组件，避免不必要的重新渲染
  const PromptDialog = useMemo(() => {
    return memo(() => (
      <PromptUseDialog
        prompt={selectedPrompt}
        open={open}
        onOpenChange={handleOpenChange}
        onCopySuccess={handleCopySuccess}
        onRefreshPrompts={onRefreshPrompts}
        lang={lang}
      />
    ))
  }, [selectedPrompt, open, handleOpenChange, handleCopySuccess, onRefreshPrompts, lang])

  return {
    openDialog,
    closeDialog,
    PromptDialog
  }
}

// ============== 便捷按钮组件 ==============

export interface PromptUseButtonProps {
  prompt: Prompt
  onCopySuccess?: (content: string) => void
  onRefreshPrompts?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
  lang?: string
}

export const PromptUseButton: React.FC<PromptUseButtonProps> = memo(({
  prompt,
  onCopySuccess,
  onRefreshPrompts,
  variant = 'default',
  size = 'default',
  className,
  children = '',
  lang
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [open, setOpen] = useState(false)

  const handleClick = useCallback(() => {
    setSelectedPrompt(prompt)
    setOpen(true)
  }, [prompt])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // 延迟清理，等待动画完成
      setTimeout(() => {
        setSelectedPrompt(null)
      }, 300)
    }
  }, [])

  const handleCopySuccess = useCallback((content: string) => {
    onCopySuccess?.(content)
  }, [onCopySuccess])

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        {children}
      </Button>
      <PromptUseDialog
        prompt={selectedPrompt}
        open={open}
        onOpenChange={handleOpenChange}
        onCopySuccess={handleCopySuccess}
        onRefreshPrompts={onRefreshPrompts}
        lang={lang}
      />
    </>
  )
})

// 添加显示名称，便于调试
PromptUseButton.displayName = 'PromptUseButton'

export default PromptUseButton