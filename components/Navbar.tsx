'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  Sparkles,
  Building2,
  Store,
  Trees,
  Warehouse,
  ArrowRight,
  X,
  Menu,
  Sun,
  Moon,
  MapPin,
  Plus,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '../data/types';
import { INDIAN_METROS } from '../data/cities';
import { useTheme } from './ThemeProvider';
import { searchIndianCities } from '../lib/geo/geo-service';
import BrandLogo from './BrandLogo';

interface NavbarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenSearchModal: () => void;
  currentUser: {
    name: string;
    role: UserRole;
    agency?: string;
    reraNumber?: string;
  } | null;
  onLogout: () => void;
  onOpenListProperty?: () => void;
}

export default function Navbar({
  selectedCity,
  onSelectCity,
  currentUser,
  onLogout,
}: NavbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handlePostPropertyClick = () => {
    setIsMobileMenuOpen(false);
    if (!currentUser) {
      router.push('/login?redirect=/dashboard');
    } else if (currentUser.role === 'broker') {
      router.push('/dashboard');
    }
  };

  const shouldShowPostProperty = !currentUser || currentUser.role === 'broker';

  const handleLogoutAction = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    onLogout();
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#1A1A1A]/10 dark:border-white/10 bg-[#F4F0EA]/95 dark:bg-[#141210]/95 backdrop-blur-md transition-colors duration-200">
        <div className="w-full px-3 sm:px-6 md:px-8 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
            <Link href="/" className="flex-shrink-0 flex items-center transition-transform hover:scale-[1.02]">
              <BrandLogo className="h-7 sm:h-8 w-auto" priority />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-[11px] sm:text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors shadow-sm"
                aria-label="Select City"
              >
                <MapPin className="w-3.5 h-3.5 text-[#DF6400]" />
                <span className="truncate max-w-[85px] sm:max-w-[130px]">{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-[#5C5852] dark:text-[#A8A29A]" />
              </button>

              {isCityDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setIsCityDropdownOpen(false);
                      setCityQuery('');
                    }}
                  />
                  <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/15 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
                    <div className="mb-1.5">
                      <input
                        type="text"
                        placeholder="Search Indian City..."
                        value={cityQuery}
                        onChange={(e) => setCityQuery(e.target.value)}
                        className="w-full bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
                        autoFocus
                      />
                    </div>

                    <div className="overflow-y-auto no-scrollbar flex-1 space-y-0.5">
                      {!cityQuery.trim() ? (
                        <>
                          <div className="px-2 py-1 text-[9px] font-bold text-[#5C5852] dark:text-[#A8A29A] uppercase font-mono">
                            National & Top Metros
                          </div>
                          {INDIAN_METROS.map((city) => (
                            <button
                              key={city.slug}
                              onClick={() => {
                                onSelectCity(city.name);
                                setIsCityDropdownOpen(false);
                                setCityQuery('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-[#DF6400]/10 hover:text-[#DF6400] transition-colors ${
                                selectedCity === city.name ? 'text-[#DF6400] font-bold bg-[#DF6400]/5' : 'text-[#1A1A1A] dark:text-white'
                              }`}
                            >
                              <span>{city.name}</span>
                              {selectedCity === city.name && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#DF6400]" />
                              )}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          <div className="px-2 py-1 text-[9px] font-bold text-[#5C5852] dark:text-[#A8A29A] uppercase font-mono">
                            Search Results (Pan India)
                          </div>
                          {searchIndianCities(cityQuery, 15).map((c) => (
                            <button
                              key={`${c.name}-${c.stateCode}`}
                              onClick={() => {
                                onSelectCity(c.name);
                                setIsCityDropdownOpen(false);
                                setCityQuery('');
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-[#DF6400]/10 hover:text-[#DF6400] text-[#1A1A1A] dark:text-white transition-colors"
                            >
                              <span>{c.name}</span>
                              <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-mono">{c.stateCode}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              href="/search"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-[#DF6400]" />
              <span>Search Catalog</span>
            </Link>

            <Link
              href="/brokers"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors shadow-sm"
            >
              <Store className="w-3.5 h-3.5 text-[#DF6400]" />
              <span>Broker Stores</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white hover:border-[#DF6400] transition-colors shadow-sm"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              ) : (
                <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {shouldShowPostProperty && (
                <button
                  onClick={handlePostPropertyClick}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold shadow-sm hover:bg-[#C75700] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Property</span>
                </button>
              )}

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/15 hover:border-[#DF6400] shadow-sm transition-all text-xs font-bold text-[#1A1A1A] dark:text-white"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center font-bold text-[10px]">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="block truncate max-w-[100px]">{currentUser.name}</span>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#DF6400]/10 text-[#DF6400]">
                      {currentUser.role}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogoutAction}
                    className="p-2 text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-white dark:hover:bg-[#24201C] rounded-xl transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-xs font-bold text-[#1A1A1A] dark:text-white hover:text-[#DF6400] transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] text-xs font-bold hover:bg-black dark:hover:bg-slate-100 transition-all shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors shadow-sm"
              aria-label="Toggle Navigation Drawer"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 z-[95]"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-[300px] sm:w-[340px] bg-white dark:bg-[#1A1815] h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-[100] animate-in slide-in-from-right duration-200 text-[#1A1A1A] dark:text-white">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-block"
                >
                  <BrandLogo className="h-7 w-auto" priority />
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl bg-[#F4F0EA] dark:bg-[#24201C] text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentUser ? (
                <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#DF6400] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black truncate">{currentUser.name}</div>
                      <div className="text-[10px] font-mono uppercase text-[#DF6400] font-bold">
                        {currentUser.role} Account
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full text-center py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors shadow-sm"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl bg-[#F4F0EA] dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {shouldShowPostProperty && (
                <button
                  onClick={handlePostPropertyClick}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] text-xs font-black hover:bg-black dark:hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Free Property</span>
                </button>
              )}

              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] block mb-2 px-1">
                  Browse Properties
                </span>
                <Link
                  href="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-[#DF6400]" />
                    <span>Search With Filters</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#DF6400]" />
                </Link>

                <Link
                  href="/brokers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-[#DF6400]" />
                    <span>Verified Broker Stores</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#DF6400]" />
                </Link>

                <Link
                  href="/search?category=apartment"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A]" />
                    <span>Residential Flats</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A]" />
                </Link>

                <Link
                  href="/search?category=villa"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A]" />
                    <span>Villas & Penthouses</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A]" />
                </Link>

                <Link
                  href="/search?category=commercial_office"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A]" />
                    <span>Commercial Offices</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A]" />
                </Link>

                <Link
                  href="/search?category=retail_shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A]" />
                    <span>Shops & Retail</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A]" />
                </Link>

                <Link
                  href="/search?category=residential_plot"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Trees className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A]" />
                    <span>Plots & Land</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A]" />
                </Link>

                <Link
                  href="/search?category=industrial_warehouse"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Warehouse className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A]" />
                    <span>Warehouses</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A]" />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#5C5852] dark:text-[#A8A29A]">
                <Link
                  href="/terms"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:underline"
                >
                  Terms of Service
                </Link>
                <span>•</span>
                <Link
                  href="/privacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:underline"
                >
                  Privacy Policy
                </Link>
              </div>

              {currentUser && (
                <button
                  onClick={handleLogoutAction}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
