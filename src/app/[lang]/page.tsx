'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import ParticlesBackground from '@/components/landing/ParticlesBackground';
import { ChevronDown, Check, X, Globe, Zap, Shield, Text, Sparkles, Search, Tag, Folder, Rocket, Menu, X as XIcon, BookOpen, HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import { useTranslation } from '@/i18n/client';
import PricingSection from '@/components/landing/PricingSection';
import { useSession } from '@/lib/auth-client';
import LoginModal from '@/components/LoginModal';

const LandingPage = ({ params }: { params: { lang: string } }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const { t } = useTranslation(params.lang, 'landing');
  const { data: session, isPending } = useSession();
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const sections = [
    'hero',
    'problem',
    'management',
    'optimization',
    'pricing',
    'howto',
    'faq',
    'footer'
  ];

  // 优化后的平滑滚动到指定部分
  const scrollToSection = (index: number) => {
    if (isScrolling) return;
    
    const section = document.getElementById(sections[index]);
    if (section) {
      setIsScrolling(true);
      const navbarHeight = 80;
      const targetPosition = section.offsetTop - navbarHeight;
      
      // 使用 CSS 滚动行为而不是 scrollIntoView
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      
      setCurrentSection(index);
      
      // 缩短锁定时间以提升响应性
      setTimeout(() => {
        setIsScrolling(false);
      }, 600);
    }
  };

  // 优化后的滚轮和触摸事件处理
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    let lastWheelTime = 0;
    let scrollRafId: number | null = null;
    
    const TOUCH_THRESHOLD = 50;
    const WHEEL_DEBOUNCE = 500; // 缩短防抖时间
    
    // 优化的滚轮处理
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) {
        e.preventDefault();
        return;
      }
      
      // 检查是否应该触发切换
      const now = Date.now();
      const timeDiff = now - lastWheelTime;
      
      // 如果在防抖时间内，阻止默认行为但不切换
      if (timeDiff < WHEEL_DEBOUNCE) {
        e.preventDefault();
        return;
      }
      
      // 检测滚动方向和强度
      const deltaY = Math.abs(e.deltaY);
      const isMobile = window.innerWidth <= 768;
      
      // 移动端需要更大的滚动幅度
      if (isMobile && deltaY < 20) return;
      if (!isMobile && deltaY < 5) return;
      
      e.preventDefault();
      
      const direction = e.deltaY > 0 ? 1 : -1;
      const nextSection = currentSection + direction;
      
      if (nextSection >= 0 && nextSection < sections.length) {
        lastWheelTime = now;
        scrollToSection(nextSection);
      }
    };
    
    // 触摸事件处理
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;
      touchEndY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = () => {
      if (!touchStartY || !touchEndY) {
        touchStartY = 0;
        touchEndY = 0;
        return;
      }
      
      const distance = touchStartY - touchEndY;
      const isValidSwipe = Math.abs(distance) > TOUCH_THRESHOLD;
      
      if (isValidSwipe && !isScrolling) {
        const direction = distance > 0 ? 1 : -1;
        const nextSection = currentSection + direction;
        
        if (nextSection >= 0 && nextSection < sections.length) {
          scrollToSection(nextSection);
        }
      }
      
      touchStartY = 0;
      touchEndY = 0;
    };
    
    // 普通滚动监听（用于更新UI状态）
    const handleScroll = () => {
      if (scrollRafId !== null) {
        cancelAnimationFrame(scrollRafId);
      }
      
      scrollRafId = requestAnimationFrame(() => {
        const scrollPosition = window.scrollY;
        setShowNav(scrollPosition > 100);
        
        // 更新当前部分指示器
        const viewportHeight = window.innerHeight;
        const scrollCenter = scrollPosition + viewportHeight * 0.3;
        
        for (let i = 0; i < sections.length; i++) {
          const section = document.getElementById(sections[i]);
          if (section) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollCenter >= sectionTop && scrollCenter < sectionTop + sectionHeight) {
              if (currentSection !== i) {
                setCurrentSection(i);
              }
              break;
            }
          }
        }
      });
    };
    
    // 添加事件监听
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      if (scrollRafId !== null) {
        cancelAnimationFrame(scrollRafId);
      }
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentSection, isScrolling]);

  return (
    <div ref={containerRef} className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-x-hidden">
      {/* 动态粒子背景 */}
      <ParticlesBackground />
      
      {/* 顶部导航栏 */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showNav ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={`/${params.lang}`} className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                PromptHub
              </span>
            </Link>

            {/* 桌面端导航 */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#management" className="hover:text-purple-400 transition-colors">
                {t('nav.features')}
              </Link>
              <Link href="#pricing" className="hover:text-purple-400 transition-colors">
                {t('nav.pricing')}
              </Link>
              <Link href={`/${params.lang}/download`} className="hover:text-purple-400 transition-colors">
                {t('nav.download')}
              </Link>
              <LanguageSwitcher lang={params.lang} textClassName="text-white" />
              <LoginButton lng={params.lang} textClassName="text-white" />
            </div>

            {/* 移动端汉堡菜单按钮 */}
            <button
              className="md:hidden text-white hover:text-purple-400 transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="切换菜单"
            >
              {isMobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* 移动端菜单 */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="md:hidden mt-4 py-4 border-t border-gray-700 bg-gray-900/95 backdrop-blur-md"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col space-y-4 px-2">
                  <Link
                    href="#features"
                    className="hover:text-purple-400 transition-colors py-2 px-4 rounded-lg hover:bg-gray-800/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.features')}
                  </Link>
                  <Link
                    href="#pricing"
                    className="hover:text-purple-400 transition-colors py-2 px-4 rounded-lg hover:bg-gray-800/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.pricing')}
                  </Link>
                  <Link
                    href={`/${params.lang}/download`}
                    className="hover:text-purple-400 transition-colors py-2 px-4 rounded-lg hover:bg-gray-800/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('nav.download')}
                  </Link>
                  <div className="flex flex-col space-y-3 py-2">
                    <LanguageSwitcher lang={params.lang} textClassName="text-white" />
                    <LoginButton lng={params.lang} textClassName="text-white w-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.header>

      {/* 主视觉区 Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center relative px-4 sm:px-6">
        <div className="container mx-auto text-center z-10 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ opacity, scale }}
          >
            <h1 className="p-6 text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <motion.button
              className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-base sm:text-lg md:text-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (session) {
                  // 用户已登录，直接跳转到仪表板
                  router.push(`/${params.lang}/dashboard`);
                } else {
                  // 用户未登录，打开登录模态框
                  setIsLoginModalOpen(true);
                }
              }}
            >
              {t('hero.cta')} →
            </motion.button>
          </motion.div>
          
          <motion.div
            className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </motion.div>
        </div>
      </section>

      {/* 痛点展示区 */}
      <section id="problem" className="min-h-screen flex items-center justify-center py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center md:text-left"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                {t('problem.title')}
                <span className="text-red-400"> {t('problem.highlight')} </span>
                {t('problem.title2')}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed">
                {t('problem.description')}
              </p>
            </motion.div>
            
            <motion.div
              className="relative h-64 sm:h-80 md:h-96"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <AnimatedCards lang={params.lang} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 核心功能一：管理 */}
      <section id="management" className="min-h-screen flex items-center justify-center py-12 sm:py-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 border border-purple-500/20">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                  <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                  <Search className="w-7 h-7 sm:w-9 sm:h-9 text-green-400" />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border-l-4 border-purple-500">
                    <p className="text-xs sm:text-sm text-gray-400">📁 {t('management.demo.folder')}</p>
                    <p className="text-sm sm:text-base text-white">{t('management.demo.folderContent')}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                    <p className="text-xs sm:text-sm text-gray-400">🏷️ {t('management.demo.tags')}</p>
                    <p className="text-sm sm:text-base text-white">{t('management.demo.tagsContent')}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 border-l-4 border-green-500">
                    <p className="text-xs sm:text-sm text-gray-400">🔍 {t('management.demo.search')}</p>
                    <p className="text-sm sm:text-base text-white">{t('management.demo.searchResult')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="order-1 md:order-2 text-center md:text-left"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                {t('management.title')}
                <span className="text-gradient bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{t('management.highlight')}</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed mb-6 sm:mb-8">
                {t('management.description')}
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
                <FeatureBadge icon={<Text className="w-4 h-4" />} text={t('management.features.smartCategory')} />
                <FeatureBadge icon={<Tag className="w-4 h-4" />} text={t('management.features.multiTag')} />
                <FeatureBadge icon={<Search className="w-4 h-4" />} text={t('management.features.instantSearch')} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 核心功能二：优化 */}
      <section id="optimization" className="min-h-screen flex items-center justify-center py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                {t('optimization.title')}
                <span className="text-gradient bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">{t('optimization.highlight')}</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed mb-6 sm:mb-8">
                {t('optimization.description')}
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
                <FeatureBadge icon={<Zap className="w-4 h-4" />} text={t('optimization.features.aiOptimize')} />
                <FeatureBadge icon={<Rocket className="w-4 h-4" />} text={t('optimization.features.quickAccess')} />
                <FeatureBadge icon={<Globe className="w-4 h-4" />} text={t('optimization.features.globalAccess')} />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <OptimizationDemo lang={params.lang} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 价格区 */}
      <section id="pricing" className="min-h-screen flex items-center justify-center py-12 sm:py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="w-full">
          <PricingSection params={params} isAdmin={false} handleLoginModal={setIsLoginModalOpen}/>
        </div>
      </section>

      {/* 使用说明区 */}
      <section id="howto" className="min-h-screen flex items-center justify-center py-12 sm:py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              {t('howto.title')}
              <span className="text-gradient bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> PromptHub</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
              {t('howto.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* 步骤1: 创建和管理 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-purple-400">1</span>
                </div>
                <Folder className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('howto.step1.title')}</h3>
              <p className="text-gray-400 leading-relaxed mb-4">{t('howto.step1.description')}</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                  <span>{t('howto.step1.tip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                  <span>{t('howto.step1.tip2')}</span>
                </li>
              </ul>
            </motion.div>

            {/* 步骤2: 优化提示词 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-900/30 to-green-800/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-green-500/30 hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-400">2</span>
                </div>
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('howto.step2.title')}</h3>
              <p className="text-gray-400 leading-relaxed mb-4">{t('howto.step2.description')}</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>{t('howto.step2.tip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>{t('howto.step2.tip2')}</span>
                </li>
              </ul>
            </motion.div>

            {/* 步骤3: 一键使用 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-400">3</span>
                </div>
                <Rocket className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('howto.step3.title')}</h3>
              <p className="text-gray-400 leading-relaxed mb-4">{t('howto.step3.description')}</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>{t('howto.step3.tip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>{t('howto.step3.tip2')}</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 常见问题区 */}
      <section id="faq" className="min-h-screen flex items-center justify-center py-12 sm:py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              {t('faq.title')}
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            <FAQItem
              question={t('faq.q1.question')}
              answer={t('faq.q1.answer')}
              delay={0.1}
            />
            <FAQItem
              question={t('faq.q2.question')}
              answer={t('faq.q2.answer')}
              delay={0.2}
            />
            <FAQItem
              question={t('faq.q3.question')}
              answer={t('faq.q3.answer')}
              delay={0.3}
            />
            <FAQItem
              question={t('faq.q4.question')}
              answer={t('faq.q4.answer')}
              delay={0.4}
            />
            <FAQItem
              question={t('faq.q5.question')}
              answer={t('faq.q5.answer')}
              delay={0.5}
            />
            <FAQItem
              question={t('faq.q6.question')}
              answer={t('faq.q6.answer')}
              delay={0.6}
            />
            <FAQItem
              question={t('faq.q7.question')}
              answer={t('faq.q7.answer')}
              delay={0.7}
            />
          </div>
        </div>
      </section>

      {/* 底部信息区 */}
      <footer id="footer" className="bg-gray-900 border-t border-gray-800 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <span className="text-lg font-semibold">PromptHub</span>
            </div>
            
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link href={`/${params.lang}/pricing`} className="hover:text-purple-400 transition-colors">
                {t('footer.pricing')}
              </Link>
              <Link href={`/${params.lang}/privacy`} className="hover:text-purple-400 transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link href={`/${params.lang}/terms`} className="hover:text-purple-400 transition-colors">
                {t('footer.terms')}
              </Link>
              <Link href={`/${params.lang}/contact`} className="hover:text-purple-400 transition-colors">
                {t('footer.contact')}
              </Link>
            </div>
            
            <p className="text-gray-400 text-sm">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

      {/* 页面指示器 */}
      <div className="fixed right-4 sm:right-8 top-1/2 transform -translate-y-1/2 z-40 hidden md:block">
        <div className="flex flex-col items-center gap-3">
          {sections.map((_, index) => (
            <button
              key={index}
              className={`rounded-full transition-all duration-300 ${
                currentSection === index
                  ? 'bg-purple-500 w-8 h-3'
                  : 'bg-gray-600 hover:bg-gray-400 w-3 h-3'
              }`}
              onClick={() => scrollToSection(index)}
              aria-label={`跳转到第 ${index + 1} 部分`}
            />
          ))}
        </div>
      </div>

      {/* 移动端底部导航器 */}
      <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-gray-900/90 backdrop-blur-md rounded-full px-4 py-2 border border-gray-700">
          <div className="flex items-center gap-2">
            {sections.map((sectionName, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSection === index
                    ? 'bg-purple-500'
                    : 'bg-gray-600 hover:bg-gray-400'
                }`}
                onClick={() => scrollToSection(index)}
                aria-label={`跳转到${sectionName}部分`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* 登录模态框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lng={params.lang}
      />
    </div>
  );
};

// 动画卡片组件
const AnimatedCards = ({ lang }: { lang: string }) => {
  const [organized, setOrganized] = useState(false);
  const [randomValues, setRandomValues] = useState<Array<{x: number, y: number, rotate: number}>>([]);
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
  const { t } = useTranslation(lang, 'landing');

  useEffect(() => {
    // 只在客户端生成随机值
    const initialValues = Array(5).fill(0).map(() => ({
      x: Math.random() * 300 - 150, // 增加随机位置范围
      y: Math.random() * 300 - 150, // 增加随机位置范围
      rotate: Math.random() * 60 - 30 // 增加旋转角度范围
    }));
    setRandomValues(initialValues);
  }, []);

  useEffect(() => {
    if (inView) {
      setTimeout(() => setOrganized(true), 500);
    }
  }, [inView]);

  const cards = [
    { text: t('cards.gpt'), color: 'from-purple-500 to-purple-700' },
    { text: t('cards.claude'), color: 'from-green-500 to-green-700' },
    { text: t('cards.banana'), color: 'from-yellow-500 to-yellow-700' },
    { text: t('cards.midjourney'), color: 'from-blue-500 to-blue-700' },
    { text: t('cards.sd'), color: 'from-red-500 to-red-700' },
  ];

  // 反转卡片顺序，让原本后面的卡片显示在前面
  const reversedCards = [...cards].reverse();

  return (
    <div ref={ref} className="relative h-full flex items-center justify-center">
      {reversedCards.map((card, index) => (
        <motion.div
          key={index}
          className={`absolute w-48 h-24 sm:w-64 sm:h-32 bg-gradient-to-br ${card.color} rounded-xl p-3 sm:p-4 shadow-2xl flex flex-col`}
          initial={randomValues.length > 0 ? {
            x: randomValues[4-index]?.x || 0, // 反转初始位置索引
            y: randomValues[4-index]?.y || 0,
            rotate: randomValues[4-index]?.rotate || 0,
            opacity: 0.7
          } : {}}
          animate={organized ? {
            x: -((4-index) * 40 - 80), // 反转x轴位置，实现左右翻转
            y: (4-index) * 50 - 80, // 增大垂直间距从25到40
            rotate: 0, // 移除旋转，确保文字不会被遮挡
            opacity: 1
          } : {}}
          transition={{
            duration: 0.8,
            delay: index * 0.1,
            type: 'spring',
            stiffness: 100
          }}
        >
          <div className="flex-grow flex items-center justify-center">
            {/* 留空区域，将文字推到底部 */}
          </div>
          <div className="text-white font-semibold text-center">
            {card.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// 优化演示组件
const OptimizationDemo = ({ lang }: { lang: string }) => {
  const [optimized, setOptimized] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
  const { t } = useTranslation(lang, 'landing');

  useEffect(() => {
    if (inView) {
      const timer = setInterval(() => {
        setOptimized(prev => !prev);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [inView]);

  return (
    <div ref={ref} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-green-500/20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">{t('optimization.demo.title')}</h3>
        <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
          {t('optimization.demo.optimizeBtn')} ✨
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {!optimized ? (
          <motion.div
            key="before"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-gray-400 text-sm">{t('optimization.demo.before')}</p>
            <p className="text-white bg-gray-700/50 p-4 rounded-lg">
              {t('optimization.demo.beforeExample')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="after"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-green-400 text-sm">{t('optimization.demo.after')}</p>
            <div className="text-white bg-gradient-to-r from-green-900/30 to-cyan-900/30 p-4 rounded-lg border border-green-500/30">
              <p className="mb-2">
                <span className="text-green-400">{t('optimization.demo.role')}</span> {t('optimization.demo.roleText')}
              </p>
              <p className="mb-2">
                <span className="text-cyan-400">{t('optimization.demo.task')}</span> {t('optimization.demo.taskText')}
              </p>
              <p className="mb-2">
                <span className="text-purple-400">{t('optimization.demo.topic')}</span> {t('optimization.demo.topicText')}
              </p>
              <p>
                <span className="text-yellow-400">{t('optimization.demo.requirements')}</span> {t('optimization.demo.requirementsText')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-6 flex items-center justify-center">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{
                scale: optimized ? [1, 1.5, 1] : 1,
                opacity: optimized ? [0.5, 1, 0.5] : 0.3,
              }}
              transition={{
                duration: 1,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// 功能标签组件
const FeatureBadge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-700">
    <span className="text-purple-400">{icon}</span>
    <span className="text-sm font-medium">{text}</span>
  </div>
);

// FAQ项组件
const FAQItem = ({ question, answer, delay }: { question: string; answer: string; delay: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all"
    >
      <button
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-semibold text-white pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-gray-400 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LandingPage;