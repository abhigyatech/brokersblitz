'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Globe,
  Wallet,
  CreditCard,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../data/types';
import { INDIAN_METROS } from '../data/cities';
import { useTheme } from './ThemeProvider';
import { searchIndianCities } from '../lib/geo/geo-service';
import BrandLogo from './BrandLogo';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from './LanguageProvider';

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
  const { language, setLanguage, languages, t } = useLanguage();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletDetails, setWalletDetails] = useState<{
    total: number;
    paid: number;
    free: number;
    nearestExpiryDays?: number;
    nearestExpiryAmount?: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNavbarWallet = () => {
    if (currentUser?.role === 'broker') {
      fetch('/api/wallet/statement')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && (data.wallet || data.statement)) {
            const tot = data.statement?.totalCredits ?? data.wallet?.totalBalance ?? 0;
            const pd = data.statement?.paidBalance ?? data.wallet?.paidBalance ?? 0;
            const fr = data.statement?.freeBalance ?? data.wallet?.freeBalance ?? 0;
            setWalletBalance(tot);
            setWalletDetails({
              total: tot,
              paid: pd,
              free: fr,
              nearestExpiryDays: data.nearestExpiry?.daysLeft,
              nearestExpiryAmount: data.nearestExpiry?.amount,
            });
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchNavbarWallet();
  }, [currentUser]);

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
                            {t('nav.topMetros', 'National & Top Metros')}
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
                            {t('nav.searchResults', 'Search Results (Pan India)')}
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
              <span>{t('nav.searchCatalog', 'Search Catalog')}</span>
            </Link>

            <Link
              href="/brokers"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors shadow-sm"
            >
              <Store className="w-3.5 h-3.5 text-[#DF6400]" />
              <span>{t('nav.brokerStores', 'Broker Stores')}</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <LanguageSelector />

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
                  <span>{t('nav.postProperty', 'Post Property')}</span>
                </button>
              )}

              {currentUser ? (
                <div className="flex items-center gap-2">
                  {currentUser.role === 'broker' && (
                    <div className="relative group">
                      <Link
                        href="/dashboard?tab=wallet"
                        onMouseEnter={fetchNavbarWallet}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all shadow-xs"
                      >
                        <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{walletBalance !== null ? `${walletBalance} Credits` : 'Credits'}</span>
                        <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
                      </Link>

                      <div className="absolute right-0 top-full pt-2 z-50 pointer-events-none group-hover:pointer-events-auto opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-1 transition-all duration-200 ease-out origin-top-right">
                        <div className="w-72 sm:w-80 p-4 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-2xl space-y-3 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C5852] dark:text-[#A8A29A]">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Wallet Balance</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              Active
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between border-b border-[#1A1A1A]/5 dark:border-white/5 pb-2">
                            <span className="text-2xl font-black text-[#1A1A1A] dark:text-white font-mono">
                              {walletDetails ? walletDetails.total : (walletBalance ?? 0)}
                            </span>
                            <span className="text-xs text-[#5C5852] dark:text-[#A8A29A] font-semibold">Total Credits Available</span>
                          </div>

                          <div className="space-y-2 pt-1 text-xs">
                            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F4F0EA]/60 dark:bg-[#141210]/60">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                  <CreditCard className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="font-bold text-[#1A1A1A] dark:text-white text-[11px]">Paid Credits</div>
                                  <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">Non-expiring • Recharged</div>
                                </div>
                              </div>
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                                {walletDetails ? walletDetails.paid : 0}
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F4F0EA]/60 dark:bg-[#141210]/60">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                  <Sparkles className="w-3.5 h-3.5 text-[#DF6400]" />
                                </div>
                                <div>
                                  <div className="font-bold text-[#1A1A1A] dark:text-white text-[11px]">Bonus Credits</div>
                                  <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">Platform Grants & Welcome</div>
                                </div>
                              </div>
                              <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                                {walletDetails ? walletDetails.free : 0}
                              </span>
                            </div>
                          </div>

                          {walletDetails?.nearestExpiryAmount && walletDetails.nearestExpiryAmount > 0 ? (
                            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-900 dark:text-amber-200 font-semibold">
                              <Clock className="w-3 h-3 text-[#DF6400] flex-shrink-0" />
                              <span>
                                {walletDetails.nearestExpiryAmount} bonus credits expire in {walletDetails.nearestExpiryDays} days
                              </span>
                            </div>
                          ) : null}

                          <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
                            Rate: 2 credits/day per active property listing beyond first 5 free listings.
                          </div>

                          <Link
                            href="/dashboard?tab=wallet"
                            className="w-full py-1.5 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                          >
                            <span>Open Passbook & Recharge</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

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
                    {t('nav.logIn', 'Log In')}
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3.5 py-1.5 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] text-xs font-bold hover:bg-black dark:hover:bg-slate-100 transition-all shadow-sm"
                  >
                    {t('nav.signUp', 'Sign Up')}
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

      {mounted && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 z-[9998]"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-[300px] sm:w-[340px] bg-white dark:bg-[#1A1815] h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-[9999] animate-in slide-in-from-right duration-200 text-[#1A1A1A] dark:text-white">
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
                        {currentUser.role} {t('nav.account', 'Account')}
                      </div>
                    </div>
                  </div>
                  {currentUser.role === 'broker' && (
                    <div className="space-y-1.5">
                      <Link
                        href="/dashboard?tab=wallet"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold"
                      >
                        <span className="flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Wallet Credits</span>
                        </span>
                        <span>{walletBalance !== null ? `${walletBalance} Credits` : 'Passbook'}</span>
                      </Link>
                      {walletDetails && (
                        <div className="flex items-center justify-between px-2 text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-semibold">
                          <span>Paid: {walletDetails.paid}</span>
                          <span>•</span>
                          <span>Bonus: {walletDetails.free}</span>
                          {walletDetails.nearestExpiryAmount && walletDetails.nearestExpiryAmount > 0 ? (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400">
                                {walletDetails.nearestExpiryAmount} exp in {walletDetails.nearestExpiryDays}d
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full text-center py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors shadow-sm"
                  >
                    <span>{t('nav.dashboard', 'Dashboard')}</span>
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
                    {t('nav.logIn', 'Log In')}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors shadow-sm"
                  >
                    {t('nav.signUp', 'Sign Up')}
                  </Link>
                </div>
              )}

              {shouldShowPostProperty && (
                <button
                  onClick={handlePostPropertyClick}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] text-xs font-black hover:bg-black dark:hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('nav.postProperty', 'Post Free Property')}</span>
                </button>
              )}

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] block px-1">
                  Language / भाषा
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4F0EA] dark:bg-[#24201C] rounded-xl border border-[#1A1A1A]/10 dark:border-white/10">
                  {languages.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center truncate ${
                        language === l.id
                          ? 'bg-[#DF6400] text-white shadow-xs'
                          : 'text-[#1A1A1A] dark:text-white hover:bg-white/60 dark:hover:bg-white/10'
                      }`}
                    >
                      {l.nativeLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5C5852] dark:text-[#A8A29A] block mb-2 px-1">
                  {t('nav.browseProperties', 'Browse Properties')}
                </span>
                <Link
                  href="/search"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-[#DF6400]" />
                    <span>{t('nav.searchCatalog', 'Search With Filters')}</span>
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
                    <span>{t('nav.brokerStores', 'Verified Broker Stores')}</span>
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
                    <span>{t('nav.residentialFlats', 'Residential Flats')}</span>
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
                    <span>{t('nav.villasPenthouses', 'Villas & Penthouses')}</span>
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
                    <span>{t('nav.commercialOffices', 'Commercial Offices')}</span>
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
                    <span>{t('nav.shopsRetail', 'Shops & Retail')}</span>
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
                    <span>{t('nav.plotsLand', 'Plots & Land')}</span>
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
                    <span>{t('nav.warehouses', 'Warehouses')}</span>
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
                  {t('nav.terms', 'Terms of Service')}
                </Link>
                <span>•</span>
                <Link
                  href="/privacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:underline"
                >
                  {t('nav.privacy', 'Privacy Policy')}
                </Link>
              </div>

              {currentUser && (
                <button
                  onClick={handleLogoutAction}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout', 'Log Out')}</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
