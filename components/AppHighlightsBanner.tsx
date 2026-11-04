'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Wallet,
  Store,
  Sparkles,
  LayoutGrid,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export default function AppHighlightsBanner() {
  const { t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const valueProps = [
    {
      title: t('highlights.prop1Title', 'Pay-As-You-Go'),
      desc: t('highlights.prop1Desc', 'No heavy lock-ins or hefty yearly fees. Recharge only when you need active leads.'),
      badge: t('highlights.prop1Badge', 'Budget Friendly'),
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      title: t('highlights.prop2Title', 'Your Own Digital Storefront'),
      desc: t('highlights.prop2Desc', 'Share a neat, branded web link of all your available properties directly on WhatsApp.'),
      badge: t('highlights.prop2Badge', 'Personal Link'),
      icon: <Store className="w-5 h-5" />,
    },
    {
      title: t('highlights.prop3Title', 'Smart Automation'),
      desc: t('highlights.prop3Desc', 'Let auto-replies send brochures and schedule site visits even while you are on site visits.'),
      badge: t('highlights.prop3Badge', 'Time Saver'),
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      title: t('highlights.prop4Title', 'Zero Lead Chaos'),
      desc: t('highlights.prop4Desc', 'Track every buyer inquiry, pending follow-up, and hot deal in one organized place.'),
      badge: t('highlights.prop4Badge', 'Organized'),
      icon: <LayoutGrid className="w-5 h-5" />,
    },
    {
      title: t('highlights.prop5Title', 'Direct Genuine Inquiries'),
      desc: t('highlights.prop5Desc', 'Connect straight with interested buyers. No unwanted calls, middlemen, or noisy spam.'),
      badge: t('highlights.prop5Badge', '100% Verified'),
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      title: t('highlights.prop6Title', 'Faster Closures'),
      desc: t('highlights.prop6Desc', 'Present fresh inventory quickly to ready buyers and close token deals without friction.'),
      badge: t('highlights.prop6Badge', 'High Conversion'),
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      if (isPaused) return;
      if (window.innerWidth >= 640) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;
      const cardWidth = 272;

      if (currentScroll >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
        setActiveIndex(0);
      } else {
        const nextScroll = currentScroll + cardWidth;
        container.scrollTo({ left: nextScroll, behavior: 'smooth' });
        const nextIdx = Math.min(valueProps.length - 1, Math.round(nextScroll / cardWidth));
        setActiveIndex(nextIdx);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isPaused, valueProps.length]);

  const handleContainerScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || window.innerWidth >= 640) return;
    const cardWidth = 272;
    const idx = Math.min(
      valueProps.length - 1,
      Math.max(0, Math.round(container.scrollLeft / cardWidth))
    );
    setActiveIndex(idx);
  };

  return (
    <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-10 my-4 border-t border-[#1A1A1A]/10 dark:border-white/10 transition-colors">
      <div className="w-full mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#DF6400] bg-[#DF6400]/10 px-2.5 py-1 rounded-md inline-block mb-1.5">
            {t('highlights.badge', 'Built For Modern Brokers')}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
            {t('highlights.heading', 'Why Top Real Estate Advisors Partner With BrokersBlitz')}
          </h3>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2500)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5"
      >
        {valueProps.map((item, idx) => (
          <div
            key={idx}
            className="group flex-shrink-0 w-[260px] sm:w-auto snap-start p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1917] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400]/40 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DF6400] group-hover:text-white transition-colors shadow-sm">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1A1A1A]/5 dark:bg-white/10 text-[#706B63] dark:text-[#8E877F]">
                  {item.badge}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white mb-1 tracking-tight">
                {item.title}
              </h4>
              <p className="text-xs text-[#706B63] dark:text-[#8E877F] leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
        {valueProps.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => {
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollTo({ left: dotIdx * 272, behavior: 'smooth' });
                setActiveIndex(dotIdx);
              }
            }}
            className={`h-1.5 rounded-full transition-all ${activeIndex === dotIdx ? 'w-5 bg-[#DF6400]' : 'w-1.5 bg-[#1A1A1A]/20 dark:bg-white/20'
              }`}
            aria-label={`Jump to slide ${dotIdx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
