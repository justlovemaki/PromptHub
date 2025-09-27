'use client'

import React, { useState, useEffect, use } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, useAuthStatus } from '@promptmanager/core-logic'
import LanguageSwitcher from '../LanguageSwitcher'
import LoginButton from '../LoginButton'
import { useSession } from '@/lib/auth-client'
import { useTranslation } from '../../i18n/client'
import { getTruePathFromPathname } from '../../lib/utils'; 

interface AdminPanelLayoutProps {
  children: React.ReactNode
  lang: string
}

const AdminPanelLayout: React.FC<AdminPanelLayoutProps> = ({ children, lang }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, isTokenExpired } = useAuthStatus()
  const { setToken, refreshUser, setLanguage } = useAuthStore()
  const { data: session, isPending } = useSession()
  const { t } = useTranslation(lang, 'admin')
  const truePath = getTruePathFromPathname(pathname, lang);

  // 客户端 hydration 检查
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 页面初始化时设置token（只在store没有token时执行，只执行一次）
  useEffect(() => {
    // 等待session加载完成
    if (isPending) {
      console.log('AdminPanelLayout: session正在加载中，等待...')
      return
    }
    
    // 只有当store中没有token，但session中有token时，才设置token
    if (session?.session?.token && isTokenExpired) {
      console.log('AdminPanelLayout: store中无token但session有token，设置token', session.session.token)
      setToken(session.session.token)
      refreshUser()
    }
  }, [isClient, isPending, isTokenExpired])

  // 设置语言属性
  useEffect(() => {
    setLanguage(lang)
  }, [lang, setLanguage])

  const adminNavigationItems = [
    {
      name: t('navigation.overview'),
      href: `${truePath}/admin`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      current: pathname === `${truePath}/admin`
    },
    {
      name: t('navigation.users'),
      href: `${truePath}/admin/users`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      current: pathname === `${truePath}/admin/users`
    },
    {
      name: t('navigation.prompts'),
      href: `${truePath}/admin/prompts`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      current: pathname === `${truePath}/admin/prompts`
    },
    {
      name: t('navigation.logs'),
      href: `${truePath}/admin/logs`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      current: pathname === `${truePath}/admin/logs`
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-bg-200 flex flex-col">
      {/* 顶栏 Header */}
      <header className="bg-white shadow-sm border-b border-bg-300 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧 - Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-md text-text-300 hover:text-text-200 lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => handleNavigation(`${truePath}`)}
                className="flex items-center ml-4 lg:ml-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img src="/logo.png" alt="PromptHub" className="w-8 h-8" />
                </div>
                <span className="ml-2 text-lg font-semibold text-text-100">PromptHub</span>
              </button>
              {/* 管理后台标识 */}
              <div className="ml-4 flex items-center">
                <span className="text-text-300">|</span>
                <span className="ml-3 px-2 py-1 text-xs bg-error-500 text-white rounded-full">{t('common.adminPanel')}</span>
              </div>
            </div>

            {/* 右侧 - 价格、语言切换、登录 */}
            <div className="flex items-center space-x-4">
              {/* {t('common.returnToDashboard')} */}
              <button
                onClick={() => handleNavigation(`${truePath}/dashboard`)}
                className="px-3 py-2 text-sm font-medium text-text-200 hover:text-primary-100 transition-colors"
              >
                {t('common.returnToDashboard')}
              </button>

              {/* 多语言切换 */}
              <div className="flex items-center space-x-2">
                <LanguageSwitcher lang={lang} />
              </div>

              {/* 登录/用户信息 */}
              <LoginButton lng={lang} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* 管理后台专用侧边栏 */}
        <nav className={`fixed left-0 top-16 bottom-0 bg-bg-900 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-48'
        } lg:translate-x-0 ${sidebarCollapsed ? '' : 'lg:block hidden'}`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              <nav className="space-y-2">
                {/* 切换按钮 - 根据状态显示展开或折叠按钮 */}
                <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-start'} mb-4`}>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`${
                      sidebarCollapsed
                        ? 'p-2 flex items-center justify-center w-8 h-8'  // 折叠状态下确保完全居中
                        : 'p-2'
                    } text-text-300 hover:text-white hover:bg-bg-800 rounded-lg transition-colors`}
                    title={sidebarCollapsed ? t('common.sidebar.expand') : t('common.sidebar.collapse')}
                  >
                    {sidebarCollapsed ? (
                      // 折叠状态显示展开图标（向右箭头）
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    ) : (
                      // 展开状态显示折叠图标（向左箭头）
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    )}
                  </button>
                </div>
                {adminNavigationItems.map((item) => (
                  <button
                     key={item.name}
                     onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center text-sm font-medium rounded-lg transition-colors ${
                      sidebarCollapsed
                        ? 'justify-center px-2 py-2'
                        : 'justify-start px-3 py-2 pl-4'
                    } ${
                       item.current
                         ? 'bg-primary-100 text-white'
                         : 'text-text-300 hover:bg-bg-800 hover:text-white'
                     }`}
                     title={sidebarCollapsed ? item.name : undefined}
                   >
                    <span className={`flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate ml-3">{item.name}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-48'
        }`}>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>

      {/* 页脚 Footer - 固定在底部 */}
      <footer className={`bg-white border-t border-bg-300 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-48'
      }`}>
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-text-300">
              {t('common.copyright')}
            </div>
            <div className="flex space-x-6 mt-2 sm:mt-0">
              <button
                onClick={() => handleNavigation(`${truePath}/privacy`)}
                className="text-sm text-text-300 hover:text-primary-100 transition-colors"
              >
                {t('common.privacy')}
              </button>
              <button
                onClick={() => handleNavigation(`${truePath}/terms`)}
                className="text-sm text-text-300 hover:text-primary-100 transition-colors"
              >
                {t('common.terms')}
              </button>
              <button
                onClick={() => handleNavigation(`${truePath}/contact`)}
                className="text-sm text-text-300 hover:text-primary-100 transition-colors"
              >
                {t('common.contact')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AdminPanelLayout