'use client';

import { useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Star
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import { useTranslation } from '@/i18n/client';
import { useSession } from '@/lib/auth-client';
import LoginModal from '@/components/LoginModal';
import Footer from '@/components/layout/Footer';

const LandingPage = ({ params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = use(params);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const router = useRouter();
  const { t } = useTranslation(lang, 'landing');
  const { data: session } = useSession();

  const handleGetStarted = () => {
    if (session) {
      router.push(`/${lang}/dashboard`);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const features = [
    {
      icon: <FolderOpen className="w-8 h-8" />,
      title: t('features.management.title'),
      description: t('features.management.description'),
      gradient: 'from-[var(--primary-100)] to-[var(--primary-200)]',
      bgClass: 'bg-[var(--primary-100)]/10',
      borderClass: 'border-[var(--primary-100)]/20'
    },
    {
      icon: <Server className="w-8 h-8" />,
      title: t('features.mcp.title'),
      description: t('features.mcp.description'),
      gradient: 'from-[var(--orange-200)] to-[var(--orange-100)]',
      bgClass: 'bg-[var(--orange-200)]/10',
      borderClass: 'border-[var(--orange-200)]/20'
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: t('features.quickAccess.title'),
      description: t('features.quickAccess.description'),
      gradient: 'from-[var(--accent-100)] to-[var(--accent-200)]',
      bgClass: 'bg-[var(--accent-100)]/10',
      borderClass: 'border-[var(--accent-100)]/20'
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: t('features.multiPlatform.title'),
      description: t('features.multiPlatform.description'),
      gradient: 'from-[var(--success-500)] to-green-600',
      bgClass: 'bg-[var(--success-500)]/10',
      borderClass: 'border-[var(--success-500)]/20'
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: t('features.cloudSync.title'),
      description: t('features.cloudSync.description'),
      gradient: 'from-[var(--secondary-400)] to-purple-600',
      bgClass: 'bg-[var(--secondary-400)]/10',
      borderClass: 'border-[var(--secondary-400)]/20'
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: t('features.importExport.title'),
      description: t('features.importExport.description'),
      gradient: 'from-[var(--secondary-400)] to-purple-600',
      bgClass: 'bg-[var(--secondary-400)]/10',
      borderClass: 'border-[var(--secondary-400)]/20'
    }
  ];

  const steps = [
    {
      number: t('howItWorks.step1.number'),
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      gradient: 'from-[var(--primary-100)] to-[var(--primary-200)]'
    },
    {
      number: t('howItWorks.step2.number'),
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      gradient: 'from-[var(--orange-200)] to-[var(--orange-100)]'
    },
    {
      number: t('howItWorks.step3.number'),
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      gradient: 'from-[var(--accent-100)] to-[var(--accent-200)]'
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

  return (
    <div className="min-h-screen bg-[var(--bg-100)] text-[var(--text-100)] flex flex-col">
      {/* 导航栏 */}
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
              <Link href="#features" className="text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors">
                {t('nav.features')}
              </Link>
              <Link href="#faq" className="text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors">
                {t('nav.faq')}
              </Link>
              <Link href={`/${lang}/download`} className="text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors">
                {t('nav.download')}
              </Link>
              <Link href={`/${lang}/explore`} className="text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors">
                {t('nav.explore')}
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
                  <Link href="#features" className="text-[var(--text-200)] hover:text-[var(--text-100)]" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.features')}
                  </Link>
                  <Link href="#faq" className="text-[var(--text-200)] hover:text-[var(--text-100)]" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.faq')}
                  </Link>
                  <Link href={`/${lang}/download`} className="text-[var(--text-200)] hover:text-[var(--text-100)]" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.download')}
                  </Link>
                  <Link href={`/${lang}/explore`} className="text-[var(--text-200)] hover:text-[var(--text-100)]" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('nav.explore')}
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
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden flex-1">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[var(--primary-100)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[var(--accent-100)]/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* 徽章 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary-100)]/10 border border-[var(--primary-100)]/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-[var(--primary-100)]" />
              <span className="text-sm font-medium text-[var(--primary-100)]">{t('hero.badge')}</span>
            </motion.div>

            {/* 标题 */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-[var(--text-100)]">{t('hero.title')}</span>
              <br />
              <span className="bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            {/* 副标题 */}
            <p className="text-lg sm:text-xl text-[var(--text-200)] mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* CTA 按钮 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] text-white rounded-xl font-semibold text-lg shadow-lg shadow-[var(--primary-100)]/25 hover:shadow-xl hover:shadow-[var(--primary-100)]/30 transition-all flex items-center gap-2"
              >
                {t('hero.cta')}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <Link
                href="#features"
                className="px-8 py-4 border border-[var(--bg-400)] rounded-xl font-semibold text-lg hover:bg-[var(--bg-200)] transition-all text-[var(--text-100)]"
              >
                {t('hero.ctaSecondary')}
              </Link>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[var(--primary-100)]" />
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--text-100)]">10K+</span>
                </div>
                <p className="text-sm text-[var(--text-300)]">{t('hero.stats.users')}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-[var(--accent-100)]" />
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--text-100)]">100K+</span>
                </div>
                <p className="text-sm text-[var(--text-300)]">{t('hero.stats.prompts')}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-[var(--orange-200)]" />
                  <span className="text-2xl sm:text-3xl font-bold text-[var(--text-100)]">98%</span>
                </div>
                <p className="text-sm text-[var(--text-300)]">{t('hero.stats.satisfaction')}</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 功能介绍区域 */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-[var(--bg-200)]">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl ${feature.bgClass} border ${feature.borderClass} hover:shadow-lg transition-all group bg-[var(--bg-100)]`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[var(--text-100)]">{feature.title}</h3>
                <p className="text-[var(--text-200)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用方法区域 */}
      <section className="py-20 px-4 sm:px-6 bg-[var(--bg-100)]">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-100)]">
              {t('howItWorks.title')} <span className="bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] bg-clip-text text-transparent">{t('howItWorks.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-[var(--text-200)] max-w-2xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[var(--bg-400)] to-transparent" />
                )}
                
                <div className="text-center">
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg`}>
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[var(--text-100)]">{step.title}</h3>
                  <p className="text-[var(--text-200)] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 区域 */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-[var(--bg-200)]">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
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
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-[var(--bg-100)] rounded-xl border border-[var(--bg-300)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[var(--bg-200)] transition-colors"
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
      <section className="py-20 px-4 sm:px-6 bg-[var(--bg-100)]">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-br from-[var(--primary-100)]/10 to-[var(--accent-100)]/10 rounded-3xl p-12 border border-[var(--primary-100)]/20"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[var(--text-100)]">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-[var(--text-200)] mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-[var(--primary-100)] to-[var(--accent-100)] text-white rounded-xl font-semibold text-lg shadow-lg shadow-[var(--primary-100)]/25 hover:shadow-xl hover:shadow-[var(--primary-100)]/30 transition-all flex items-center gap-2 mx-auto"
            >
              {t('cta.button')}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <p className="text-sm text-[var(--text-300)] mt-4 flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[var(--success-500)]" />
              {t('cta.note')}
            </p>
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