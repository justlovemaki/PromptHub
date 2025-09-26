'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import ParticlesBackground from '@/components/landing/ParticlesBackground';
import { ChevronDown, Check, X, Globe, Zap, Shield, Users, Sparkles, Search, Tag, Folder, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import { useTranslation } from '@/i18n/client';
import PricingSection from '@/components/landing/PricingSection';

const LandingPage = ({ params }: { params: { lang: string } }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { scrollYProgress } = useScroll();
  const { t } = useTranslation(params.lang, 'landing');
  
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const sections = [
    'hero',
    'problem',
    'management',
    'optimization',
    'pricing',
    'footer'
  ];

  // 平滑滚动到指定部分
  const scrollToSection = (index: number) => {
    if (isScrolling) return;
    setIsScrolling(true);
    const section = document.getElementById(sections[index]);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setCurrentSection(index);
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  // 处理滚轮事件
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;
      e.preventDefault();
      
      const direction = e.deltaY > 0 ? 1 : -1;
      const nextSection = currentSection + direction;
      
      if (nextSection >= 0 && nextSection < sections.length) {
        scrollToSection(nextSection);
      }
    };

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowNav(scrollPosition > 100);
      
      // 检测当前所在部分
      sections.forEach((sectionId, index) => {
        const section = document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setCurrentSection(index);
          }
        }
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
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
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/${params.lang}`} className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              PromptHub
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link href="#features" className="hover:text-purple-400 transition-colors">
              {t('nav.features')}
            </Link>
            <Link href="#pricing" className="hover:text-purple-400 transition-colors">
              {t('nav.pricing')}
            </Link>
            <LanguageSwitcher lang={params.lang} />
            <LoginButton lng={params.lang} />
          </div>
        </nav>
      </motion.header>

      {/* 主视觉区 Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center relative">
        <div className="container mx-auto px-6 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ opacity, scale }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              {t('hero.title')}
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-10 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <motion.button
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/${params.lang}/dashboard`)}
            >
              {t('hero.cta')} →
            </motion.button>
          </motion.div>
          
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </motion.div>
        </div>
      </section>

      {/* 痛点展示区 */}
      <section id="problem" className="min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('problem.title')}
                <span className="text-red-400"> {t('problem.highlight')} </span>
                {t('problem.title2')}
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                {t('problem.description')}
              </p>
            </motion.div>
            
            <motion.div
              className="relative h-96"
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
      <section id="management" className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20">
                <div className="flex items-center gap-4 mb-6">
                  <Folder className="w-10 h-10 text-purple-400" />
                  <Tag className="w-8 h-8 text-blue-400" />
                  <Search className="w-9 h-9 text-green-400" />
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-400">📁 {t('management.demo.folder')}</p>
                    <p className="text-white">{t('management.demo.folderContent')}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-400">🏷️ {t('management.demo.tags')}</p>
                    <p className="text-white">{t('management.demo.tagsContent')}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-400">🔍 {t('management.demo.search')}</p>
                    <p className="text-white">{t('management.demo.searchResult')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('management.title')}
                <span className="text-gradient bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{t('management.highlight')}</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                {t('management.description')}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <FeatureBadge icon={<Folder className="w-4 h-4" />} text={t('management.features.smartCategory')} />
                <FeatureBadge icon={<Tag className="w-4 h-4" />} text={t('management.features.multiTag')} />
                <FeatureBadge icon={<Search className="w-4 h-4" />} text={t('management.features.instantSearch')} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 核心功能二：优化 */}
      <section id="optimization" className="min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('optimization.title')}
                <span className="text-gradient bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">{t('optimization.highlight')}</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                {t('optimization.description')}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
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
      <section id="pricing" className="min-h-screen flex items-center justify-center py-20 bg-gradient-to-b from-gray-900 to-black">
        <PricingSection params={params} />
      </section>

      {/* 底部信息区 */}
      <footer id="footer" className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
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
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden md:block">
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
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      rotate: Math.random() * 30 - 15
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
    { text: t('cards.midjourney'), color: 'from-blue-500 to-blue-700' },
    { text: t('cards.claude'), color: 'from-green-500 to-green-700' },
    { text: t('cards.dalle'), color: 'from-yellow-500 to-yellow-700' },
    { text: t('cards.sd'), color: 'from-red-500 to-red-700' },
  ];

  return (
    <div ref={ref} className="relative h-full flex items-center justify-center">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          className={`absolute w-64 h-32 bg-gradient-to-br ${card.color} rounded-xl p-4 shadow-2xl flex items-center justify-center text-white font-semibold`}
          initial={randomValues.length > 0 ? {
            x: randomValues[index]?.x || 0,
            y: randomValues[index]?.y || 0,
            rotate: randomValues[index]?.rotate || 0,
            opacity: 0.7
          } : {}}
          animate={organized ? {
            x: 0,
            y: index * 35 - 70,
            rotate: 0,
            opacity: 1
          } : {}}
          transition={{
            duration: 0.8,
            delay: index * 0.1,
            type: 'spring',
            stiffness: 100
          }}
        >
          {card.text}
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

export default LandingPage;