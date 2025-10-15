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

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set token on page initialization (only execute when store has no token, execute once only)
  useEffect(() => {
    // Wait for session to finish loading
    if (isPending) {
      console.log('AdminPanelLayout: session is loading, waiting...')
      return
    }
    
    // Only set token when store has no token but session has token
    if (session?.session?.token && isTokenExpired) {
      console.log('AdminPanelLayout: store has no token but session has token, setting token', session.session.token)
      setToken(session.session.token, session.session.expiresAt.getTime())
      refreshUser()
    }
  }, [isClient, isPending, isTokenExpired])

  // Set language property
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-bg-300 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left - Logo */}
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
                  <img src="/logo.ico" alt="PromptHub" className="w-8 h-8" />
                </div>
                <span className="ml-2 text-lg font-semibold text-text-100">PromptHub</span>
              </button>
              {/* Admin panel indicator */}
              <div className="ml-4 flex items-center">
                <span className="text-text-300">|</span>
                <span className="ml-3 px-2 py-1 text-xs bg-error-500 text-white rounded-full">{t('common.adminPanel')}</span>
              </div>
            </div>

            {/* Right - Pricing, Language Switch, Login */}
            <div className="flex items-center space-x-4">
              {/* {t('common.returnToDashboard')} */}
              <button
                onClick={() => handleNavigation(`${truePath}/dashboard`)}
                className="px-3 py-2 text-sm font-medium text-text-200 hover:text-primary-100 transition-colors"
              >
                {t('common.returnToDashboard')}
              </button>

              {/* Language Switch */}
              <div className="flex items-center space-x-2">
                <LanguageSwitcher lang={lang} />
              </div>

              {/* Login/User Info */}
              <LoginButton lng={lang} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Admin panel specific sidebar */}
        <nav className={`fixed left-0 top-16 bottom-0 bg-bg-900 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-48'
        } lg:translate-x-0 ${sidebarCollapsed ? '' : 'lg:block hidden'}`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              <nav className="space-y-2">
                {/* Toggle button - Show expand or collapse button based on state */}
                <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-start'} mb-4`}>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`${
                      sidebarCollapsed
                        ? 'p-2 flex items-center justify-center w-8 h-8'  // Ensure centering in collapsed state
                        : 'p-2'
                    } text-text-300 hover:text-white hover:bg-bg-800 rounded-lg transition-colors`}
                    title={sidebarCollapsed ? t('common.sidebar.expand') : t('common.sidebar.collapse')}
                  >
                    {sidebarCollapsed ? (
                      // Show expand icon (right arrow) in collapsed state
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    ) : (
                      // Show collapse icon (left arrow) in expanded state
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

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-48'
        }`}>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer - Fixed at bottom */}
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