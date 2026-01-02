'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n/client';

interface FooterProps {
  lang: string;
}

const Footer = ({ lang }: FooterProps) => {
  const { t } = useTranslation(lang, 'common');

  return (
    <footer id="footer" className="bg-[var(--bg-900)] py-4 sm:py-6 z-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-0">
          <Link href={`/${lang}`} className="flex items-center space-x-2 mb-2 md:mb-0">
            <Sparkles className="w-5 h-5 text-[var(--primary-100)]" />
            <span className="text-base font-semibold text-[var(--bg-100)]">PromptHub</span>
          </Link>
          
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2 md:mb-0 text-sm">
            {/* <Link href={`/${lang}/pricing`} className="text-[var(--bg-500)] hover:text-[var(--primary-100)] transition-colors">
              {t('footer.pricing')}
            </Link> */}
            <Link href={`/${lang}/privacy`} className="text-[var(--bg-500)] hover:text-[var(--primary-100)] transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href={`/${lang}/terms`} className="text-[var(--bg-500)] hover:text-[var(--primary-100)] transition-colors">
              {t('footer.terms')}
            </Link>
            <Link href={`/${lang}/contact`} className="text-[var(--bg-500)] hover:text-[var(--primary-100)] transition-colors">
              {t('footer.contact')}
            </Link>
          </div>
          
          <p className="text-[var(--bg-500)] text-xs">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;