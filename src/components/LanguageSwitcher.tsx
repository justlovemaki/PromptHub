'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '../i18n/client'
import { useEffect, useState } from 'react'
import { getTruePathFromPathname } from '../lib/utils';
import { languages, fallbackLng } from '@/i18n/settings'

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
    const truePath = getTruePathFromPathname(`/${locale}`, locale);
    // console.log('truePath', truePath);
    // console.log('currentPath', currentPath);

    // 检查当前路径是否以语言代码开头
    const langPattern = new RegExp(`^/(${languages.join('|')})`);
    // const langPattern = /^\/(en|zh-CN|ja)/;
    if (langPattern.test(currentPath)) {
      // 如果是，则替换为新的语言代码
      // console.log('match',langPattern);
      newPath = currentPath.replace(langPattern, `${truePath}`)
      // console.log('newPath', newPath);
    } else {
      console.log('not match')
      // 如果不是，则在路径开头添加语言代码
      newPath = `${truePath}${currentPath}`
    }
    
    setIsOpen(false)
    router.push(newPath===''?'/':newPath)
  }

  const languagesCode = [
    { code: '', name: 'english' },
    { code: 'zh-CN', name: 'chinese' },
    { code: 'ja', name: 'japanese' }
  ]

  // 只在客户端渲染时显示组件
  if (!isClient) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse bg-gray-200 rounded-full w-8 h-8"></div>
        <div className="ml-2 animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    )
  }

  // 获取当前语言的显示名称
  const currentLanguage = languagesCode.find(language => language.code === lang) || languagesCode[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <span className="text-gray-700 font-medium truncate max-w-[100px]">
          {t(currentLanguage.name)}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {languagesCode.map((language) => (
              <button
                key={language.code}
                onClick={() => switchLanguage(language.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-2 ${
                  lang === language.code || (language.code === '' && lang === fallbackLng)
                    ? 'bg-brand-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {language.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="truncate">{t(language.name)}</span>
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