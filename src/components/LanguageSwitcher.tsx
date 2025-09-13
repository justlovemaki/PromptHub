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
    
    router.push(newPath)
  }

  // 只在客户端渲染时显示组件
  if (!isClient) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => switchLanguage('zh-CN')}
        className={`px-3 py-1 rounded-md text-sm font-medium text-gray-500 ${
          lang === 'zh-CN'
            ? 'text-gray-900 transition-colors duration-200'
            : 'hover:text-gray-900 transition-colors duration-200'
        }`}
      >
        {t('chinese')}
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium text-gray-500 ${
          lang === 'en'
            ? 'text-gray-900 transition-colors duration-200'
            : 'hover:text-gray-900 transition-colors duration-200'
        }`}
      >
        {t('english')}
      </button>
      <button
        onClick={() => switchLanguage('ja')}
        className={`px-3 py-1 rounded-md text-sm font-medium text-gray-500 ${
          lang === 'ja'
            ? 'text-gray-900 transition-colors duration-200'
            : 'hover:text-gray-900 transition-colors duration-200'
        }`}
      >
        {t('japanese')}
      </button>
    </div>
  )
}

export default LanguageSwitcher