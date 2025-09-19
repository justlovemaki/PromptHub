'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '../i18n/client'
import { useEffect, useState } from 'react'

interface LanguageSwitcherProps {
  lang: string
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ lang }) => {
  const { t, i18n } = useTranslation(lang, 'common')
  const router = useRouter()
  const currentPath = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const switchLanguage = (locale: string) => {
    // 获取当前路径，并替换语言部分
    let newPath = currentPath
    
    // 检查当前路径是否以语言代码开头
    const langPattern = /^\/(en|zh-CN|ja)/
    if (langPattern.test(currentPath)) {
      // 如果是，则替换为新的语言代码
      newPath = currentPath.replace(langPattern, `/${locale}`)
    } else {
      // 如果不是，则在路径开头添加语言代码
      newPath = `/${locale}${currentPath}`
    }
    
    setIsOpen(false)
    router.push(newPath)
  }

  const getLanguageDisplay = (locale: string) => {
    switch (locale) {
      case 'zh-CN':
        return '中文简体'
      case 'en':
        return 'English'
      case 'ja':
        return '日本語'
      default:
        return '中文简体'
    }
  }

  const languages = [
    { code: 'zh-CN', name: '中文简体' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' }
  ]

  // 只在客户端渲染时显示组件
  if (!isClient) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors rounded-md border border-gray-300 bg-white"
      >
        <span>{getLanguageDisplay(lang)}</span>
        <svg 
          className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => switchLanguage(language.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  lang === language.code
                    ? 'bg-brand-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default LanguageSwitcher