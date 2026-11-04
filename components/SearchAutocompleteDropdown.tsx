'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Store,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface SmartSearch {
  title: string;
  subtitle: string;
  url: string;
  type: string;
}

interface BrokerStore {
  id: string;
  name: string;
  agency: string;
  storeCode: string;
  city: string;
  reraNumber: string;
  experienceYears: number;
  avatar: string;
  url: string;
}

interface PropertyItem {
  id: string;
  slug: string;
  title: string;
  formattedPrice: string;
  categoryLabel: string;
  category: string;
  bedrooms: number;
  locality: string;
  city: string;
  primaryImage: string;
  url: string;
}

interface SearchAutocompleteDropdownProps {
  query: string;
  selectedCity?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestion?: (url: string) => void;
}

export default function SearchAutocompleteDropdown({
  query,
  selectedCity,
  isOpen,
  onClose,
  onSelectSuggestion,
}: SearchAutocompleteDropdownProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [smartSearches, setSmartSearches] = useState<SmartSearch[]>([]);
  const [brokerStores, setBrokerStores] = useState<BrokerStore[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [navigatingUrl, setNavigatingUrl] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSmartSearches([]);
      setBrokerStores([]);
      setProperties([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(trimmed)}&city=${encodeURIComponent(selectedCity || '')}`
        );
        const data = await res.json();
        if (data.success) {
          const ss: SmartSearch[] = data.smartSearches || [];
          const bs: BrokerStore[] = data.brokerStores || [];
          const ps: PropertyItem[] = data.properties || [];
          setSmartSearches(ss);
          setBrokerStores(bs);
          setProperties(ps);
          setSelectedIndex(-1);
          ss.forEach((item) => {
            try { router.prefetch(item.url); } catch {}
          });
          bs.forEach((item) => {
            try { router.prefetch(item.url); } catch {}
          });
          ps.forEach((item) => {
            try { router.prefetch(item.url); } catch {}
          });
        }
      } catch {
        setSmartSearches([]);
        setBrokerStores([]);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, selectedCity, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const allItems = [
    ...smartSearches.map((s) => ({ type: 'search', url: s.url })),
    ...brokerStores.map((b) => ({ type: 'broker', url: b.url })),
    ...properties.map((p) => ({ type: 'property', url: p.url })),
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || allItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allItems.length - 1));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < allItems.length) {
          e.preventDefault();
          handleNavigate(allItems[selectedIndex].url);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex]);

  const handleNavigate = (url: string) => {
    setNavigatingUrl(url);
    if (onSelectSuggestion) {
      onSelectSuggestion(url);
    } else {
      router.push(url);
    }
    setTimeout(() => onClose(), 150);
  };

  if (!isOpen || (!query.trim() && !loading)) {
    return null;
  }

  const hasResults = smartSearches.length > 0 || brokerStores.length > 0 || properties.length > 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 z-30 bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/15 dark:border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-left max-h-[480px] sm:max-h-[520px] overflow-y-auto no-scrollbar font-sans"
    >
      {loading && !hasResults && (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#5C5852] dark:text-[#A8A29A]">
            <Sparkles className="w-4 h-4 text-[#DF6400] animate-pulse" />
            <span className="font-bold">{t('autocomplete.analyzing', 'Analyzing Indian real estate listings & brokers...')}</span>
          </div>
          <div className="space-y-2">
            <div className="h-9 bg-[#F4F0EA] dark:bg-[#25221E] rounded-xl animate-pulse"></div>
            <div className="h-14 bg-[#F4F0EA] dark:bg-[#25221E] rounded-xl animate-pulse"></div>
            <div className="h-14 bg-[#F4F0EA] dark:bg-[#25221E] rounded-xl animate-pulse"></div>
          </div>
        </div>
      )}

      {!loading && !hasResults && query.trim().length >= 2 && (
        <div className="p-5 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
          <Building2 className="w-6 h-6 mx-auto mb-2 text-[#DF6400]" />
          <p className="font-bold text-[#1A1A1A] dark:text-white">{t('autocomplete.noResults', 'No exact properties found for')} &quot;{query}&quot;</p>
          <p className="mt-1">{t('autocomplete.noResultsSub', 'Try searching by metro city, BHK, or explore all Pan India properties below.')}</p>
          <button
            onClick={() => handleNavigate(`/search?query=${encodeURIComponent(query)}`)}
            className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#DF6400] text-white font-bold text-xs hover:bg-[#C75700] transition-colors"
          >
            {t('autocomplete.exploreAll', 'Explore all listings')}
          </button>
        </div>
      )}

      {hasResults && (
        <div className="divide-y divide-[#1A1A1A]/10 dark:divide-white/10 text-xs">
          {smartSearches.length > 0 && (
            <div className="p-2 sm:p-2.5">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] tracking-wider">
                {t('autocomplete.smartSuggestions', 'Smart Suggestions')}
              </div>
              <div className="space-y-1">
                {smartSearches.map((s, idx) => {
                  const isItemActive = selectedIndex === idx || navigatingUrl === s.url;
                  return (
                    <button
                      key={s.url + idx}
                      type="button"
                      onMouseEnter={() => {
                        try { router.prefetch(s.url); } catch {}
                      }}
                      onClick={() => handleNavigate(s.url)}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                        isItemActive
                          ? 'bg-[#DF6400]/20 text-[#DF6400] ring-1 ring-[#DF6400]/50 animate-pulse'
                          : 'hover:bg-[#F4F0EA] dark:hover:bg-[#25221E] text-[#1A1A1A] dark:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#F4F0EA] dark:bg-[#2A2622] flex items-center justify-center flex-shrink-0 text-[#DF6400]">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="font-bold text-xs truncate">{s.title}</div>
                          <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] truncate">{s.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#5C5852] flex-shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {brokerStores.length > 0 && (
            <div className="p-2 sm:p-2.5">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] tracking-wider flex items-center justify-between">
                <span>{t('autocomplete.verifiedStores', 'Verified Broker Stores')}</span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">RERA Registered</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {brokerStores.map((b, idx) => {
                  const itemIdx = smartSearches.length + idx;
                  const isItemActive = selectedIndex === itemIdx || navigatingUrl === b.url;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onMouseEnter={() => {
                        try { router.prefetch(b.url); } catch {}
                      }}
                      onClick={() => handleNavigate(b.url)}
                      className={`p-2.5 rounded-2xl flex items-center gap-3 text-left transition-all border ${
                        isItemActive
                          ? 'bg-[#DF6400]/20 border-[#DF6400] ring-1 ring-[#DF6400]/50 animate-pulse'
                          : 'bg-[#F4F0EA]/70 dark:bg-[#181614] border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400]'
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-brandDark/10 border border-[#1A1A1A]/10 flex-shrink-0">
                        <Image src={b.avatar} alt={b.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-xs text-[#1A1A1A] dark:text-white truncate">{b.agency}</h4>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] truncate">
                          {b.name} • {b.city}
                        </p>
                        <span className="inline-block mt-0.5 text-[9px] font-mono font-bold text-[#DF6400]">
                          {t('brokersSection.visitStore', 'Visit Store')} &rarr;
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {properties.length > 0 && (
            <div className="p-2 sm:p-2.5">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] tracking-wider">
                {t('autocomplete.directProperties', 'Matching Properties')} ({properties.length})
              </div>
              <div className="space-y-1.5 mt-1">
                {properties.map((p, idx) => {
                  const itemIdx = smartSearches.length + brokerStores.length + idx;
                  const isItemActive = selectedIndex === itemIdx || navigatingUrl === p.url;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onMouseEnter={() => {
                        try { router.prefetch(p.url); } catch {}
                      }}
                      onClick={() => handleNavigate(p.url)}
                      className={`w-full p-2 rounded-2xl flex items-center gap-3 text-left transition-all ${
                        isItemActive
                          ? 'bg-[#DF6400]/20 ring-1 ring-[#DF6400]/50 animate-pulse'
                          : 'hover:bg-[#F4F0EA] dark:hover:bg-[#25221E]'
                      }`}
                    >
                      <div className="relative w-14 h-12 rounded-xl overflow-hidden bg-black/10 flex-shrink-0">
                        <Image src={p.primaryImage} alt={p.title} fill className="object-cover" sizes="56px" />
                        <span className="absolute bottom-0.5 left-0.5 bg-black/75 text-white text-[8px] font-bold px-1 rounded">
                          {p.categoryLabel}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-[#1A1A1A] dark:text-white truncate">{p.title}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
                          <MapPin className="w-3 h-3 text-[#DF6400] flex-shrink-0" />
                          <span className="truncate">{p.locality}, {p.city}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-xs text-[#DF6400] font-mono">{p.formattedPrice}</div>
                        <span className="text-[9px] text-[#5C5852] dark:text-[#A8A29A]">View Details</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-2.5 bg-[#F4F0EA]/40 dark:bg-[#141210]/60 flex items-center justify-between">
            <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">
              Press <kbd className="px-1 py-0.5 bg-white dark:bg-[#25221E] border border-[#1A1A1A]/10 dark:border-white/10 rounded font-mono text-[9px]">Enter</kbd> to search or click any result
            </span>
            <button
              type="button"
              onClick={() => handleNavigate(`/search?query=${encodeURIComponent(query)}`)}
              className="text-xs font-bold text-[#DF6400] hover:underline flex items-center gap-1"
            >
              <span>See all results</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

