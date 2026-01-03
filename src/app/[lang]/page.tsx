
'use client';

import { useState, use, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ChevronDown, 
  Sparkles, 
  FolderOpen, 
  Server, 
  Rocket, 
  Layers, 
  Cloud, 
  Download,
  Menu,
  X as XIcon,
  ArrowRight,
  Check,
  Users,
  FileText,
  Star,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import { useTranslation } from '@/i18n/client';
import { useSession } from '@/lib/auth-client';
import LoginModal from '@/components/LoginModal';
import Footer from '@/components/layout/Footer';
import {
  AnimatedBackground,
  AnimatedCounter,
  TypewriterText,
  FloatingCard,
  ScrollProgress,
} from '@/components/landing';

const LandingPage = ({ params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = use(params);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const router = useRouter();
  const { t } = useTranslation(lang, 'landing');
  const { data: session } = useSession();
  
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const handleGetStarted = () => {
    if (session) {
      router.push(`/${lang}/dashboard`);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const typewriterTexts = [
    t('hero.typewriter.text1') || '发挥最大价值',
    t('hero.typewriter.text2') || '提升工作效率',
    t('hero.typewriter.text3') || '激发创意灵感',
  ];

  const features = [
    {
      icon: <FolderOpen className="w-7 h-7" />,
      title: t('features.management.title'),
      description: t('features.management.description'),
      gradient: 'from-[var(--primary-100)] to-[var(--primary-200)]',
      glowColor: 'rgba(106, 90, 205, 0.3)',
    },
    {
      icon: <Server className="w-7 h-7" />,
      title: t('features.mcp.title'),
      description: t('features.mcp.description'),
      gradient: 'from-[var(--orange-200)] to-[var(--orange-100)]',
      glowColor: 'rgba(255, 152, 2, 0.3)',
    },
    {
      icon: <Rocket className="w-7 h-7" />,
      title: t('features.quickAccess.title'),
      description: t('features.quickAccess.description'),
      gradient: 'from-[var(--accent-100)] to-[var(--accent-200)]',
      glowColor: 'rgba(217, 70, 239, 0.3)',
    },
    {
      icon: <Layers className="w-7 h-7" />,
      title: t('features.multiPlatform.title'),
      description: t('features.multiPlatform.description'),
      gradient: 'from-[var(--success-500)] to-green-600',
      glowColor: 'rgba(21, 128, 61, 0.3)',
    },
    {
      icon: <Cloud className="w-7 h-7" />,
      title: t('features.cloudSync.title'),
      description: t('features.cloudSync.description'),
      gradient: 'from-[var(--secondary-400)] to-purple-600',
      glowColor: 'rgba(124, 58, 237, 0.3)',
    },
    {
      icon: <Download className="w-7 h-7" />,
      title: t('features.importExport.title'),
      description: t('features.importExport.description'),
      gradient: 'from-blue-500 to-cyan-500',
      glowColor: 'rgba(59, 130, 246, 0.3)',
    }
  ];

  const steps = [
    {
      number: '01',
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      gradient: 'from-[var(--primary-100)] to-[var(--primary-200)]',
      icon: <Zap className="w-5 h-5 text-[var(--primary-100)]" />,
    },
    {
      number: '02',
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      gradient: 'from-[var(--orange-200)] to-[var(--orange-100)]',
      icon: <Shield className="w-5 h-5 text-[var(--orange-200)]" />,
    },
    {
      number: '03',
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      gradient: 'from-[var(--accent-100)] to-[var(--accent-200)]',
      icon: <Globe className="w-5 h-5 text-[var(--accent-100)]" />,
    }
  ];

  const faqs = [
    { question: t('faq.q1.question'), answer: t('faq.q1.answer') },
    { question: t('faq.q2.question'), answer: t('faq.q2.answer') },
    { question: t('faq.q3.question'), answer: t('faq.q3.answer') },
    { question: t('faq.q4.question'), answer: t('faq.q4.answer') },
    { question: t('faq.q5.question'), answer: t('faq.q5.answer') },
    { question: t('faq.q6.question'), answer: t('faq.q6.answer') }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] flex flex-col overflow-x-hidden">
      <ScrollProgress />
      <AnimatedBackground />

      {/* 导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-100)]/70 backdrop-blur-xl border-b border-[var(--bg-300)]/50">
        <nav className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${lang}`} className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-7 h-7 text-[var(--primary-100)]" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-[var(--text-100)] to-[var(--text-200)] bg-clip-text text-transparent group-hover:from-[var(--primary-100)] group-hover:to-[var(--accent-100)] transition-all duration-300">
                PromptHub
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {[
                { href: '#features', label: t('nav.features'), hot: false },
                { href: '#faq', label: t('nav.faq'), hot: false },
                { href: `/${lang}/download`, label: t('nav.download'), hot: false },
                { href: `/${lang}/explore`, label: t('nav.explore'), hot: true },
              ].map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="relative text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors group flex items-center gap-1"
                  >
                    {item.label}
                    {item.hot && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[var(--orange-200)] to-[var(--orange-100)] text-white rounded-full uppercase tracking-wide">
                        Hot
                      </span>
                    )}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher lang={lang} />
              <LoginButton lng={lang} />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 text-[var(--text-200)] hover:text-[var(--text-100)] rounded-lg hover:bg-[var(--bg-200)]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 py-4 border-t border-[var(--bg-300)]"
              >
                <div className="flex flex-col space-y-4">
                  <Link href="#features" className="text-[var(--text-200)] hover:text-[var(--text-100)]" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.features')}
                  </Link>
                  <Link href="#faq" className="text-[var(--text-200)] hover:text-[var(--text-100)]" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.faq')}
                  </Link>
                  <Link href={`/${lang}/download`} className="text-[var(--text-200)] hover:text-[var(--text-100)]" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.download')}
                  </Link>
                  <Link href={`/${lang}/explore`} className="text-[var(--text-200)] hover:text-[var(--text-100)] flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.explore')}
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-[var(--orange-200)] to-[var(--orange-100)] text-white rounded-full uppercase tracking-wide">
                      Hot
                    </span>
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

      {/* Hero 区域 */}
      <section ref={heroRef} className="pt-32 pb-24 px-4 sm:px-6 relative overflow-hidden flex-1 min-h-screen flex items-center">
        <motion.div 
          className="container mx-auto max-w-6xl relative z-10"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--primary-100)]/10 to-[var(--accent-100)]/10 border border-[var(--primary-100)]/20 mb-8 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4 text-[var(--primary-100)]" />
              </motion.div>
              <span className="text-sm font-medium bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] bg-clip-text text-transparent">
                {t('hero.badge')}
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="text-[var(--text-100)]">{t('hero.title')}</span>
              <br />
              <span className="bg-gradient-to-r from-[var(--primary-100)] via-[var(--accent-100)] to-[var(--secondary-400)] bg-clip-text text-transparent">
                <TypewriterText 
                  texts={typewriterTexts}
                  className="inline-block"
                  typingSpeed={80}
                  deletingSpeed={40}
                  pauseDuration={2500}
                />
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg sm:text-xl text-[var(--text-200)] mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(106, 90, 205, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] text-white rounded-2xl font-semibold text-lg shadow-lg shadow-[var(--primary-100)]/25 transition-all flex items-center gap-2 relative overflow-hidden"
              >
                <span className="relative z-10">{t('hero.cta')}</span>
                <motion.div
                  className="relative z-10"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ['100%', '-100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.button>
              <Link
                href="#features"
                className="group px-8 py-4 border-2 border-[var(--bg-400)] rounded-2xl font-semibold text-lg hover:bg-[var(--bg-200)] hover:border-[var(--primary-100)]/30 transition-all text-[var(--text-100)] flex items-center gap-2"
              >
                {t('hero.ctaSecondary')}
                <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
            >
              {[
                { icon: Users, value: 10000, suffix: '+', label: t('hero.stats.users'), color: 'var(--primary-100)' },
                { icon: FileText, value: 100000, suffix: '+', label: t('hero.stats.prompts'), color: 'var(--accent-100)' },
                { icon: Star, value: 98, suffix: '%', label: t('hero.stats.satisfaction'), color: 'var(--orange-200)' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-2xl bg-[var(--bg-200)]/50 backdrop-blur-sm border border-[var(--bg-300)]/50 hover:border-[var(--primary-100)]/30 transition-all"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    <AnimatedCounter 
                      value={stat.value} 
                      suffix={stat.suffix}
                      className="text-2xl sm:text-3xl font-bold text-[var(--text-100)]"
                    />
                  </div>
                  <p className="text-sm text-[var(--text-300)]">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-[var(--text-300)]" />
        </motion.div>
      </section>

      {/* 功能介绍区域 */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-[var(--bg-200)]/50 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.span 
              className="inline-block px-4 py-1.5 rounded-full bg-[var(--primary-100)]/10 text-[var(--primary-100)] text-sm font-medium mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Features
            </motion.span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-100)]">
              {t('features.title')} <span className="bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] bg-clip-text text-transparent">{t('features.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-[var(--text-200)] max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="h-[260px]"
              >
                <FloatingCard glowColor={feature.glowColor} className="h-full">
                  <div className="p-6 rounded-2xl bg-[var(--bg-100)] border border-[var(--bg-300)]/50 h-full hover:border-[var(--primary-100)]/30 transition-all duration-300 flex flex-col">
                    <motion.div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-lg flex-shrink-0`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3 text-[var(--text-100)] flex-shrink-0">{feature.title}</h3>
                    <p className="text-[var(--text-200)] leading-relaxed flex-grow overflow-hidden">{feature.description}</p>
                  </div>
                </FloatingCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用方法区域 */}
      <section className="py-24 px-4 sm:px-6 bg-[var(--bg-100)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-[var(--primary-100)]/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-[var(--accent-100)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.span 
              className="inline-block px-4 py-1.5 rounded-full bg-[var(--accent-100)]/10 text-[var(--accent-100)] text-sm font-medium mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              How It Works
            </motion.span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-100)]">
              {t('howItWorks.title')} <span className="bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] bg-clip-text text-transparent">{t('howItWorks.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-[var(--text-200)] max-w-2xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--primary-100)] via-[var(--accent-100)] to-[var(--secondary-400)]"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{ transformOrigin: 'left' }}
              />
            </div>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="relative"
              >
                <div className="text-center">
                  <motion.div
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white mx-auto mb-6 shadow-xl relative`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="text-3xl font-bold">{step.number}</span>
                    <motion.div
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.2 }}
                    >
                      {step.icon}
                    </motion.div>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 text-[var(--text-100)]">{step.title}</h3>
                  <p className="text-[var(--text-200)] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 区域 */}
      <section id="faq" className="py-24 px-4 sm:px-6 bg-[var(--bg-200)]/50">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-[var(--secondary-400)]/10 text-[var(--secondary-400)] text-sm font-medium mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              FAQ
            </motion.span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-100)]">
              {t('faq.title')}
            </h2>
            <p className="text-lg text-[var(--text-200)]">
              {t('faq.subtitle')}
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="bg-[var(--bg-100)] rounded-2xl border border-[var(--bg-300)]/50 overflow-hidden hover:border-[var(--primary-100)]/30 transition-all duration-300 hover:shadow-lg"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--bg-200)]/50 transition-colors"
                >
                  <span className="font-semibold text-[var(--text-100)] pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-[var(--text-300)] flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 text-[var(--text-200)] leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-24 px-4 sm:px-6 bg-[var(--bg-100)]">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center bg-gradient-to-br from-[var(--primary-100)]/10 via-[var(--accent-100)]/5 to-[var(--secondary-400)]/10 rounded-3xl p-12 border border-[var(--primary-100)]/20 relative overflow-hidden"
          >
            {/* 背景装饰 */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-100)]/10 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-100)]/10 rounded-full blur-3xl"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary-100)] to-[var(--accent-100)] flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[var(--text-100)]">
                {t('cta.title')}
              </h2>
              <p className="text-lg text-[var(--text-200)] mb-8 max-w-2xl mx-auto">
                {t('cta.subtitle')}
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(106, 90, 205, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] text-white rounded-2xl font-semibold text-lg shadow-lg shadow-[var(--primary-100)]/25 transition-all flex items-center gap-2 mx-auto relative overflow-hidden"
              >
                <span className="relative z-10">{t('cta.button')}</span>
                <motion.div
                  className="relative z-10"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ['100%', '-100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.button>
              <p className="text-sm text-[var(--text-300)] mt-4 flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-[var(--success-500)]" />
                {t('cta.note')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 底部 */}
      <Footer lang={lang} />

      {/* 登录模态框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lng={lang}
      />
    </div>
  );
};

export default LandingPage;