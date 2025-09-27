'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { loginOrRegister, signIn } from '../lib/auth-client'
import { useTranslation } from '../i18n/client'
import { usePathname } from 'next/navigation';
import { getTruePathFromPathname } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  lng: string
}

export default function LoginModal({ isOpen, onClose, lng }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation(lng, 'common')
  const pathname = usePathname();
  const truePath = getTruePathFromPathname(pathname, lng);


  // 重置表单状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPassword('')
      setError('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 使用自定义登录函数，支持自动注册
      const result = await loginOrRegister(email, password)

      if (result.error) {
        setError(result.error.message || t('loginError'))
      } else if ('data' in result && result.data?.user) {
          // 成功后关闭模态框并刷新页面
          onClose()
          if ('isnew' in result && result.isnew){
            window.location.pathname = `/api/auth/newuser?pathname=${truePath}`
          } else {
            window.location.pathname = `${truePath}/dashboard`
          }
      }
    } catch (err) {
      setError(t('unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // 使用 GitHub 登录，重定向到回调页面
      await signIn.social({
        provider: "github",
        callbackURL: `${truePath}/dashboard`,
        newUserCallbackURL: `/api/auth/newuser?pathname=` + truePath,
      })
      onClose()
    } catch (err) {
      console.error('GitHub login error:', err)
      setError(t('githubLoginFailed'))
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // 使用 Google 登录，重定向到回调页面
      await signIn.social({
        provider: "google",
        callbackURL: `${truePath}/dashboard`,
        newUserCallbackURL: `/api/auth/newuser?pathname=` + truePath,
      })
      onClose()
    } catch (err) {
      console.error('Google login error:', err)
      setError(t('googleLoginFailed'))
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-700/50 backdrop-blur-lg"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {t('login')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors duration-200 rounded-full p-2 hover:bg-gray-700/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-700 rounded-xl shadow-lg text-lg font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-lg">{t('signin')} with GitHub</span>
          </button>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-700 rounded-xl shadow-lg text-lg font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
            </svg>
            <span className="text-lg">{t('signin')} with Google</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 py-2 bg-gray-900 text-gray-400 rounded-full">
              {t('orContinueWith')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl w-full py-3 px-4 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? `${t('signin')}...` : t('signin')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  )

  // 使用 Portal 渲染到 document.body
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}