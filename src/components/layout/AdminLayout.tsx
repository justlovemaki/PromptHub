'use client'

import React, { useState, useEffect, use } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, useAuthStatus } from '@promptmanager/core-logic'
import LanguageSwitcher from '../LanguageSwitcher'
import LoginButton from '../LoginButton'
import { useSession } from '@/lib/auth-client'
import { useTranslation } from '../../i18n/client'
import { getTruePathFromPathname } from '../../lib/utils'; 

interface AdminLayoutProps {
  children: React.ReactNode
  lang: string
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, lang }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, isTokenExpired } = useAuthStatus()
  const { setToken, refreshUser, setLanguage } = useAuthStore()
  const { t } = useTranslation(lang, 'user')
  const { data: session, isPending } = useSession()
  const truePath = getTruePathFromPathname(pathname, lang);
  

  // 客户端 hydration 检查
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 页面初始化时设置token（只在store没有token时执行，只执行一次）
  useEffect(() => {
    // 等待session加载完成
    if (isPending) {
      console.log('AdminLayout: session正在加载中，等待...')
      return
    }
    
    // 只有当store中没有token，但session中有token时，才设置token
    if (session?.session?.token && isTokenExpired) {
      console.log('AdminLayout: store中无token但session有token，设置token', session.session.token)
      setToken(session.session.token)
      refreshUser()
    }
  }, [isClient, isPending, isTokenExpired])

  // 设置语言属性
  useEffect(() => {
    setLanguage(lang)
  }, [lang, setLanguage])

  const navigationItems = [
    {
      name: t('navigation.dashboard'),
      href: `${truePath}/dashboard`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      current: pathname.startsWith(`${truePath}/dashboard`),
      children: undefined as { name: string; href: string }[] | undefined
    },
    {
      name: t('navigation.accountSettings'),
      href: `${truePath}/account`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      current: pathname === `${truePath}/account`,
      children: undefined as { name: string; href: string }[] | undefined
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶栏 Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧 - Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 lg:hidden"
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button 
                onClick={() => handleNavigation(`${truePath}`)}
                className="flex items-center ml-4 lg:ml-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PM</span>
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900">Prompt Manager</span>
              </button>
            </div>

            {/* 右侧 - 价格、{t('common.adminPanel')}、语言切换、登录 */}
            <div className="flex items-center space-x-4">
              {/* {t('common.adminPanel')} - 仅对ADMIN用户显示，且只在客户端渲染后显示 */}
              {isClient && isAdmin && (
                <button
                  onClick={() => handleNavigation(`${truePath}/admin`)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors"
                >
                  {t('common.adminPanel')}
                </button>
              )}

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
        {/* 左侧导航栏 Sidebar */}
        <nav className={`fixed left-0 top-16 bottom-0 bg-brand-navy transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-48'
        } lg:translate-x-0 ${sidebarCollapsed ? '' : 'lg:block hidden'}`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              <nav className="space-y-2">
                {/* 切换按钮 - 根据状态显示展开或折叠按钮 */}
                <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-start'} pt-4`}>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`${
                      sidebarCollapsed
                        ? 'p-2 flex items-center justify-center w-8 h-8'  // 折叠状态下确保完全居中
                        : 'p-2'
                    } text-gray-400 hover:text-white hover:bg-brand-navy-light rounded-lg transition-colors`}
                    title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
                  >
                    {sidebarCollapsed ? (
                      // 折叠状态显示展开图标（向右箭头）- 稍微大一点以便点击
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
                {navigationItems.map((item) => (
                  <div key={item.name}>
                    <button
                       onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center text-sm font-medium rounded-lg transition-colors ${
                         sidebarCollapsed
                           ? 'justify-center px-2 py-2'
                           : 'justify-start px-3 py-2 pl-4'
                       } ${
                         item.current
                           ? 'bg-brand-blue text-white'
                           : 'text-gray-300 hover:bg-brand-navy-light hover:text-white'
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
                    
                    {/* 子菜单 */}
                    {!sidebarCollapsed && item.children && item.current && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.name}
                            onClick={() => handleNavigation(child.href)}
                            className={`w-full text-left px-3 py-1 text-sm transition-colors rounded ${
                              pathname === child.href
                                ? 'text-white bg-brand-blue/20'
                                : 'text-gray-400 hover:text-white hover:bg-brand-navy-light'
                            }`}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="w-full mx-auto flex-1 p-6">
              {children}
          </div>
        </main>
      </div>

      {/* 页脚 Footer - 固定在底部 */}
      <footer className={`bg-white border-t border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              {t('common.copyright')}
            </div>
            <div className="flex space-x-6 mt-2 sm:mt-0">
              <button
                onClick={() => handleNavigation(`${truePath}/privacy`)}
                className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
              >
                {t('common.privacy')}
              </button>
              <button
                onClick={() => handleNavigation(`${truePath}/terms`)}
                className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
              >
                {t('common.terms')}
              </button>
              <button
                onClick={() => handleNavigation(`${truePath}/contact`)}
                className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
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

export default AdminLayout