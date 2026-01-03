'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X as XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import { useTranslation } from '@/i18n/client';
import { trackNavClick } from '@/lib/umami';

interface TopNavbarProps {
  lang: string;
}

export default function TopNavbar({ lang }: TopNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation(lang, 'landing');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-100)]/80 backdrop-blur-lg border-b border-[var(--bg-300)]">
      <nav className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center space-x-2">
            <Sparkles className="w-7 h-7 text-[var(--primary-100)]" />
            <span className="text-xl font-bold text-[var(--text-100)]">
              PromptHub
            </span>
          </Link>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href={`/${lang}/download`}
              className="text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors"
              onClick={() => trackNavClick('download', 'navbar')}
            >
              {t('nav.download')}
            </Link>
            <Link
              href={`/${lang}/explore`}
              className="relative text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors flex items-center gap-1"
              onClick={() => trackNavClick('explore', 'navbar')}
            >
              {t('nav.explore')}
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[var(--orange-200)] to-[var(--orange-100)] text-white rounded-full uppercase tracking-wide">
                Hot
              </span>
            </Link>
          </div>

          {/* 右侧操作区 */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher lang={lang} />
            <LoginButton lng={lang} />
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden p-2 text-[var(--text-200)] hover:text-[var(--text-100)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* 移动端菜单 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 py-4 border-t border-[var(--bg-300)]"
            >
              <div className="flex flex-col space-y-4">
                <Link
                  href={`/${lang}/explore`}
                  className="text-[var(--text-200)] hover:text-[var(--text-100)] flex items-center gap-2"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    trackNavClick('explore', 'mobile_menu')
                  }}
                >
                  {t('nav.explore')}
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[var(--orange-200)] to-[var(--orange-100)] text-white rounded-full uppercase tracking-wide">
                    Hot
                  </span>
                </Link>
                <Link
                  href={`/${lang}/download`}
                  className="text-[var(--text-200)] hover:text-[var(--text-100)]"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    trackNavClick('download', 'mobile_menu')
                  }}
                >
                  {t('nav.download')}
                </Link>
                <div className="pt-4 border-t border-[var(--bg-300)] flex flex-col space-y-3">
                  <LanguageSwitcher lang={lang} />
                  <LoginButton lng={lang} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}