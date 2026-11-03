'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Store,
  MapPin,
  CheckCircle2,
  Search,
  Star,
  ExternalLink,
  MessageSquare,
  Building2,
  Briefcase,
  Home,
  SlidersHorizontal,
  X,
  Share2,
  Phone,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlitzChatbot from '@/components/BlitzChatbot';
import { INDIAN_METROS } from '@/data/cities';

export interface BrokerStoreItem {
  id: string;
  fullName: string;
  agencyName: string;
  storeCode: string;
  operatingCity: string;
  reraNumber: string;
  experienceYears: number;
  avatar: string;
  phone: string;
  email: string;
  bio: string;
  rating: number;
  totalListings: number;
  localities: string[];
  specializations: string[];
  recentListings: {
    id: string;
    slug: string;
    title: string;
    formattedPrice: string;
    categoryLabel: string;
    locality: string;
    city: string;
    primaryImage: string;
  }[];
}

interface BrokersClientProps {
  initialBrokers: BrokerStoreItem[];
}

export default function BrokersClient({ initialBrokers }: BrokersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [brokers, setBrokers] = useState<BrokerStoreItem[]>(initialBrokers);
  const [selectedCity, setSelectedCity] = useState<string>(
    searchParams.get('city') || 'Pan India'
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('q') || ''
  );
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>(
    searchParams.get('spec') || 'all'
  );
  const [minExperience, setMinExperience] = useState<number>(0);
  const [sortBy, setSortBy] = useState<
    'listings' | 'rating' | 'experience' | 'name'
  >('listings');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/brokers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.brokers) && data.brokers.length > 0) {
          setBrokers(data.brokers);
        }
      })
      .catch(() => {});
  }, []);

  const specializations = [
    { id: 'all', label: 'All Specializations' },
    { id: 'Luxury Residences', label: 'Luxury Residences' },
    { id: 'Commercial & Retail', label: 'Commercial & Retail' },
    { id: 'Residential Apartments', label: 'Residential Apartments' },
    { id: 'Plots & Land', label: 'Plots & Land' },
  ];

  const cityTabs = [
    'Pan India',
    'Mumbai',
    'Bengaluru',
    'Delhi NCR',
    'Pune',
    'Hyderabad',
    'Goa',
    'Chennai',
  ];

  const filteredBrokers = useMemo(() => {
    return brokers
      .filter((b) => {
        if (
          selectedCity !== 'Pan India' &&
          selectedCity !== 'All India' &&
          b.operatingCity.toLowerCase() !== selectedCity.toLowerCase()
        ) {
          return false;
        }

        if (selectedSpecialization !== 'all') {
          const hasSpec = b.specializations.some((spec) =>
            spec.toLowerCase().includes(selectedSpecialization.toLowerCase())
          );
          if (!hasSpec) return false;
        }

        if (minExperience > 0 && b.experienceYears < minExperience) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchAgency = b.agencyName.toLowerCase().includes(q);
          const matchName = b.fullName.toLowerCase().includes(q);
          const matchCity = b.operatingCity.toLowerCase().includes(q);
          const matchRera = b.reraNumber.toLowerCase().includes(q);
          const matchLocality = b.localities.some((loc) =>
            loc.toLowerCase().includes(q)
          );
          const matchSpec = b.specializations.some((s) =>
            s.toLowerCase().includes(q)
          );
          if (
            !matchAgency &&
            !matchName &&
            !matchCity &&
            !matchRera &&
            !matchLocality &&
            !matchSpec
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'listings') return b.totalListings - a.totalListings;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
        if (sortBy === 'name') return a.agencyName.localeCompare(b.agencyName);
        return 0;
      });
  }, [
    brokers,
    selectedCity,
    selectedSpecialization,
    minExperience,
    searchQuery,
    sortBy,
  ]);

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Pan India': brokers.length };
    brokers.forEach((b) => {
      counts[b.operatingCity] = (counts[b.operatingCity] || 0) + 1;
    });
    return counts;
  }, [brokers]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    const params = new URLSearchParams();
    if (city !== 'Pan India' && city !== 'All India') params.set('city', city);
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSpecialization !== 'all') params.set('spec', selectedSpecialization);
    const qs = params.toString();
    router.replace(qs ? `/brokers?${qs}` : '/brokers');
  };

  const handleShareStore = (storeCode: string, agencyName: string) => {
    const url = `${window.location.origin}/broker/${storeCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast(`Storefront link for ${agencyName} copied to clipboard!`);
    } else {
      showToast(`Store URL: ${url}`);
    }
  };

  const handleEnquireBroker = (broker: BrokerStoreItem) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('blitzbot:enquire', {
          detail: {
            brokerStoreCode: broker.storeCode,
            brokerName: broker.fullName,
            brokerAgency: broker.agencyName,
            propertyCity: broker.operatingCity,
          },
        })
      );
    }
  };

  const handleResetFilters = () => {
    setSelectedCity('Pan India');
    setSearchQuery('');
    setSelectedSpecialization('all');
    setMinExperience(0);
    setSortBy('listings');
    router.replace('/brokers');
  };

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white flex flex-col font-sans transition-colors">
      <Navbar
        selectedCity={selectedCity}
        onSelectCity={handleCitySelect}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onOpenSearchModal={() => {}}
      />

      <main className="flex-1 pb-16">
        <section className="relative w-full bg-gradient-to-b from-white/90 via-[#F4F0EA] to-[#F4F0EA] dark:from-[#1E1B17] dark:via-[#141210] dark:to-[#141210] border-b border-[#1A1A1A]/10 dark:border-white/10 pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#DF6400]/15 to-[#DF6400]/5 border border-[#DF6400]/25 text-[#DF6400] text-xs font-black tracking-wider uppercase shadow-xs">
              <Store className="w-3.5 h-3.5" />
              <span>Pan India Broker Stores Network</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#1A1A1A] dark:text-white uppercase">
              Verified Broker Stores{' '}
              <span className="text-[#DF6400]">By Location</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-[#5C5852] dark:text-[#A8A29A] max-w-2xl mx-auto font-medium leading-relaxed">
              Connect directly with certified real estate brokerages across Indian metros. Review track records, operating cities, active listings, and RERA credentials.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 text-left">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#1E1B17]/80 border border-[#1A1A1A]/10 dark:border-white/10 backdrop-blur-sm shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">Verified Stores</div>
                <div className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white mt-0.5">{brokers.length}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#1E1B17]/80 border border-[#1A1A1A]/10 dark:border-white/10 backdrop-blur-sm shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">Metros Covered</div>
                <div className="text-xl sm:text-2xl font-black text-[#DF6400] mt-0.5">{cityTabs.length - 1}</div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#1E1B17]/80 border border-[#1A1A1A]/10 dark:border-white/10 backdrop-blur-sm shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">Avg Experience</div>
                <div className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white mt-0.5">14+ Yrs</div>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#1E1B17]/80 border border-[#1A1A1A]/10 dark:border-white/10 backdrop-blur-sm shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">RERA Registered</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">100%</div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {cityTabs.map((city) => {
              const count = cityCounts[city] || 0;
              const isActive = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 border ${
                    isActive
                      ? 'bg-[#DF6400] text-white border-[#DF6400] shadow-sm'
                      : 'bg-white dark:bg-[#1E1B17] text-[#5C5852] dark:text-[#A8A29A] border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{city}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#1A1A1A]/5 dark:bg-white/10 text-[#5C5852] dark:text-[#A8A29A]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-[#1E1B17] p-4 rounded-2xl sm:rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-[#5C5852] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by agency, broker name, locality, or RERA ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-medium text-[#1A1A1A] dark:text-white placeholder-[#5C5852]/70 outline-none focus:ring-1 focus:ring-[#DF6400]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-[#5C5852] absolute right-3 top-1/2 -translate-y-1/2 hover:text-[#1A1A1A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="md:col-span-3 relative">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-semibold text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400] appearance-none pr-8 cursor-pointer"
                >
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id} className="dark:bg-[#141210]">
                      {spec.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5C5852] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="md:col-span-3 relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-semibold text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400] appearance-none pr-8 cursor-pointer"
                >
                  <option value="listings">Sort: Most Active Listings</option>
                  <option value="rating">Sort: Highest Rating</option>
                  <option value="experience">Sort: Years of Experience</option>
                  <option value="name">Sort: Agency Name (A-Z)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#5C5852] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]/5 dark:border-white/5 text-xs text-[#5C5852] dark:text-[#A8A29A]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[11px] uppercase tracking-wider">Experience Filter:</span>
                {[
                  { label: 'All', val: 0 },
                  { label: '10+ Yrs', val: 10 },
                  { label: '15+ Yrs', val: 15 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMinExperience(item.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      minExperience === item.val
                        ? 'bg-[#DF6400] text-white shadow-xs'
                        : 'bg-[#F4F0EA] dark:bg-[#141210] text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {(selectedCity !== 'Pan India' ||
                searchQuery ||
                selectedSpecialization !== 'all' ||
                minExperience > 0) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-[#DF6400] hover:underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#5C5852] dark:text-[#A8A29A]">
            <span className="font-bold">
              Showing <span className="text-[#DF6400] font-black">{filteredBrokers.length}</span> Verified Broker Stores
              {selectedCity !== 'Pan India' && ` in ${selectedCity}`}
            </span>
            <span className="text-[11px]">RERA Compliance: Self-Reported Registration</span>
          </div>

          {filteredBrokers.length === 0 ? (
            <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-12 text-center border border-[#1A1A1A]/10 dark:border-white/10 space-y-4">
              <Store className="w-12 h-12 text-[#DF6400] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1A1A1A] dark:text-white">
                  No verified broker stores found
                </h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] max-w-sm mx-auto">
                  Try clearing your search query or selecting another operating city or specialization filter.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBrokers.map((broker) => (
                <div
                  key={broker.id}
                  className="bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-20 bg-gradient-to-r from-[#DF6400]/20 via-[#DF6400]/10 to-transparent p-4 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-[#141210]/90 backdrop-blur-xs text-[10px] font-bold text-[#DF6400] border border-[#DF6400]/20">
                        <MapPin className="w-3 h-3" />
                        <span>{broker.operatingCity}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareStore(broker.storeCode, broker.agencyName)}
                          className="p-1.5 rounded-full bg-white/90 dark:bg-[#141210]/90 text-[#5C5852] hover:text-[#DF6400] transition-colors shadow-xs"
                          title="Share Store Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="px-5 pt-0 pb-4 space-y-4 -mt-8">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-end gap-3">
                          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-white dark:border-[#1E1B17] shadow-md bg-black/10 flex-shrink-0">
                            <Image
                              src={broker.avatar}
                              alt={broker.fullName}
                              fill
                              className="object-cover"
                              sizes="72px"
                            />
                          </div>
                          <div className="min-w-0 pb-0.5">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] dark:text-white truncate">
                                {broker.agencyName}
                              </h3>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] font-medium">
                              Led by {broker.fullName}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/broker/${broker.storeCode}`}
                          className="text-[10px] font-mono font-bold text-[#DF6400] bg-[#DF6400]/10 px-2.5 py-1 rounded-lg hover:bg-[#DF6400]/20 transition-colors flex items-center gap-1 flex-shrink-0 mt-8"
                        >
                          <span>Storefront</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-[#F4F0EA]/70 dark:bg-[#141210]/70 text-center border border-[#1A1A1A]/5 dark:border-white/5">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Experience</div>
                          <div className="text-xs font-black text-[#1A1A1A] dark:text-white mt-0.5">{broker.experienceYears}+ Yrs</div>
                        </div>
                        <div className="border-x border-[#1A1A1A]/10 dark:border-white/10">
                          <div className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Active Listings</div>
                          <div className="text-xs font-black text-[#DF6400] mt-0.5">{broker.totalListings} Units</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Rating</div>
                          <div className="text-xs font-black text-amber-500 mt-0.5 flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{broker.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="font-mono font-bold text-[#1A1A1A] dark:text-white">
                            RERA: {broker.reraNumber}
                          </span>
                        </div>

                        {broker.localities.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Hubs:</span>
                            {broker.localities.map((loc) => (
                              <span
                                key={loc}
                                className="px-2 py-0.5 rounded-md bg-[#1A1A1A]/5 dark:bg-white/10 text-[10px] font-medium"
                              >
                                {loc}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] line-clamp-2 leading-relaxed pt-1">
                          {broker.bio}
                        </p>
                      </div>

                      {broker.recentListings.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#1A1A1A]/5 dark:border-white/5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] flex items-center justify-between">
                            <span>Direct Inventory Preview</span>
                            <Link
                              href={`/broker/${broker.storeCode}`}
                              className="text-[#DF6400] hover:underline"
                            >
                              View All ({broker.totalListings}) &rarr;
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {broker.recentListings.slice(0, 2).map((item) => (
                              <Link
                                key={item.id}
                                href={`/property/${item.slug}`}
                                className="group flex items-center gap-2 p-1.5 rounded-xl bg-[#F4F0EA]/50 dark:bg-[#141210]/50 hover:bg-[#DF6400]/10 border border-[#1A1A1A]/5 dark:border-white/5 transition-all"
                              >
                                <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-black/10 flex-shrink-0">
                                  <Image
                                    src={item.primaryImage}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] font-bold text-[#1A1A1A] dark:text-white truncate group-hover:text-[#DF6400]">
                                    {item.title}
                                  </div>
                                  <div className="text-[10px] font-mono font-bold text-[#DF6400]">
                                    {item.formattedPrice}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F4F0EA]/40 dark:bg-[#141210]/40 border-t border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleEnquireBroker(broker)}
                      className="flex-1 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/15 text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#DF6400]" />
                      <span>Chat / Enquire</span>
                    </button>

                    <a
                      href={`https://wa.me/917272357771?text=${encodeURIComponent(`Hi BrokersBlitz, I would like to connect with verified broker: ${broker.agencyName} (${broker.fullName}) in ${broker.operatingCity} [Store: ${broker.storeCode}].`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Direct WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <Link
                      href={`/broker/${broker.storeCode}`}
                      className="px-4 py-2 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>Visit Store</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      <BlitzChatbot
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      <Footer onSelectCity={handleCitySelect} />
    </div>
  );
}

