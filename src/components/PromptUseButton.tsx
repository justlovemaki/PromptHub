'use client'

import React, { useState } from 'react'
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
  onRefreshPrompts?: () => void
): UsePromptDialogReturn => {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [open, setOpen] = useState(false)

  const openDialog = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setOpen(true)
  }

  const closeDialog = () => {
    setOpen(false)
    // 延迟清理，等待动画完成
    setTimeout(() => {
      setSelectedPrompt(null)
    }, 300)
  }

  const handleCopySuccess = (content: string) => {
    onCopySuccess?.(content)
    // 不在这里调用 toast，由 PromptUseDialog 内部处理
  }

  const PromptDialog = () => (
    <PromptUseDialog
      prompt={selectedPrompt}
      open={open}
      onOpenChange={setOpen}
      onCopySuccess={handleCopySuccess}
      onRefreshPrompts={onRefreshPrompts}
    />
  )

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
}

export const PromptUseButton: React.FC<PromptUseButtonProps> = ({
  prompt,
  onCopySuccess,
  onRefreshPrompts,
  variant = 'default',
  size = 'default',
  className,
  children = '使用'
}) => {
  const { openDialog, PromptDialog } = usePromptDialog(onCopySuccess, onRefreshPrompts)

  const handleClick = () => {
    openDialog(prompt)
  }

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
      <PromptDialog />
    </>
  )
}

export default PromptUseButton