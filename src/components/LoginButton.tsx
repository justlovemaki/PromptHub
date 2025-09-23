'use client'

import { useState, useEffect } from 'react'
import LoginModal from './LoginModal'
import { useSession, signOut } from '../lib/auth-client'
import { useAuthStore } from '@promptmanager/core-logic'
import { useTranslation } from '../i18n/client'

export default function LoginButton({ lng }: { lng: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { data: session, isPending } = useSession()
  const { user: authUser, logout, setLanguage } = useAuthStore()
  const { t } = useTranslation(lng, 'common')
  

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 设置语言属性
  useEffect(() => {
    setLanguage(lng)
  }, [lng, setLanguage])

  const handleLogin = () => {
    // 打开登录模态框
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    // 登出处理
    try {
      await signOut();
      // 清理 useAuthStore 状态
      logout();
      // 重新加载页面以更新会话状态
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // 只在客户端渲染时显示组件，防止 hydration 错误
  if (!isClient) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse bg-gray-200 rounded-full w-8 h-8"></div>
        <div className="ml-2 animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse bg-gray-200 rounded-full w-8 h-8"></div>
        <div className="ml-2 animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    )
  }

  // 优先使用 authStore 中的用户信息，如果没有则使用 session 中的用户信息
  const currentUser = authUser || session?.user;

  // 如果用户已登录，显示用户名和头像
  if (currentUser) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          {currentUser.image ? (
            <img 
              src={currentUser.image} 
              alt={currentUser.name || 'User'} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-gray-700 font-medium">
            {currentUser.name || currentUser.email}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  setIsDropdownOpen(false)
                  window.location.href = `/${lng}/account`
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{t('accountSettings')}</span>
              </button>
              <hr className="my-1" />
              <button
                onClick={() => {
                  setIsDropdownOpen(false)
                  handleLogout()
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        )}

        {/* 点击外部关闭下拉菜单 */}
        {isDropdownOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
        )}

        <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} lng={lng} />
      </div>
    )
  }

  // 如果用户未登录，显示登录按钮
  return (
    <>
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
      >
        {t('login')}
      </button>
      <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} lng={lng} />
    </>
  )
}