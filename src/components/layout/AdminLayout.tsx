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
  

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set token on page initialization (only execute when store has no token, execute once only)
  useEffect(() => {
    // Wait for session to finish loading
    if (isPending) {
      console.log('AdminLayout: session is loading, waiting...')
      return
    }
    
    // Only set token when store has no token but session has token
    if (session?.session?.token && isTokenExpired) {
      console.log('AdminLayout: store has no token but session has token, setting token', session.session.token)
      setToken(session.session.token)
      refreshUser()
    }
  }, [isClient, isPending, isTokenExpired])

  // Set language property
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
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>

            {/* Right - Pricing, {t('common.adminPanel')}, Language Switch, Login */}
            <div className="flex items-center space-x-4">
              {/* {t('common.adminPanel')} - Only display for ADMIN users, and only after client-side rendering */}
              {isClient && isAdmin && (
                <button
                  onClick={() => handleNavigation(`${truePath}/admin`)}
                  className="px-3 py-2 text-sm font-medium text-text-200 hover:text-primary-100 transition-colors"
                >
                  {t('common.adminPanel')}
                </button>
              )}

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
        {/* Sidebar */}
        <nav className={`fixed left-0 top-16 bottom-0 bg-bg-100 transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-48'
        } lg:translate-x-0 ${sidebarCollapsed ? '' : 'lg:block hidden'}`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 px-2 py-4 overflow-y-auto">
              <nav className="space-y-1">
                {/* Toggle button - Show expand or collapse button based on state */}
                <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-start'} pt-4`}>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`${
                      sidebarCollapsed
                        ? 'p-2 flex items-center justify-center w-8 h-8'  // 折叠状态下确保完全居中
                        : 'p-2'
                    } text-text-300 hover:text-text-100 hover:bg-bg-200 bg-white rounded-lg transition-colors`}
                    title={sidebarCollapsed ? t('common.sidebar.expand') : t('common.sidebar.collapse')}
                  >
                    {sidebarCollapsed ? (
                      // Show expand icon (right arrow) in collapsed state - slightly larger for easier clicking
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
                {navigationItems.map((item) => (
                  <div key={item.name} className="relative">
                    <button
                       onClick={() => handleNavigation(item.href)}
                      className={`w-full flex items-center text-sm font-medium rounded-lg transition-colors ${
                         sidebarCollapsed
                           ? 'justify-center px-2 py-2'
                           : 'justify-start px-3 py-2 pl-4'
                       } ${
                         item.current
                           ? 'bg-bg-200 text-primary-100'
                           : 'text-text-300 hover:bg-bg-300 hover:text-text-100'
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
                    {item.current && !sidebarCollapsed && (
                      <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-100 rounded-full"></div>
                    )}
                    
                    {/* Submenu */}
                    {!sidebarCollapsed && item.children && item.current && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children.map((child) => (
                          <div key={child.name} className="relative">
                            <button
                              onClick={() => handleNavigation(child.href)}
                              className={`w-full text-left px-3 py-1 text-sm transition-colors rounded ${
                                pathname === child.href
                                  ? 'bg-bg-200 text-primary-100'
                                  : 'text-text-300 hover:text-text-100 hover:bg-bg-300'
                              }`}
                            >
                              {child.name}
                            </button>
                            {pathname === child.href && (
                              <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary-100 rounded-full"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-48'
        }`}>
          <div className="w-full mx-auto flex-1 p-6">
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

export default AdminLayout