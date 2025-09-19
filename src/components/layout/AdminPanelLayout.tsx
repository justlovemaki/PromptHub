'use client'

import React, { useState, useEffect, use } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, useAuthStatus } from '@promptmanager/core-logic'
import LanguageSwitcher from '../LanguageSwitcher'
import LoginButton from '../LoginButton'
import { useSession } from '@/lib/auth-client'

interface AdminPanelLayoutProps {
  children: React.ReactNode
  lang: string
}

const AdminPanelLayout: React.FC<AdminPanelLayoutProps> = ({ children, lang }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, isTokenExpired } = useAuthStatus()
  const { setToken, refreshUser } = useAuthStore()
  const { data: session, isPending } = useSession()

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
  }, [isClient, isPending])

  const adminNavigationItems = [
    {
      name: '概览仪表盘',
      href: `/${lang}/admin`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      current: pathname === `/${lang}/admin`
    },
    {
      name: '用户管理',
      href: `/${lang}/admin/users`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      current: pathname === `/${lang}/admin/users`
    },
    {
      name: '提示词管理',
      href: `/${lang}/admin/prompts`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      current: pathname === `/${lang}/admin/prompts`
    },
    {
      name: '内容审核',
      href: `/${lang}/admin/content`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      current: pathname === `/${lang}/admin/content`
    },
    {
      name: '系统设置',
      href: `/${lang}/admin/settings`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      current: pathname === `/${lang}/admin/settings`
    },
    {
      name: '数据分析',
      href: `/${lang}/admin/analytics`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      current: pathname === `/${lang}/admin/analytics`
    },
    {
      name: '系统日志',
      href: `/${lang}/admin/logs`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      current: pathname === `/${lang}/admin/logs`
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button 
                onClick={() => handleNavigation(`/${lang}`)}
                className="flex items-center ml-4 lg:ml-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PM</span>
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900">Prompt Manager</span>
              </button>
              {/* 管理后台标识 */}
              <div className="ml-4 flex items-center">
                <span className="text-gray-400">|</span>
                <span className="ml-3 px-2 py-1 text-xs bg-red-500 text-white rounded-full">管理后台</span>
              </div>
            </div>

            {/* 右侧 - 价格、语言切换、登录 */}
            <div className="flex items-center space-x-4">
              {/* 返回仪表盘 */}
              <button
                onClick={() => handleNavigation(`/${lang}/dashboard`)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors"
              >
                返回仪表盘
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
        <nav className={`fixed left-0 top-16 bottom-0 bg-brand-navy transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } lg:translate-x-0 ${sidebarCollapsed ? '' : 'lg:block hidden'}`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              <div className="mb-4">
                {!sidebarCollapsed && (
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    管理功能
                  </h2>
                )}
              </div>
              <nav className="space-y-2">
                {adminNavigationItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      item.current
                        ? 'bg-brand-blue text-white'
                        : 'text-gray-300 hover:bg-brand-navy-light hover:text-white'
                    }`}
                  >
                    <span className={`${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="flex-1 p-6">
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
              © 2025 Prompt Manager Admin Panel. All Rights Reserved.
            </div>
            <div className="flex space-x-6 mt-2 sm:mt-0">
              <button
                onClick={() => handleNavigation(`/${lang}/privacy`)}
                className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
              >
                隐私协议
              </button>
              <button
                onClick={() => handleNavigation(`/${lang}/terms`)}
                className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
              >
                服务条款
              </button>
              <button
                onClick={() => handleNavigation(`/${lang}/contact`)}
                className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
              >
                联系我们
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AdminPanelLayout