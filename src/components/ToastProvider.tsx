'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { UI_CONFIG } from "@/lib/constants";

// ============== 消息类型定义 ==============

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

export interface ToastContextType {
  showToast: (message: Omit<ToastMessage, 'id'>) => void
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  showWarning: (title: string, description?: string) => void
  showInfo: (title: string, description?: string) => void
}

// ============== Context ==============

const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// ============== Toast 组件 ==============

const Toast: React.FC<{
  message: ToastMessage
  onRemove: (id: string) => void
}> = ({ message, onRemove }) => {
  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return (
          <div className="h-5 w-5 text-success-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="h-5 w-5 text-error-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="h-5 w-5 text-warning-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      case 'info':
      default:
        return (
          <div className="h-5 w-5 text-primary-100">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getBorderColor = () => {
    switch (message.type) {
      case 'success': return 'border-success-300'
      case 'error': return 'border-error-300'
      case 'warning': return 'border-warning-300'
      case 'info': return 'border-primary-300'
      default: return 'border-bg-300'
    }
  }

  const getBgColor = () => {
    switch (message.type) {
      case 'success': return 'bg-success-300'
      case 'error': return 'bg-error-300'
      case 'warning': return 'bg-warning-300'
      case 'info': return 'bg-primary-300'
      default: return 'bg-white'
    }
  }

  React.useEffect(() => {
    const duration = message.duration || UI_CONFIG.TOAST_DEFAULT_DURATION
    const timer = setTimeout(() => {
      onRemove(message.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [message.id, message.duration, onRemove])

  return (
    <div className={`
      flex items-start p-4 mb-3 rounded-lg border shadow-sm
      ${getBgColor()} ${getBorderColor()}
      animate-in slide-in-from-right-full duration-300 ease-out
    `}>
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-100">{message.title}</p>
        {message.description && (
          <p className="text-sm text-text-200 mt-1">{message.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(message.id)}
        className="flex-shrink-0 ml-3 text-text-300 hover:text-text-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ============== Toast Container ==============

const ToastContainer: React.FC<{
  messages: ToastMessage[]
  onRemove: (id: string) => void
}> = ({ messages, onRemove }) => {
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || messages.length === 0) return null

  return createPortal(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-96 max-w-[calc(100vw-2rem)]">
      {messages.map(message => (
        <Toast
          key={message.id}
          message={message}
          onRemove={onRemove}
        />
      ))}
    </div>,
    document.body
  )
}

// ============== Provider ==============

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }, [])

  const showToast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newMessage: ToastMessage = { ...message, id }
    
    setMessages(prev => [...prev, newMessage])
  }, [])

  const showSuccess = useCallback((title: string, description?: string) => {
    showToast({ type: 'success', title, description })
  }, [showToast])

  const showError = useCallback((title: string, description?: string) => {
    showToast({ type: 'error', title, description })
  }, [showToast])

  const showWarning = useCallback((title: string, description?: string) => {
    showToast({ type: 'warning', title, description })
  }, [showToast])

  const showInfo = useCallback((title: string, description?: string) => {
    showToast({ type: 'info', title, description })
  }, [showToast])

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer messages={messages} onRemove={removeMessage} />
    </ToastContext.Provider>
  )
}

export default ToastProvider