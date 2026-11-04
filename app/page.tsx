'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, Building2, PlusCircle, Store, CheckCircle2, MapPin, Star } from 'lucide-react';
import initialPropertiesData from '../data/properties.json';
import { PropertyListing, UserRole } from '../data/types';
import Navbar from '../components/Navbar';
import HeroSearch from '../components/HeroSearch';
import AppHighlightsBanner from '../components/AppHighlightsBanner';
import PropertyCard from '../components/PropertyCard';
import ListPropertyModal from '../components/ListPropertyModal';
import NavbarSearchModal from '../components/NavbarSearchModal';
import ShareModal from '../components/ShareModal';
import BlitzChatbot from '../components/BlitzChatbot';
import Footer from '../components/Footer';
import { useLanguage } from '../components/LanguageProvider';

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [properties, setProperties] = useState<PropertyListing[]>(
    initialPropertiesData as PropertyListing[]
  );
  const [selectedCity, setSelectedCity] = useState<string>('Pan India');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<'all' | 'sale' | 'rent'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'newest'>('featured');

  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [sharingProperty, setSharingProperty] = useState<PropertyListing | null>(null);
  const [isNavbarSearchOpen, setIsNavbarSearchOpen] = useState(false);
  const [isListPropertyModalOpen, setIsListPropertyModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: UserRole;
    email: string;
    phone: string;
    agency?: string;
    reraNumber?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    try {
      const savedCity = localStorage.getItem('bb_preferred_city');
      if (savedCity) setSelectedCity(savedCity);

      const savedIds = localStorage.getItem('bb_saved_properties');
      if (savedIds) setSavedPropertyIds(JSON.parse(savedIds));
    } catch { }

    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.properties) && data.properties.length > 0) {
          setProperties(data.properties);
        }
      })
      .catch(() => { });

    fetch('/api/saved')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.savedIds) && data.savedIds.length > 0) {
          setSavedPropertyIds(data.savedIds);
        }
      })
      .catch(() => { });

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser({
            name: data.user.fullName,
            role: data.user.role,
            email: data.user.email,
            phone: data.user.phone,
            agency: data.user.agencyName,
            reraNumber: data.user.reraNumber,
          });
        }
      })
      .catch(() => { });
  }, []);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    try {
      localStorage.setItem('bb_preferred_city', city);
    } catch { }
  };

  const handleToggleSave = (propId: string) => {
    let updated: string[];
    if (savedPropertyIds.includes(propId)) {
      updated = savedPropertyIds.filter((id) => id !== propId);
      showToast('Property removed from your shortlist.');
    } else {
      updated = [...savedPropertyIds, propId];
      showToast('Property saved to your shortlist!');
    }
    setSavedPropertyIds(updated);
    try {
      localStorage.setItem('bb_saved_properties', JSON.stringify(updated));
    } catch { }

    fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: propId }),
    }).catch(() => { });
  };

  const handleSearchTrigger = (filters: {
    purpose: 'sale' | 'rent' | 'all';
    city: string;
    locality: string;
    category: string;
    budget: string;
    bhk: string;
  }) => {
    const params = new URLSearchParams();
    if (filters.city && filters.city !== 'Pan India' && filters.city !== 'All India') params.set('city', filters.city);
    if (filters.purpose && filters.purpose !== 'all') params.set('purpose', filters.purpose);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.locality) params.set('q', filters.locality);
    if (filters.budget && filters.budget !== 'all') params.set('budget', filters.budget);
    if (filters.bhk && filters.bhk !== 'all') params.set('bhk', filters.bhk);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  };

  const handleOpenListProperty = () => {
    if (!currentUser) {
      router.push('/login?redirect=/dashboard');
      return;
    }
    if (currentUser.role === 'broker' || currentUser.role === 'admin') {
      router.push('/dashboard');
    }
  };

  const handlePropertyCreated = (newProp: PropertyListing) => {
    setProperties([newProp, ...properties]);
    showToast('Listing submitted to directory!');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    window.location.href = '/login';
  };

  const categoryTabs = [
    { id: 'all', label: t('categories.tabAll', 'All Categories') },
    { id: 'residential', label: t('categories.tabApartment', 'Residential Flats') },
    { id: 'villa_penthouse', label: t('categories.tabVilla', 'Villas & Penthouses') },
    { id: 'commercial', label: t('categories.tabCommercialOffice', 'Commercial & Offices') },
    { id: 'retail', label: t('categories.tabRetailShop', 'Retail & Shops') },
    { id: 'industrial', label: t('categories.tabWarehouse', 'Warehouses & Industrial') },
    { id: 'plots_land', label: t('categories.tabPlot', 'Plots & Land') },
  ];

  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        if (selectedCity !== 'Pan India' && selectedCity !== 'All India' && p.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }

        if (selectedPurpose !== 'all' && p.purpose !== selectedPurpose) {
          return false;
        }

        if (activeCategoryTab === 'residential') {
          if (p.category !== 'apartment' && p.category !== 'builder_floor' && p.category !== 'independent_house') return false;
        } else if (activeCategoryTab === 'villa_penthouse') {
          if (p.category !== 'villa' && p.category !== 'penthouse') return false;
        } else if (activeCategoryTab === 'commercial') {
          if (p.category !== 'commercial_office') return false;
        } else if (activeCategoryTab === 'retail') {
          if (p.category !== 'retail_shop' && p.category !== 'commercial_shop') return false;
        } else if (activeCategoryTab === 'industrial') {
          if (p.category !== 'industrial_warehouse') return false;
        } else if (activeCategoryTab === 'plots_land') {
          if (p.category !== 'residential_plot' && p.category !== 'agricultural_land') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [properties, selectedCity, activeCategoryTab, selectedPurpose, sortBy]);

  const brokerStores = useMemo(() => {
    const map = new Map<string, any>();
    properties.forEach((p) => {
      const code = p.broker.storeCode || p.broker.id;
      if (!map.has(code)) {
        map.set(code, {
          ...p.broker,
          storeCode: code,
          city: p.city,
          listingCount: 1,
        });
      } else {
        const item = map.get(code);
        item.listingCount += 1;
      }
    });
    return Array.from(map.values());
  }, [properties]);

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans transition-colors duration-200">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-[#24201C] text-[#1A1A1A] dark:text-white border border-[#1A1A1A]/10 dark:border-white/10 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DF6400] animate-pulse" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white p-0.5 ml-2 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Navbar
        selectedCity={selectedCity}
        onSelectCity={handleCityChange}
        onOpenSearchModal={() => setIsNavbarSearchOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenListProperty={handleOpenListProperty}
      />

      <main className="flex-1 w-full flex flex-col">
        <HeroSearch
          selectedCity={selectedCity}
          onSelectCity={handleCityChange}
          onSearch={handleSearchTrigger}
        />

        <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-10 bg-[#FAF7F2] dark:bg-[#12100E] border-y border-[#1A1A1A]/5 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#DF6400] bg-[#DF6400]/10 px-2.5 py-1 rounded-md">
                {t('categories.browseProperties', 'Browse Properties')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] dark:text-white tracking-tight mt-2.5">
                {t('categories.allHeading', 'Real Estate Across All Categories')}
              </h2>
              <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] mt-1.5 font-medium">
                {t('categories.allSub', 'Homes, workspaces, and investments curated for every ambition.')}
              </p>
            </div>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1C1917] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-semibold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] hover:text-[#DF6400] shadow-sm transition-all self-start md:self-auto"
            >
              <span>{t('categories.exploreAll', 'Explore All Properties')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div id="listings-showcase" className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${activeCategoryTab === tab.id
                      ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] shadow-sm'
                      : 'bg-white/80 dark:bg-[#1C1917]/80 text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-white dark:hover:bg-[#1C1917] border border-[#1A1A1A]/5 dark:border-white/5'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 p-1 bg-[#EBE5DC]/50 dark:bg-[#1C1917] rounded-xl w-fit">
                {(
                  [
                    { id: 'all', label: t('categories.purposeAll', 'All') },
                    { id: 'sale', label: t('categories.purposeBuy', 'Buy') },
                    { id: 'rent', label: t('categories.purposeRent', 'Rent') },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedPurpose(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${selectedPurpose === tab.id
                        ? 'bg-white dark:bg-[#282420] text-[#1A1A1A] dark:text-white shadow-sm'
                        : 'text-[#706B63] dark:text-[#8E877F] hover:text-[#1A1A1A] dark:hover:text-white'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs text-[#706B63] dark:text-[#8E877F]">
                  <strong className="text-[#1A1A1A] dark:text-white font-semibold">{filteredProperties.length}</strong> {t('categories.listingsCount', 'listings')}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white dark:bg-[#1C1917] border border-[#1A1A1A]/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] dark:text-white outline-none cursor-pointer hover:border-[#1A1A1A]/20 dark:hover:border-white/20 transition-colors"
                >
                  <option value="featured">{t('categories.sortFeatured', 'Featured First')}</option>
                  <option value="price_low">{t('categories.sortPriceLow', 'Price: Low to High')}</option>
                  <option value="price_high">{t('categories.sortPriceHigh', 'Price: High to Low')}</option>
                  <option value="newest">{t('categories.sortNewest', 'Recently Listed')}</option>
                </select>
              </div>
            </div>

            {filteredProperties.length > 0 ? (
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                {filteredProperties.map((prop) => (
                  <div key={prop.id} className="w-[280px] xs:w-[300px] sm:w-auto flex-shrink-0 snap-start">
                    <PropertyCard
                      property={prop}
                      isSaved={savedPropertyIds.includes(prop.id)}
                      onShare={(p) => setSharingProperty(p)}
                      onToggleSave={handleToggleSave}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-dashed border-[#1A1A1A]/15 dark:border-white/15 py-14 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white">
                  {t('categories.emptyTitle', 'No properties found in this category')}
                </h3>
                <p className="text-xs text-[#706B63] dark:text-[#8E877F] mt-1 max-w-sm">
                  {t('categories.emptySub', 'Try switching categories or purpose, or list a property directly to showcase it here.')}
                </p>
                <button
                  onClick={() => router.push(currentUser?.role === 'broker' ? '/dashboard' : '/login?redirect=/dashboard')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('categories.emptyBtn', 'Post Property Listing')}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-10 sm:py-12 bg-white dark:bg-[#151311] border-b border-[#1A1A1A]/5 dark:border-white/5">
          <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-md bg-[#DF6400]/10 text-[#DF6400] text-[10px] font-black uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" />
                <span>{t('brokersSection.badge', 'Verified Partners')}</span>
              </div>
              <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-[#1A1A1A] dark:text-white tracking-tight mt-1.5 sm:mt-2.5 truncate">
                <span className="sm:hidden">{t('brokersSection.headingMobile', 'Verified Broker Stores')}</span>
                <span className="hidden sm:inline">{t('brokersSection.headingDesktop', 'Verified Broker Stores By Location')}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] mt-0.5 sm:mt-1 font-medium truncate">
                <span className="sm:hidden">{t('brokersSection.subMobile', 'Connect with certified advisors.')}</span>
                <span className="hidden sm:inline">{t('brokersSection.subDesktop', 'Connect directly with certified real estate advisors across Indian metros.')}</span>
              </p>
            </div>

            <Link
              href="/brokers"
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] shadow-sm transition-all flex-shrink-0"
            >
              <span className="sm:hidden">{t('brokersSection.btnMobile', 'All Stores')}</span>
              <span className="hidden sm:inline">{t('brokersSection.btnDesktop', 'Explore All Broker Stores')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {brokerStores.slice(0, 4).map((b) => (
              <Link
                key={b.storeCode}
                href={`/broker/${b.storeCode}`}
                className="w-[270px] xs:w-[290px] sm:w-auto flex-shrink-0 snap-start group p-4 rounded-2xl bg-[#F4F0EA]/60 dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#141210] text-[10px] font-bold text-[#DF6400] border border-[#DF6400]/20">
                      <MapPin className="w-3 h-3" />
                      <span>{b.city}</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{b.rating || 4.9}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/10 border border-[#1A1A1A]/10 flex-shrink-0">
                      <Image
                        src={b.avatar}
                        alt={b.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-black text-[#1A1A1A] dark:text-white truncate group-hover:text-[#DF6400]">
                          {b.agency}
                        </h4>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      </div>
                      <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] truncate">
                        {b.name}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] line-clamp-2">
                    {b.bio}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#1A1A1A]/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono font-bold text-[#5C5852] dark:text-[#A8A29A]">
                    {b.listingCount} {t('brokersSection.activeListings', 'Active Listings')}
                  </span>
                  <span className="text-[11px] font-bold text-[#DF6400] flex items-center gap-1">
                    <span>{t('brokersSection.visitStore', 'Visit Store')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <AppHighlightsBanner />
      </main>

      {isListPropertyModalOpen && (
        <ListPropertyModal
          isOpen={isListPropertyModalOpen}
          onClose={() => setIsListPropertyModalOpen(false)}
          onPropertyCreated={handlePropertyCreated}
          currentUser={currentUser}
          onRequireAuth={() => router.push('/login?redirect=/dashboard')}
        />
      )}

      {isNavbarSearchOpen && (
        <NavbarSearchModal
          isOpen={isNavbarSearchOpen}
          onClose={() => setIsNavbarSearchOpen(false)}
          selectedCity={selectedCity}
          onSearch={handleSearchTrigger}
        />
      )}

      {sharingProperty && (
        <ShareModal
          property={sharingProperty}
          onClose={() => setSharingProperty(null)}
        />
      )}

      <BlitzChatbot />

      <Footer onSelectCity={handleCityChange} />
    </div>
  );
}