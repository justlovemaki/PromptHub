'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';

interface TopNavbarProps {
  lang: string;
}

export default function TopNavbar({ lang }: TopNavbarProps) {
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowNav(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showNav ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            PromptHub
          </span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <LanguageSwitcher lang={lang} />
          <LoginButton lng={lang} />
        </div>
      </nav>
    </header>
  );
}