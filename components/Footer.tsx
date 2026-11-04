'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { INDIAN_METROS } from '../data/cities';
import BrandLogo from './BrandLogo';
import { useLanguage } from './LanguageProvider';

interface FooterProps {
  onSelectCity: (city: string) => void;
  onOpenAuth?: () => void;
  onOpenListProperty?: () => void;
}

export default function Footer({ onSelectCity }: FooterProps) {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const { t } = useLanguage();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full bg-[#EFEAE2] dark:bg-[#100F0D] border-t border-[#1A1A1A]/10 dark:border-white/10 pt-10 pb-8 text-[#1A1A1A]/80 dark:text-white/80 transition-colors">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 pb-8 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-3">
            <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
              <BrandLogo className="h-7.5 sm:h-8.5 w-auto" />
            </Link>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] max-w-md leading-relaxed">
              {t('footer.tagline', 'India\'s intelligent property matchmaking platform. Discover flats, villas, plots, and commercial offices across prime Indian cities.')}
            </p>
          </div>

          <div className="col-span-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white mb-2.5 sm:mb-3">
              {t('footer.popularMetros', 'Popular Metros')}
            </h5>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-[#5C5852] dark:text-[#A8A29A]">
              {INDIAN_METROS.filter((m) => m.name !== 'Pan India' && m.name !== 'All India').map((m) => (
                <li key={m.slug}>
                  <button
                    onClick={() => {
                      onSelectCity(m.name);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-[#DF6400] transition-colors text-left truncate max-w-full"
                  >
                    {t('footer.propertiesIn', 'Properties in')} {m.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white mb-2.5 sm:mb-3">
              {t('footer.brokerShowcase', 'Broker Showcase')}
            </h5>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-[#5C5852] dark:text-[#A8A29A]">
              <li>
                <Link href="/broker/apex-prime-realty" className="hover:text-[#DF6400] transition-colors block truncate">
                  Apex Prime (Mumbai)
                </Link>
              </li>
              <li>
                <Link href="/broker/deccan-prestige" className="hover:text-[#DF6400] transition-colors block truncate">
                  Deccan Prestige (BLR)
                </Link>
              </li>
              <li>
                <Link href="/broker/capital-corridors" className="hover:text-[#DF6400] transition-colors block truncate">
                  Capital Corridors (NCR)
                </Link>
              </li>
              <li>
                <Link href="/broker/sahyadri-premier" className="hover:text-[#DF6400] transition-colors block truncate">
                  Sahyadri (Pune)
                </Link>
              </li>
              <li>
                <Link href="/brokers" className="text-[#DF6400] font-bold hover:underline inline-flex items-center gap-1">
                  <span>{t('footer.allStores', 'All Stores')}</span>
                  <span>&rarr;</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white mb-2.5 sm:mb-3">
              {t('footer.legalTrust', 'Legal & Trust')}
            </h5>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:gap-2 text-xs text-[#5C5852] dark:text-[#A8A29A]">
              <li>
                <Link href="/terms" className="hover:text-[#DF6400] transition-colors">
                  {t('footer.terms', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#DF6400] transition-colors">
                  {t('footer.privacy', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#DF6400] transition-colors">
                  {t('footer.brokerLogin', 'Broker Portal Login')}
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#DF6400] transition-colors">
                  {t('footer.joinPlatform', 'Join Platform')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C5852] dark:text-[#A8A29A] gap-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <span>&copy; {currentYear} BrokersBlitz. {t('footer.rights', 'All rights reserved.')}</span>
          <span className="font-medium text-[#1A1A1A] dark:text-white">
            {t('footer.designedBy', 'Designed & Developed by')}{' '}
            <a
              href="https://abhigyatech.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#DF6400] font-bold hover:underline"
            >
              Abhigya Tech
            </a>
          </span>
        </div>

        <div className="pt-4 text-left">
          <p className="text-[11px] leading-relaxed text-[#7C776E] dark:text-[#8E887E]">
            <span className="font-semibold text-[#5C5852] dark:text-[#A8A29A]">{t('footer.disclaimerTitle', 'Disclaimer:')} </span>
            {t('footer.disclaimerText', 'BrokersBlitz is solely an intermediary platform connecting buyers and brokers. All listing details and RERA numbers are provided directly by third parties and are not independently verified. Users are strongly advised to independently verify all property titles, sanctions, and official RERA registrations on state government portals before executing agreements or making any financial commitments.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
