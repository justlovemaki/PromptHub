'use client'

import { useState, useEffect } from 'react'
import LoginModal from './LoginModal'
import { useSession, signOut } from '../lib/auth-client'
import { useTranslation } from '../i18n/client'

export default function LoginButton({ lng }: { lng: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { data: session, isPending } = useSession()
  const { t } = useTranslation(lng, 'common')

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLogin = () => {
    // 打开登录模态框
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    // 登出处理
    try {
      await signOut();
      // 重新加载页面以更新会话状态
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // 只在客户端渲染时显示组件
  if (!isClient) {
    return null
  }

  // 如果会话数据还在加载中，显示加载状态
  if (isPending) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse bg-gray-200 rounded-full w-8 h-8"></div>
        <div className="ml-2 animate-pulse bg-gray-200 rounded w-16 h-4"></div>
      </div>
    )
  }

  // 如果用户已登录，显示用户名和头像
  if (session?.user) {
    return (
      <div className="flex items-center space-x-2">
        {session.user.image && (
          <img 
            src={session.user.image} 
            alt={session.user.name || 'User'} 
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <span className="text-gray-700">{session.user.name || session.user.email}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
        >
          {t('logout')}
        </button>
        <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} lng={lng} />
      </div>
    )
  }

  // 如果用户未登录，显示登录按钮
  return (
    <>
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-pink transition-colors"
      >
        {t('login')}
      </button>
      <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} lng={lng} />
    </>
  )
}