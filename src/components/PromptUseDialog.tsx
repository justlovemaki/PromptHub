'use client'

import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription,
  ModalFooter,
  ModalClose 
} from '@promptmanager/ui-components'
import { Button } from '@promptmanager/ui-components'
import { Input } from '@promptmanager/ui-components'
import { parsePromptVariables, replacePromptVariables, replacePromptVariablesForPreview, api } from '@promptmanager/core-logic'
import type { Prompt } from '@promptmanager/core-logic'
import { useToast } from './ToastProvider'
import { useTranslation } from '@/i18n/client'

// ============== 接口定义 ==============

export interface PromptUseDialogProps {
  prompt: Prompt | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopySuccess?: (content: string) => void
  onRefreshPrompts?: () => void
  lang?: string
}

// ============== 主组件 ==============

export const PromptUseDialog: React.FC<PromptUseDialogProps> = ({
  prompt,
  open,
  onOpenChange,
  onCopySuccess,
  onRefreshPrompts,
  lang
}) => {
  const [variables, setVariables] = useState<string[]>([])
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [finalContent, setFinalContent] = useState('')
  const toast = useToast() // 在组件内部使用 toast
  const { t: tPrompt } = useTranslation(lang || 'zh-CN', 'prompt')
  const { t: tCommon } = useTranslation(lang || 'zh-CN', 'common')

  // 当提示词改变时，解析变量
  useEffect(() => {
    if (!prompt?.content) {
      setVariables([])
      setVariableValues({})
      setFinalContent('')
      return
    }

    const parsedVariables = parsePromptVariables(prompt.content)
    setVariables(parsedVariables)
    
    // 重置变量值
    const initialValues: Record<string, string> = {}
    parsedVariables.forEach(variable => {
      initialValues[variable] = ''
    })
    setVariableValues(initialValues)
    
    // 设置初始内容
    setFinalContent(prompt.content)
  }, [prompt?.content])

  // 当变量值改变时，实时更新最终内容
  useEffect(() => {
    if (!prompt?.content) return
    
    if (variables.length === 0) {
      setFinalContent(prompt.content)
    } else {
      // 使用预览版本的替换函数，只替换非空值
      const replacedContent = replacePromptVariablesForPreview(prompt.content, variableValues)
      setFinalContent(replacedContent)
    }
  }, [prompt?.content, variables, variableValues])

  // 处理变量值变化
  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }))
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // 降级方案：使用 document.execCommand
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const result = document.execCommand('copy')
        document.body.removeChild(textArea)
        return result
      }
    } catch (error) {
      console.error('复制失败:', error)
      return false
    }
  }

  // 处理使用提示词
  const handleUsePrompt = async () => {
    if (!prompt?.content) return

    setIsProcessing(true)

    // 如果没有变量，直接复制原内容
    if (variables.length === 0) {
      const success = await copyToClipboard(prompt.content)
      if (success) {
        toast.showSuccess(tPrompt('toast.success.title'), tPrompt('toast.success.message'))
        onCopySuccess?.(prompt.content)
        
        // 增加使用次数
        try {
          await api.incrementPromptUseCount(prompt.id, lang)
          // 刷新最近更新的提示词列表
          onRefreshPrompts?.()
        } catch (error) {
          console.error('增加使用次数失败:', error)
          // 不显示错误提示，因为复制已经成功
        }
        
        onOpenChange(false)
      } else {
        toast.showError(tPrompt('toast.error.title'), tPrompt('toast.error.message'))
      }
      setIsProcessing(false)
      return
    }

    // 检查是否所有变量都已填写
    const emptyVariables = variables.filter(variable => !variableValues[variable]?.trim())
    if (emptyVariables.length > 0) {
      toast.showWarning(tPrompt('toast.warning.title'), tPrompt('toast.warning.message', { variables: emptyVariables.join(', ') }))
      setIsProcessing(false)
      return
    }

    // 替换变量并复制
    const success = await copyToClipboard(finalContent)
    if (success) {
      toast.showSuccess(tPrompt('toast.success.title'), tPrompt('toast.success.message'))
      onCopySuccess?.(finalContent)
      
      // 增加使用次数
      try {
        await api.incrementPromptUseCount(prompt.id, lang)
        // 刷新最近更新的提示词列表
        onRefreshPrompts?.()
      } catch (error) {
        console.error('增加使用次数失败:', error)
        // 不显示错误提示，因为复制已经成功
      }
      
      onOpenChange(false)
    } else {
      toast.showError(tPrompt('toast.error.title'), tPrompt('toast.error.message'))
    }
    
    setIsProcessing(false)
  }

  // 检查是否可以使用提示词
  const canUsePrompt = variables.length === 0 || variables.every(variable => variableValues[variable]?.trim())

  if (!prompt) return null

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalClose onClick={() => onOpenChange(false)} />
        
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <ModalTitle>{tPrompt('dialog.title')}</ModalTitle>
              <ModalDescription>
                {variables.length > 0
                  ? tPrompt('dialog.hasVariables', { count: variables.length })
                  : tPrompt('dialog.noVariables')
                }
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
          {/* 提示词标题 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{prompt.title}</h3>
            <p className="text-sm text-gray-600">{prompt.description || tCommon('noDescription')}</p>
          </div>

          {/* 变量输入区域 */}
          {variables.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">{tPrompt('sections.variables')}</h4>
              <div className="space-y-4">
                {variables.map((variable, index) => (
                  <Input
                    key={variable}
                    label={`${variable}`}
                    placeholder={tPrompt('variables.placeholder', { variable })}
                    value={variableValues[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    helperText={tPrompt('variables.helperText', { variable })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 预览区域 */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">{tPrompt('sections.preview')}</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {finalContent}
              </pre>
            </div>
          </div>
        </div>

        <ModalFooter className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <div className="flex justify-end space-x-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              {tPrompt('buttons.cancel')}
            </Button>
            <Button
              onClick={handleUsePrompt}
              disabled={!canUsePrompt || isProcessing}
              isLoading={isProcessing}
            >
              {isProcessing ? tPrompt('buttons.processing') : tPrompt('buttons.use')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PromptUseDialog