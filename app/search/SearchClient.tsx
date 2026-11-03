'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  Maximize2,
  Bed,
  Sofa,
  KeyRound,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import initialPropertiesData from '../../data/properties.json';
import { PropertyListing, UserRole } from '../../data/types';
import { INDIAN_METROS, PROPERTY_TYPES, BUDGET_RANGES, BHK_OPTIONS } from '../../data/cities';
import Navbar from '../../components/Navbar';
import PropertyCard from '../../components/PropertyCard';
import ShareModal from '../../components/ShareModal';
import BlitzChatbot from '../../components/BlitzChatbot';
import Footer from '../../components/Footer';
import SearchAutocompleteDropdown from '../../components/SearchAutocompleteDropdown';

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<PropertyListing[]>(initialPropertiesData as PropertyListing[]);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: UserRole;
    agency?: string;
    reraNumber?: string;
  } | null>(null);

  const initialCity = searchParams.get('city') || 'Pan India';
  const initialPurpose = searchParams.get('purpose') || 'all';
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';
  const initialBudget = searchParams.get('budget') || 'all';
  const initialBhk = searchParams.get('bhk') || 'all';

  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedPurpose, setSelectedPurpose] = useState<string>(initialPurpose);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [budgetFilter, setBudgetFilter] = useState<string>(initialBudget);
  const [bhkFilter, setBhkFilter] = useState<string>(initialBhk);
  const [possessionFilter, setPossessionFilter] = useState<string>('all');
  const [furnishingFilter, setFurnishingFilter] = useState<string>('all');
  const [reraOnlyFilter, setReraOnlyFilter] = useState<boolean>(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minCustomPrice, setMinCustomPrice] = useState<string>('');
  const [maxCustomPrice, setMaxCustomPrice] = useState<string>('');

  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'price_sqft_low' | 'area_high' | 'newest'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [sharingProperty, setSharingProperty] = useState<PropertyListing | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    try {
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
            agency: data.user.agencyName,
            reraNumber: data.user.reraNumber,
          });
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setSelectedCity(searchParams.get('city') || 'Pan India');
    setSelectedPurpose(searchParams.get('purpose') || 'all');
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('q') || searchParams.get('query') || '');
    setBudgetFilter(searchParams.get('budget') || 'all');
    setBhkFilter(searchParams.get('bhk') || 'all');
    setPossessionFilter(searchParams.get('possession') || 'all');
    setFurnishingFilter(searchParams.get('furnishing') || 'all');
    setReraOnlyFilter(searchParams.get('rera') === 'true');
    setMinCustomPrice(searchParams.get('minPrice') || '');
    setMaxCustomPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    window.location.href = '/login';
  };

  const handleAmenityToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const resetAllFilters = () => {
    setSelectedCity('Pan India');
    setSelectedPurpose('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setBudgetFilter('all');
    setBhkFilter('all');
    setPossessionFilter('all');
    setFurnishingFilter('all');
    setReraOnlyFilter(false);
    setSelectedAmenities([]);
    setMinCustomPrice('');
    setMaxCustomPrice('');
    setSortBy('featured');
    router.replace('/search');
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: properties.length };
    properties.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [properties]);

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Pan India': properties.length };
    properties.forEach((p) => {
      counts[p.city] = (counts[p.city] || 0) + 1;
    });
    return counts;
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        if (selectedCity !== 'Pan India' && selectedCity !== 'All India' && p.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }

        if (selectedPurpose !== 'all' && p.purpose !== selectedPurpose) {
          return false;
        }

        if (selectedCategory !== 'all') {
          if (selectedCategory === 'commercial') {
            if (p.category !== 'commercial_office' && p.category !== 'retail_shop' && p.category !== 'industrial_warehouse') {
              return false;
            }
          } else if (p.category !== selectedCategory) {
            return false;
          }
        }

        if (bhkFilter !== 'all') {
          if (bhkFilter === '4+' && p.bedrooms < 4) return false;
          if (bhkFilter !== '4+' && p.bedrooms !== parseInt(bhkFilter, 10)) return false;
        }

        if (possessionFilter !== 'all' && p.possession !== possessionFilter) {
          return false;
        }

        if (furnishingFilter !== 'all' && p.furnishing !== furnishingFilter) {
          return false;
        }

        if (reraOnlyFilter && !p.isReraApproved) {
          return false;
        }

        if (selectedAmenities.length > 0) {
          const hasAllSelected = selectedAmenities.every((amenity) =>
            p.amenities.some((a) => a.toLowerCase().includes(amenity.toLowerCase()))
          );
          if (!hasAllSelected) return false;
        }

        if (minCustomPrice || maxCustomPrice) {
          const min = minCustomPrice ? parseFloat(minCustomPrice) : 0;
          const max = maxCustomPrice ? parseFloat(maxCustomPrice) : Infinity;
          if (p.price < min || p.price > max) return false;
        } else if (budgetFilter !== 'all') {
          if (budgetFilter === '0-5000000' && p.price > 5000000) return false;
          if (budgetFilter === '5000000-10000000' && (p.price < 5000000 || p.price > 10000000)) return false;
          if (budgetFilter === '10000000-30000000' && (p.price < 10000000 || p.price > 30000000)) return false;
          if (budgetFilter === '30000000-100000000' && (p.price < 30000000 || p.price > 100000000)) return false;
          if (budgetFilter === '100000000+' && p.price < 100000000) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesLocality = p.locality.toLowerCase().includes(q);
          const matchesCity = p.city.toLowerCase().includes(q);
          const matchesAddress = p.address.toLowerCase().includes(q);
          const matchesBroker = p.broker.name.toLowerCase().includes(q) || p.broker.agency.toLowerCase().includes(q);
          const matchesCategory = p.categoryLabel.toLowerCase().includes(q);
          if (!matchesTitle && !matchesLocality && !matchesCity && !matchesAddress && !matchesBroker && !matchesCategory) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'price_sqft_low') return a.pricePerSqft - b.pricePerSqft;
        if (sortBy === 'area_high') return b.carpetAreaSqft - a.carpetAreaSqft;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [
    properties,
    selectedCity,
    selectedPurpose,
    selectedCategory,
    bhkFilter,
    possessionFilter,
    furnishingFilter,
    reraOnlyFilter,
    selectedAmenities,
    minCustomPrice,
    maxCustomPrice,
    budgetFilter,
    searchQuery,
    sortBy,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== 'Pan India' && selectedCity !== 'All India') count++;
    if (selectedPurpose !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (bhkFilter !== 'all') count++;
    if (budgetFilter !== 'all' || minCustomPrice || maxCustomPrice) count++;
    if (possessionFilter !== 'all') count++;
    if (furnishingFilter !== 'all') count++;
    if (reraOnlyFilter) count++;
    if (selectedAmenities.length > 0) count += selectedAmenities.length;
    if (searchQuery.trim()) count++;
    return count;
  }, [
    selectedCity,
    selectedPurpose,
    selectedCategory,
    bhkFilter,
    budgetFilter,
    minCustomPrice,
    maxCustomPrice,
    possessionFilter,
    furnishingFilter,
    reraOnlyFilter,
    selectedAmenities,
    searchQuery,
  ]);

  const handleEnquireDispatch = (property: PropertyListing) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('blitzbot:enquire', {
          detail: {
            propertyId: property.id,
            propertyTitle: property.title,
            propertyPrice: property.formattedPrice,
            propertyLocality: property.locality,
            propertyCity: property.city,
            brokerStoreCode: property.broker.storeCode || property.broker.id,
            brokerName: property.broker.name,
            brokerAgency: property.broker.agency,
          },
        })
      );
    }
  };

  const handleAIPoweredSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    try {
      const res = await fetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (data.success && data.filters) {
        const f = data.filters;
        if (f.city && f.city !== 'All India' && f.city !== 'Pan India') {
          setSelectedCity(f.city);
        }
        if (f.category) {
          setSelectedCategory(f.category);
        }
        if (f.purpose) {
          setSelectedPurpose(f.purpose);
        }
        if (f.bhk && f.bhk !== 'all') {
          setBhkFilter(String(f.bhk));
        }
        if (f.locality) {
          setSearchQuery(f.locality);
        }
      }
    } catch { }
  };

  const renderFilterSidebar = () => (
    <div className="space-y-6 text-xs text-[#1A1A1A] dark:text-white">
      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#DF6400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-black text-sm tracking-tight uppercase">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#DF6400] text-white text-[10px] font-bold">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-[11px] font-bold text-[#DF6400] hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          Domain & Property Category
        </h4>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {PROPERTY_TYPES.map((pt) => {
            const count = categoryCounts[pt.value] || 0;
            return (
              <label
                key={pt.value}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name="categoryFilter"
                    checked={selectedCategory === pt.value}
                    onChange={() => setSelectedCategory(pt.value)}
                    className="accent-[#DF6400] w-3.5 h-3.5"
                  />
                  <span className="truncate text-xs">{pt.label}</span>
                </div>
                <span className="text-[10px] font-mono text-[#5C5852] dark:text-[#A8A29A]">
                  ({count})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          Transaction Purpose
        </h4>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'sale', label: 'Buy' },
            { id: 'rent', label: 'Rent / Lease' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPurpose(item.id)}
              className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold transition-all ${selectedPurpose === item.id
                  ? 'bg-[#DF6400] text-white shadow-sm'
                  : 'bg-[#F4F0EA] dark:bg-[#1E1B17] text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          City & Location
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {INDIAN_METROS.map((metro) => {
            const count = cityCounts[metro.name] || 0;
            return (
              <label
                key={metro.slug}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="radio"
                    name="cityFilter"
                    checked={selectedCity.toLowerCase() === metro.name.toLowerCase()}
                    onChange={() => setSelectedCity(metro.name)}
                    className="accent-[#DF6400] w-3.5 h-3.5"
                  />
                  <span className="truncate text-xs">{metro.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#5C5852] dark:text-[#A8A29A]">
                  ({count})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          Budget Range
        </h4>
        <div className="space-y-1.5">
          {BUDGET_RANGES.map((b) => (
            <label
              key={b.value}
              className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] cursor-pointer transition-colors text-xs"
            >
              <input
                type="radio"
                name="budgetFilter"
                checked={budgetFilter === b.value && !minCustomPrice && !maxCustomPrice}
                onChange={() => {
                  setBudgetFilter(b.value);
                  setMinCustomPrice('');
                  setMaxCustomPrice('');
                }}
                className="accent-[#DF6400] w-3.5 h-3.5"
              />
              <span>{b.label}</span>
            </label>
          ))}
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-[#5C5852] dark:text-[#A8A29A] mb-1">Min (₹)</label>
            <input
              type="number"
              placeholder="e.g. 5000000"
              value={minCustomPrice}
              onChange={(e) => {
                setMinCustomPrice(e.target.value);
                setBudgetFilter('all');
              }}
              className="w-full bg-[#F4F0EA] dark:bg-[#1E1B17] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:border-[#DF6400]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5C5852] dark:text-[#A8A29A] mb-1">Max (₹)</label>
            <input
              type="number"
              placeholder="e.g. 20000000"
              value={maxCustomPrice}
              onChange={(e) => {
                setMaxCustomPrice(e.target.value);
                setBudgetFilter('all');
              }}
              className="w-full bg-[#F4F0EA] dark:bg-[#1E1B17] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:border-[#DF6400]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          Configuration (BHK)
        </h4>
        <div className="grid grid-cols-5 gap-1">
          {BHK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBhkFilter(opt.value)}
              className={`py-1.5 rounded-lg text-center text-xs font-bold transition-all ${bhkFilter === opt.value
                  ? 'bg-[#DF6400] text-white'
                  : 'bg-[#F4F0EA] dark:bg-[#1E1B17] text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
            >
              {opt.label.replace(' BHK', '').replace('All BHKs', 'All')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          Possession Status
        </h4>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'ready_to_move', label: 'Ready to Move' },
            { id: 'under_construction', label: 'Under Const.' },
            { id: 'new_launch', label: 'New Launch' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPossessionFilter(item.id)}
              className={`py-1.5 px-2 rounded-xl text-center font-bold transition-all ${possessionFilter === item.id
                  ? 'bg-[#DF6400] text-white'
                  : 'bg-[#F4F0EA] dark:bg-[#1E1B17] text-[#5C5852] dark:text-[#A8A29A]'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          Furnishing Type
        </h4>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          {[
            { id: 'all', label: 'All Furnishing' },
            { id: 'fully_furnished', label: 'Fully Furnished' },
            { id: 'semi_furnished', label: 'Semi Furnished' },
            { id: 'unfurnished', label: 'Unfurnished' },
            { id: 'bare_shell', label: 'Bare Shell' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFurnishingFilter(item.id)}
              className={`py-1.5 px-2 rounded-xl text-center font-bold transition-all ${furnishingFilter === item.id
                  ? 'bg-[#DF6400] text-white'
                  : 'bg-[#F4F0EA] dark:bg-[#1E1B17] text-[#5C5852] dark:text-[#A8A29A]'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A]">
          Popular Amenities
        </h4>
        <div className="space-y-1.5">
          {[
            'Security',
            'Parking',
            'Pool',
            'Gym',
            'Elevator',
            'Power',
            'Clubhouse',
          ].map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] cursor-pointer transition-colors text-xs"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="accent-[#DF6400] w-3.5 h-3.5 rounded"
                />
                <span>{amenity === 'Power' ? '100% Power Backup' : amenity === 'Elevator' ? 'High-Speed Elevators' : amenity === 'Security' ? '24/7 Security & CCTV' : amenity === 'Parking' ? 'Covered Car Parking' : amenity === 'Pool' ? 'Swimming Pool' : amenity === 'Gym' ? 'Gymnasium & Fitness' : 'Clubhouse'}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
        <label className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] cursor-pointer transition-colors text-xs font-bold text-amber-700 dark:text-amber-400">
          <input
            type="checkbox"
            checked={reraOnlyFilter}
            onChange={(e) => setReraOnlyFilter(e.target.checked)}
            className="accent-[#DF6400] w-3.5 h-3.5 rounded"
          />
          <span>RERA Declared Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white font-sans flex flex-col justify-between transition-colors">
      <Navbar
        selectedCity={selectedCity}
        onSelectCity={(c) => setSelectedCity(c)}
        onOpenSearchModal={() => setIsMobileFilterOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 text-[#1A1A1A] dark:text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in duration-150">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DF6400] animate-pulse" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-[#1E1B17] h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 dark:border-white/10 mb-4">
                <span className="font-black text-base">Filter Properties</span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-xl text-[#5C5852] dark:text-[#A8A29A]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFilterSidebar()}
            </div>
            <div className="pt-6 border-t border-[#1A1A1A]/10 dark:border-white/10 mt-6 sticky bottom-0 bg-white dark:bg-[#1E1B17]">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors"
              >
                Apply Filters ({filteredProperties.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 max-w-[1700px] mx-auto flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C5852] dark:text-[#A8A29A]">
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#DF6400]">Home</Link>
            <span>/</span>
            <span className="text-[#1A1A1A] dark:text-white font-bold">
              {selectedCity === 'Pan India' || selectedCity === 'All India' ? 'All Properties' : `Properties in ${selectedCity}`}
            </span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
            Notice: Broker RERA IDs are self-reported. Verify on official state portals.
          </div>
        </div>

        <div className="relative z-30 bg-[#EAE4DC]/80 dark:bg-[#1E1B17]/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#DF6400] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by locality, area, project, or broker agency (e.g. 2 BHK in Vijay Nagar, Bandra, Cyber City)..."
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setIsDropdownOpen(true);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(e.target.value.trim().length >= 2);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsDropdownOpen(false);
                    handleAIPoweredSearch(searchQuery);
                  }
                }}
                className="w-full bg-white/90 dark:bg-[#141210]/90 border border-[#1A1A1A]/10 dark:border-white/15 rounded-2xl pl-11 pr-10 py-3 text-xs text-[#1A1A1A] dark:text-white placeholder-[#5C5852] dark:placeholder-[#A8A29A] outline-none focus:ring-2 focus:ring-[#DF6400]/40 focus:border-[#DF6400] transition-all duration-200 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <SearchAutocompleteDropdown
                query={searchQuery}
                selectedCity={selectedCity}
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
              </button>

              <div className="flex items-center gap-1 bg-white/80 dark:bg-[#141210]/80 p-1 rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-inner">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#DF6400] text-white shadow-sm' : 'text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white'
                    }`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#DF6400] text-white shadow-sm' : 'text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white'
                    }`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 bg-white/80 dark:bg-[#141210]/80 rounded-2xl px-3 py-1 border border-[#1A1A1A]/10 dark:border-white/10 shadow-inner">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#DF6400] hidden sm:inline" />
                <span className="text-[11px] font-bold text-[#5C5852] dark:text-[#A8A29A] hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent py-1.5 text-xs font-bold text-[#1A1A1A] dark:text-white outline-none cursor-pointer"
                >
                  <option value="featured">Featured / Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="price_sqft_low">Price / Sq.ft: Low to High</option>
                  <option value="area_high">Carpet Area: Largest</option>
                  <option value="newest">Newest Listed</option>
                </select>
              </div>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 dark:border-white/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-[#5C5852] dark:text-[#A8A29A] tracking-wider">Active Filters:</span>
              {selectedCity !== 'Pan India' && selectedCity !== 'All India' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>City: {selectedCity}</span>
                  <button onClick={() => setSelectedCity('Pan India')} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>{PROPERTY_TYPES.find((pt) => pt.value === selectedCategory)?.label || selectedCategory}</span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedPurpose !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>Purpose: {selectedPurpose === 'sale' ? 'Buy' : selectedPurpose === 'rent' ? 'Rent' : selectedPurpose}</span>
                  <button onClick={() => setSelectedPurpose('all')} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {bhkFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>{bhkFilter} BHK</span>
                  <button onClick={() => setBhkFilter('all')} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {(budgetFilter !== 'all' || minCustomPrice || maxCustomPrice) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>Budget Filtered</span>
                  <button
                    onClick={() => {
                      setBudgetFilter('all');
                      setMinCustomPrice('');
                      setMaxCustomPrice('');
                    }}
                    className="hover:text-black dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {possessionFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>{possessionFilter.replace(/_/g, ' ')}</span>
                  <button onClick={() => setPossessionFilter('all')} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {furnishingFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>{furnishingFilter.replace(/_/g, ' ')}</span>
                  <button onClick={() => setFurnishingFilter('all')} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {reraOnlyFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                  <span>RERA Declared Only</span>
                  <button onClick={() => setReraOnlyFilter(false)} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedAmenities.map((amenity) => (
                <span key={amenity} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>{amenity}</span>
                  <button onClick={() => handleAmenityToggle(amenity)} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DF6400]/10 text-[#DF6400] font-semibold text-[11px]">
                  <span>&quot;{searchQuery}&quot;</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-black dark:hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:underline ml-1"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
          <aside className="hidden lg:block lg:col-span-1 bg-white dark:bg-[#1E1B17] rounded-3xl p-5 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm sticky top-20 max-h-[85vh] overflow-y-auto">
            {renderFilterSidebar()}
          </aside>

          <section className="lg:col-span-3 xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#5C5852] dark:text-[#A8A29A]">
              <div>
                Showing <strong className="text-[#1A1A1A] dark:text-white font-black">{filteredProperties.length}</strong> {filteredProperties.length === 1 ? 'property' : 'properties'}
                {selectedCity !== 'Pan India' && selectedCity !== 'All India' ? ` in ${selectedCity}` : ' across Pan India'}
              </div>
              <div className="text-[11px]">
                Page 1 of 1
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <div className="bg-white dark:bg-[#24201C] rounded-3xl p-10 sm:p-14 border border-[#1A1A1A]/10 dark:border-white/10 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center mx-auto text-xl">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white">
                  No properties match your exact filters
                </h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] max-w-md mx-auto">
                  Try widening your price range, choosing another city, or resetting some of your filter criteria.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isSaved={savedPropertyIds.includes(property.id)}
                    onShare={(p) => setSharingProperty(p)}
                    onToggleSave={handleToggleSave}
                    onEnquire={handleEnquireDispatch}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property) => {
                  const isSaved = savedPropertyIds.includes(property.id);
                  return (
                    <div
                      key={property.id}
                      className="group bg-white dark:bg-[#24201C] rounded-2xl p-4 sm:p-5 border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400]/50 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 sm:gap-6 items-start"
                    >
                      <div className="relative w-full sm:w-60 h-48 sm:h-44 rounded-xl overflow-hidden bg-black/5 flex-shrink-0">
                        <Link href={`/property/${property.slug}`}>
                          <Image
                            src={property.primaryImage}
                            alt={property.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold uppercase backdrop-blur-sm">
                            {property.purpose === 'sale' ? 'For Sale' : property.purpose === 'lease' ? 'For Lease' : 'For Rent'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-700/90 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm">
                            RERA Declared
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#DF6400]">
                              {property.categoryLabel}
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] dark:text-white line-clamp-1 hover:text-[#DF6400] transition-colors">
                              <Link href={`/property/${property.slug}`}>{property.title}</Link>
                            </h3>
                            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                              {property.locality}, {property.city} • <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">RERA: {property.reraId}</span>
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white">
                              {property.formattedPrice}
                            </div>
                            <div className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                              {property.formattedPricePerSqft}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                          <span className="bg-[#F4F0EA] dark:bg-[#181614] px-2 py-1 rounded-md font-semibold inline-flex items-center gap-1">
                            <Maximize2 className="w-3 h-3 text-[#DF6400]" />
                            <span>{property.carpetAreaSqft.toLocaleString('en-IN')} sq.ft</span>
                          </span>
                          {property.bedrooms > 0 && (
                            <span className="bg-[#F4F0EA] dark:bg-[#181614] px-2 py-1 rounded-md font-semibold inline-flex items-center gap-1">
                              <Bed className="w-3 h-3 text-[#DF6400]" />
                              <span>{property.bedrooms} BHK</span>
                            </span>
                          )}
                          <span className="bg-[#F4F0EA] dark:bg-[#181614] px-2 py-1 rounded-md font-semibold capitalize inline-flex items-center gap-1">
                            <Sofa className="w-3 h-3 text-[#DF6400]" />
                            <span>{property.furnishing.replace(/_/g, ' ')}</span>
                          </span>
                          <span className="bg-[#F4F0EA] dark:bg-[#181614] px-2 py-1 rounded-md font-semibold capitalize inline-flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-[#DF6400]" />
                            <span>{property.possession.replace(/_/g, ' ')}</span>
                          </span>
                        </div>

                        <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] line-clamp-2 pt-1">
                          {property.description}
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A]/5 dark:border-white/10">
                          <Link
                            href={`/broker/${property.broker.storeCode || property.broker.id}`}
                            className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white hover:text-[#DF6400]"
                          >
                            <span className="w-6 h-6 rounded-full bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center text-[10px]">
                              {property.broker.name.charAt(0)}
                            </span>
                            <span className="truncate">{property.broker.name} ({property.broker.agency})</span>
                          </Link>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSharingProperty(property)}
                              className="p-2 rounded-xl bg-[#F4F0EA] dark:bg-[#181614] text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
                              title="Share"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleSave(property.id)}
                              className="p-2 rounded-xl bg-[#F4F0EA] dark:bg-[#181614] text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
                              title={isSaved ? 'Remove from shortlist' : 'Save'}
                            >
                              <svg className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-rose-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEnquireDispatch(property)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#F4F0EA] dark:bg-[#181614] text-xs font-bold text-[#1A1A1A] dark:text-white hover:bg-[#DF6400] hover:text-white transition-colors"
                            >
                              Enquire
                            </button>

                            <Link
                              href={`/property/${property.slug}`}
                              className="px-3.5 py-1.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {sharingProperty && (
        <ShareModal property={sharingProperty} onClose={() => setSharingProperty(null)} />
      )}

      <BlitzChatbot />
      <Footer onSelectCity={(c) => setSelectedCity(c)} />
    </div>
  );
}