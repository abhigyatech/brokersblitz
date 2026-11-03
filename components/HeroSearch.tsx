'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Zap,
  RotateCcw,
  Check,
  Building2,
  Home,
  Briefcase,
  MapPin,
  ShieldCheck,
  TrendingUp,
  MessageSquareCode,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { INDIAN_METROS, PROPERTY_TYPES, BUDGET_RANGES, BHK_OPTIONS } from '../data/cities';
import SearchAutocompleteDropdown from './SearchAutocompleteDropdown';

interface HeroSearchProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onSearch: (filters: {
    purpose: 'sale' | 'rent' | 'all';
    city: string;
    locality: string;
    category: string;
    budget: string;
    bhk: string;
  }) => void;
}

export default function HeroSearch({
  selectedCity,
  onSelectCity,
  onSearch,
}: HeroSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'buy' | 'rent' | 'commercial' | 'plots'>('buy');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedBhk, setSelectedBhk] = useState('all');
  const [filterCity, setFilterCity] = useState(selectedCity);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilterCity(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    router.prefetch('/search');
  }, [router]);

  const activeFiltersCount = [
    activeTab !== 'buy',
    selectedCategory !== 'all',
    selectedBudget !== 'all',
    selectedBhk !== 'all',
    filterCity !== 'Pan India' && filterCity !== 'All India',
  ].filter(Boolean).length;

  const handleTabChange = (newTab: 'buy' | 'rent' | 'commercial' | 'plots') => {
    setActiveTab(newTab);
    if (newTab === 'commercial') {
      if (!['commercial_office', 'retail_shop', 'industrial_warehouse'].includes(selectedCategory)) {
        setSelectedCategory('commercial_office');
      }
    } else if (newTab === 'plots') {
      setSelectedCategory('residential_plot');
    } else {
      if (['commercial_office', 'retail_shop', 'industrial_warehouse', 'residential_plot'].includes(selectedCategory)) {
        setSelectedCategory('all');
      }
    }
  };

  const handleExecuteSearch = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    setIsFilterModalOpen(false);

    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();

    let purpose: 'sale' | 'rent' | 'all' = 'sale';
    let cat = selectedCategory;

    if (activeTab === 'rent') {
      purpose = 'rent';
      if (['commercial_office', 'retail_shop', 'industrial_warehouse', 'residential_plot'].includes(cat)) {
        cat = 'all';
      }
    } else if (activeTab === 'commercial') {
      purpose = 'all';
      if (cat === 'all' || !['commercial_office', 'retail_shop', 'industrial_warehouse'].includes(cat)) {
        cat = 'commercial_office';
      }
    } else if (activeTab === 'plots') {
      purpose = 'sale';
      cat = 'residential_plot';
    } else {
      purpose = 'sale';
      if (['commercial_office', 'retail_shop', 'industrial_warehouse', 'residential_plot'].includes(cat)) {
        cat = 'all';
      }
    }

    onSearch({
      purpose,
      city: filterCity,
      locality: q,
      category: cat,
      budget: selectedBudget,
      bhk: selectedBhk,
    });
  };

  const handleQuickPromptClick = (promptText: string) => {
    setSearchQuery(promptText);
    handleExecuteSearch(undefined, promptText);
  };

  const handleResetFilters = () => {
    setActiveTab('buy');
    setSelectedCategory('all');
    setSelectedBudget('all');
    setSelectedBhk('all');
    setFilterCity('Pan India');
    onSelectCity('Pan India');
  };

  const handleApplyFilterModal = () => {
    onSelectCity(filterCity);
    setIsFilterModalOpen(false);
    handleExecuteSearch();
  };

  const tabs = [
    { id: 'buy', label: 'Buy', icon: Home },
    { id: 'rent', label: 'Rent', icon: Building2 },
    { id: 'commercial', label: 'Commercial', icon: Briefcase },
    { id: 'plots', label: 'Plots', icon: MapPin },
  ];

  return (
    <section className="relative w-full min-h-[calc(100dvh-4.5rem)] md:min-h-[calc(100vh-4rem)] flex flex-col justify-between items-center pt-4 sm:pt-6 md:pt-16 pb-8 md:pb-12 px-4 sm:px-6 md:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-gradient-to-tr from-[#DF6400]/15 via-amber-400/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-16 left-1/4 w-80 h-80 bg-[#DF6400]/8 rounded-full blur-3xl animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-12 right-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-pulse duration-[6000ms]" />
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center flex-1 justify-start gap-5 sm:gap-6 md:justify-start md:flex-initial">
        <div className="w-full text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#DF6400]/15 via-amber-500/10 to-[#DF6400]/5 border border-[#DF6400]/30 text-[#DF6400] text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DF6400] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DF6400]"></span>
            </span>
            <span className="truncate">Next-Gen Real Estate Intelligence</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#1A1A1A] dark:text-white uppercase leading-tight sm:leading-tight">
            Turn Listings{' '}
            <span className="relative inline-block text-[#DF6400]">
              <span className="relative z-10">Into Closings</span>
              <span className="absolute bottom-1.5 left-0 w-full h-3 bg-[#DF6400]/20 -z-0 rounded-md"></span>
            </span>
          </h1>

          <p className="text-[#5C5852] dark:text-[#A8A29A] text-xs sm:text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed px-2">
            Search flats, luxury penthouses, commercial spaces, and verified broker stores with live suggestions.
          </p>
        </div>

        <div
          ref={searchContainerRef}
          className="mt-5 md:mt-0 w-full max-w-3xl mx-auto relative z-20 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/95 dark:bg-[#1E1B17]/95 backdrop-blur-xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm mb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-300 ${isActive
                    ? 'bg-[#DF6400] text-white shadow-md shadow-[#DF6400]/30 scale-[1.02]'
                    : 'text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F4F0EA] dark:hover:bg-[#24201C]'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 md:mt-0 w-full relative">
            <div className="p-1 sm:p-1.5 rounded-full bg-gradient-to-r from-[#DF6400]/25 via-amber-400/20 to-[#DF6400]/20 shadow-xl backdrop-blur-lg">
              <form
                onSubmit={(e) => handleExecuteSearch(e)}
                className="relative flex items-center bg-white dark:bg-[#1A1714] rounded-full p-1 sm:p-2 border border-white/60 dark:border-white/10 transition-all duration-200"
              >
                <div className="pl-3 sm:pl-4 pr-1 text-[#DF6400] flex-shrink-0">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <input
                  type="text"
                  placeholder="Search flats, localities, or brokers..."
                  value={searchQuery}
                  onMouseEnter={() => router.prefetch('/search')}
                  onFocus={() => {
                    router.prefetch('/search');
                    if (searchQuery.trim().length >= 2) setIsDropdownOpen(true);
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(e.target.value.trim().length >= 2);
                  }}
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm md:text-base font-medium text-[#1A1A1A] dark:text-white placeholder-[#5C5852]/60 dark:placeholder-white/40 outline-none px-2 min-w-0"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsDropdownOpen(false);
                    }}
                    className="p-1.5 text-[#5C5852] dark:text-white/60 hover:text-[#1A1A1A] dark:hover:text-white flex-shrink-0"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 pl-1">
                  <button
                    type="button"
                    onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
                    className={`relative px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${activeFiltersCount > 0
                      ? 'bg-[#DF6400]/15 text-[#DF6400] border-[#DF6400]'
                      : 'bg-[#F4F0EA] dark:bg-[#24201C] text-[#1A1A1A] dark:text-white border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400]'
                      }`}
                    title="Filter by City, Budget, Category, or Configuration"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#DF6400] text-white text-[9px] font-black flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="submit"
                    className="px-4 sm:px-6 py-2 rounded-full bg-[#DF6400] hover:bg-[#C75700] text-white text-xs sm:text-sm font-black shadow-md shadow-[#DF6400]/30 transition-all flex items-center gap-1.5 flex-shrink-0 group"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-3.5 h-3.5 hidden sm:inline-block transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </form>
            </div>

            <SearchAutocompleteDropdown
              query={searchQuery}
              selectedCity={filterCity}
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
            />
          </div>
        </div>

        <div className="mt-5 md:mt-0 w-full max-w-3xl mx-auto flex flex-col items-center gap-2 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5C5852] dark:text-[#A8A29A]">
            <Flame className="w-3.5 h-3.5 text-[#DF6400]" />
            <span>Trending Searches</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {[
              '2 BHK in Vijay Nagar',
              '3 BHK Bandra West',
              'Assagao Pool Villa',
              'Whitefield Gated Villa',
              'Grade-A Office Gurugram',
              'Rajesh Mehta Broker Store',
            ].map((prompt, idx) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleQuickPromptClick(prompt)}
                className={`group px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#1E1B17]/90 hover:bg-[#DF6400] hover:text-white text-[#1A1A1A] dark:text-white text-[11px] font-semibold border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs hover:shadow-md transition-all duration-200 ${idx >= 3 ? 'hidden sm:inline-flex' : 'inline-flex'
                  }`}
              >
                <span className="text-[#DF6400] group-hover:text-white mr-1 font-bold">#</span>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto mt-6 md:mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="group relative p-3 sm:p-3.5 rounded-2xl bg-white/20 dark:bg-[#1E1B17]/25 backdrop-blur-md border border-[#1A1A1A]/5 dark:border-white/5 hover:bg-white/40 dark:hover:bg-[#1E1B17]/45 hover:border-[#DF6400]/30 dark:hover:border-[#DF6400]/30 transition-all duration-300 shadow-xs hover:shadow-md flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 text-[#DF6400] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">Instant Visits</p>
              <p className="text-[10px] font-medium text-[#5C5852] dark:text-[#A8A29A] truncate">Book on-demand</p>
            </div>
          </div>

          <div className="group relative p-3 sm:p-3.5 rounded-2xl bg-white/20 dark:bg-[#1E1B17]/25 backdrop-blur-md border border-[#1A1A1A]/5 dark:border-white/5 hover:bg-white/40 dark:hover:bg-[#1E1B17]/45 hover:border-[#DF6400]/30 dark:hover:border-[#DF6400]/30 transition-all duration-300 shadow-xs hover:shadow-md flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-[#DF6400] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">AI Valuations</p>
              <p className="text-[10px] font-medium text-[#5C5852] dark:text-[#A8A29A] truncate">Live price trends</p>
            </div>
          </div>

          <div className="group relative p-3 sm:p-3.5 rounded-2xl bg-white/20 dark:bg-[#1E1B17]/25 backdrop-blur-md border border-[#1A1A1A]/5 dark:border-white/5 hover:bg-white/40 dark:hover:bg-[#1E1B17]/45 hover:border-[#DF6400]/30 dark:hover:border-[#DF6400]/30 transition-all duration-300 shadow-xs hover:shadow-md flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 text-[#DF6400] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquareCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">Verified Pros</p>
              <p className="text-[10px] font-medium text-[#5C5852] dark:text-[#A8A29A] truncate">Direct WhatsApp chat</p>
            </div>
          </div>

          <div className="group relative p-3 sm:p-3.5 rounded-2xl bg-white/20 dark:bg-[#1E1B17]/25 backdrop-blur-md border border-[#1A1A1A]/5 dark:border-white/5 hover:bg-white/40 dark:hover:bg-[#1E1B17]/45 hover:border-[#DF6400]/30 dark:hover:border-[#DF6400]/30 transition-all duration-300 shadow-xs hover:shadow-md flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-[#DF6400] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">Smart Match</p>
              <p className="text-[10px] font-medium text-[#5C5852] dark:text-[#A8A29A] truncate">Tailored precision</p>
            </div>
          </div>
        </div>
      </div>

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={filterModalRef}
            className="w-full max-w-lg bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/15 dark:border-white/15 shadow-2xl p-5 sm:p-6 text-left space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white">Search Filters</h3>
                  <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                    {activeFiltersCount > 0 ? `${activeFiltersCount} active criteria` : 'Refine your search'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 rounded-lg text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] mb-1.5">
                Listing Purpose
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTabChange(t.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id
                      ? 'bg-[#DF6400] text-white shadow-sm'
                      : 'bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white hover:bg-[#DF6400]/10 hover:text-[#DF6400]'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] mb-1">
                  Operating City
                </label>
                <div className="relative">
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400] appearance-none pr-8 cursor-pointer"
                  >
                    {INDIAN_METROS.map((city) => (
                      <option key={city.slug} value={city.name} className="dark:bg-[#141210] dark:text-white">
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5C5852] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] mb-1">
                  Property Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400] appearance-none pr-8 cursor-pointer"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value} className="dark:bg-[#141210] dark:text-white">
                        {pt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5C5852] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] mb-1">
                Budget Range
              </label>
              <div className="relative">
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400] appearance-none pr-8 cursor-pointer"
                >
                  {BUDGET_RANGES.map((b) => (
                    <option key={b.value} value={b.value} className="dark:bg-[#141210] dark:text-white">
                      {b.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5C5852] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] mb-1.5">
                Configuration (BHK)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {BHK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedBhk(opt.value)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${selectedBhk === opt.value
                      ? 'bg-[#DF6400] text-[#FFFFFF] border-[#DF6400]'
                      : 'bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400]'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>

              <button
                type="button"
                onClick={handleApplyFilterModal}
                className="px-5 py-2 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}