'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Home,
  CalendarCheck,
  ShieldCheck,
  Store,
  Heart,
  Moon,
  Sun,
  LogOut,
  ExternalLink,
  Plus,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Power,
  Activity,
  CheckCircle2,
  Ban,
  Menu,
  ChevronLeft,
  Search,
  ArrowRight,
  Wallet,
  Sparkles,
  CreditCard,
  Clock,
  ChevronDown,
  Gift,
  Download,
  UserX,
  Lock,
  Scale,
  QrCode,
} from 'lucide-react';
import { PropertyListing, UserRole, Lead } from '../../data/types';
import { useTheme } from '../../components/ThemeProvider';
import ListPropertyModal from '../../components/ListPropertyModal';
import BrandLogo from '../../components/BrandLogo';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import BrokerWalletView from '../../components/BrokerWalletView';
import AdminWalletView from '../../components/AdminWalletView';
import AdminReferralView from '../../components/AdminReferralView';
import UserReferralCard from '../../components/UserReferralCard';
import CriticalActionConfirmModal from '../../components/CriticalActionConfirmModal';
import PrivacyComplianceView from '../../components/PrivacyComplianceView';
import BrokerProfileCardBuilder from '../../components/BrokerProfileCardBuilder';

interface BrokerItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  agencyName: string;
  reraNumber: string;
  operatingCity: string;
  isLocked: boolean;
  createdAt: string;
  listingsCount?: number;
  leadsCount?: number;
  wallet?: {
    totalBalance: number;
    paidBalance: number;
    freeBalance: number;
  };
}

interface BuyerItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  isLocked: boolean;
  dpdpConsent: boolean;
  enquiriesCount?: number;
  savedCount?: number;
  recentActivity?: string;
  wallet?: {
    totalBalance: number;
    paidBalance: number;
    freeBalance: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    agency?: string;
    reraNumber?: string;
    isLocked?: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [adminBrokers, setAdminBrokers] = useState<BrokerItem[]>([]);
  const [adminBuyers, setAdminBuyers] = useState<BuyerItem[]>([]);

  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [overviewRoleFilter, setOverviewRoleFilter] = useState<'all' | 'broker' | 'buyer'>('all');
  const [overviewStatusFilter, setOverviewStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [overviewSearchQuery, setOverviewSearchQuery] = useState('');
  const [overviewBalanceFilter, setOverviewBalanceFilter] = useState<'all' | 'low'>('all');

  const [platformStats, setPlatformStats] = useState({
    totalBrokers: 0,
    totalBuyers: 0,
    activeBrokers: 0,
    lockedBrokers: 0,
    activeBuyers: 0,
    lockedBuyers: 0,
    totalListings: 0,
    activeListings: 0,
    pausedListings: 0,
    expiredListings: 0,
    soldListings: 0,
    totalLeads: 0,
    totalPlatformCredits: 0,
    totalPaidCredits: 0,
    totalFreeCredits: 0,
    totalRechargesVolume: 0,
    walletsCount: 0,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [walletSummary, setWalletSummary] = useState<{
    total: number;
    paid: number;
    free: number;
    nearestExpiryDays?: number;
    nearestExpiryAmount?: number;
  } | null>(null);

  const fetchWalletSummary = () => {
    fetch('/api/wallet/statement')
      .then((r) => r.json())
      .then((wData) => {
        if (wData.success && (wData.statement || wData.wallet)) {
          setWalletSummary({
            total: wData.statement?.totalCredits ?? wData.wallet?.totalBalance ?? 0,
            paid: wData.statement?.paidBalance ?? wData.wallet?.paidBalance ?? 0,
            free: wData.statement?.freeBalance ?? wData.wallet?.freeBalance ?? 0,
            nearestExpiryDays: wData.nearestExpiry?.daysLeft,
            nearestExpiryAmount: wData.nearestExpiry?.amount,
          });
        }
      })
      .catch(() => {});
  };

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminStatusMsg, setAdminStatusMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || !data.user) {
          window.location.href = '/login';
          return;
        }

        const userObj = {
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role as UserRole,
          agency: data.user.agencyName || 'Independent Realty',
          reraNumber: data.user.reraNumber || 'Self-Declared ID',
          isLocked: data.user.isLocked,
        };
        setCurrentUser(userObj);

        if (userObj.role === 'admin') {
          fetch('/api/admin/users')
            .then((r) => r.json())
            .then((adm) => {
              if (adm.success) {
                setAdminBrokers(adm.brokers || []);
                setAdminBuyers(adm.buyers || []);
                setProperties(adm.listings || []);
                setLeads(adm.leads || []);
                if (adm.stats) setPlatformStats(adm.stats);
              }
            })
            .catch(() => {});
        } else if (userObj.role === 'broker') {
          fetchWalletSummary();
          const storeCode = (userObj.agency || userObj.name).toLowerCase().replace(/[^a-z0-9]/g, '');
          fetch(`/api/properties?broker=${storeCode}`)
            .then((r) => r.json())
            .then((pData) => {
              if (pData.success && pData.properties) {
                setProperties(pData.properties);
              }
            })
            .catch(() => {});

          fetch(`/api/leads?broker=${storeCode}`)
            .then((r) => r.json())
            .then((lData) => {
              if (lData.success && lData.leads) {
                setLeads(lData.leads);
              }
            })
            .catch(() => {});
        } else {
          fetch('/api/properties')
            .then((r) => r.json())
            .then((pData) => {
              if (pData.success && pData.properties) {
                setProperties(pData.properties);
              }
            })
            .catch(() => {});
        }

        setIsLoading(false);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/login';
  };

  const [criticalModalConfig, setCriticalModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmPhrase: string;
    confirmButtonText?: string;
    dangerLevel?: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmPhrase: '',
    onConfirm: () => {},
  });

  const triggerDeleteListingModal = (item: PropertyListing) => {
    setCriticalModalConfig({
      isOpen: true,
      title: `Permanently Delete Listing: ${item.title}`,
      description: `Critical Action: This property listing will be permanently removed from BrokersBlitz and all search indices. This operation is immediate and non-reversible.`,
      confirmPhrase: 'DELETE',
      confirmButtonText: 'Permanently Delete Listing',
      dangerLevel: 'danger',
      onConfirm: async () => {
        const res = await fetch(`/api/properties/${item.id}`, { method: 'DELETE' });
        if (res.ok) {
          setProperties((prev) => prev.filter((p) => p.id !== item.id));
          showToast('Property listing permanently deleted.');
          if (currentUser?.role === 'admin') loadData();
        } else {
          const data = await res.json();
          throw new Error(data.error || 'Failed to delete property');
        }
      },
    });
  };

  const triggerToggleUserModal = (userId: string, isCurrentlyLocked: boolean, targetName: string) => {
    if (!isCurrentlyLocked) {
      setCriticalModalConfig({
        isOpen: true,
        title: `Suspend Account: ${targetName}`,
        description: `Critical Action: Suspending this account will immediately revoke login access, deactivate all active property listings, and pause WhatsApp lead inquiries for this user.`,
        confirmPhrase: 'SUSPEND',
        confirmButtonText: 'Confirm & Suspend Account',
        dangerLevel: 'danger',
        onConfirm: async () => {
          const res = await fetch(`/api/admin/users/${userId}/lock`, { method: 'POST' });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast('Account suspended successfully.');
            loadData();
          } else {
            throw new Error(data.error || 'Failed to suspend account');
          }
        },
      });
    } else {
      executeToggleUserStatus(userId);
    }
  };

  const executeToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/lock`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Status updated successfully');
        loadData();
      } else {
        showToast(data.error || 'Failed to update user status');
      }
    } catch {
      showToast('Error updating status');
    }
  };

  const triggerDeleteAccountModal = () => {
    setCriticalModalConfig({
      isOpen: true,
      title: 'Erase Account & Personal Data (DPDP Act, 2023)',
      description: 'Statutory Right to Erasure: In compliance with Section 12 of the DPDP Act 2023 and GDPR Article 17, your profile, contact numbers, listings, and credentials will be permanently erased. You will be signed out immediately.',
      confirmPhrase: 'DELETE MY ACCOUNT',
      confirmButtonText: 'Permanently Erase My Data',
      dangerLevel: 'danger',
      onConfirm: async () => {
        const res = await fetch('/api/user/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmPhrase: 'DELETE MY ACCOUNT' }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('Account and personal data erased permanently.');
          window.location.href = '/';
        } else {
          throw new Error(data.error || 'Failed to erase account.');
        }
      },
    });
  };

  const handleDownloadPersonalData = async () => {
    try {
      showToast('Preparing your personal data archive (DPDP Act Sec 11)...');
      const res = await fetch('/api/user/data-export');
      if (!res.ok) {
        showToast('Failed to export personal data.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brokersblitz_privacy_export_${currentUser?.id || 'user'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Personal data archive downloaded successfully!');
    } catch {
      showToast('Error downloading personal data');
    }
  };

  const handleToggleListingStatus = async (item: PropertyListing) => {
    const nextStatus = item.status === 'paused' ? 'active' : 'paused';
    try {
      const res = await fetch(`/api/properties/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: nextStatus } : p))
        );
        showToast(`Property marked as ${nextStatus === 'active' ? 'Active' : 'Inactive'}`);
        if (currentUser?.role === 'admin') loadData();
      }
    } catch {
      showToast('Error updating listing status');
    }
  };

  const handleMarkListingAsSold = async (item: PropertyListing) => {
    try {
      const res = await fetch(`/api/properties/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sold' }),
      });
      const data = await res.json();
      if (data.success) {
        setProperties((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'sold', soldAt: new Date().toISOString() } : p))
        );
        showToast('Property marked as Sold Out! Daily charges paused.');
      } else {
        showToast(data.error || 'Failed to mark as sold');
      }
    } catch {
      showToast('Error marking listing as sold');
    }
  };

  const handleReactivateListing = async (item: PropertyListing) => {
    try {
      const res = await fetch(`/api/properties/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });
      const data = await res.json();
      if (data.success) {
        setProperties((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'active', lastChargedAt: new Date().toISOString() } : p))
        );
        showToast('Listing reactivated with 2 credits!');
      } else {
        showToast(data.error || 'Failed to reactivate listing');
      }
    } catch {
      showToast('Error reactivating listing');
    }
  };

  const handleUpdateVisitStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        showToast(`Visit request marked as ${newStatus}`);
      }
    } catch {
      showToast('Failed to update status');
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatusMsg('');
    try {
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newAdminName,
          email: newAdminEmail,
          phone: newAdminPhone,
          password: newAdminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminStatusMsg(data.error || 'Failed to add admin user');
        return;
      }
      setAdminStatusMsg('Admin member added successfully for @brokersblitz.in domain.');
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
      setNewAdminPassword('');
    } catch {
      setAdminStatusMsg('Network error occurred.');
    }
  };

  const handlePropertyCreated = (newProp: PropertyListing) => {
    setProperties((prev) => [newProp, ...prev]);
    showToast('Listing published successfully!');
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const brokerStoreCode = currentUser?.agency
    ? currentUser.agency.toLowerCase().replace(/[^a-z0-9]/g, '')
    : currentUser?.name
    ? currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'broker';

  const isAdmin = currentUser?.role === 'admin';
  const isBroker = currentUser?.role === 'broker';

  const adminNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'brokers', label: 'Brokers', icon: Building2 },
    { id: 'buyers', label: 'Buyers', icon: Users },
    { id: 'listings', label: 'Properties', icon: Home },
    { id: 'leads', label: 'Site Visits & Leads', icon: CalendarCheck },
    { id: 'wallet', label: 'Wallet & Ledger', icon: Wallet },
    { id: 'referrals', label: 'Referral Program', icon: Gift },
    { id: 'admins', label: 'Admin Team', icon: ShieldCheck },
    { id: 'privacy', label: 'Privacy & DPDP Rights', icon: Lock },
  ];

  const brokerNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'listings', label: 'My Properties', icon: Home },
    { id: 'visits', label: 'Leads & Visits', icon: CalendarCheck },
    { id: 'wallet', label: 'Credits & Wallet', icon: Wallet },
    { id: 'referrals', label: 'Refer & Earn', icon: Gift },
    { id: 'card', label: 'Visiting Cards & QR', icon: QrCode },
    { id: 'store', label: 'My Storefront', icon: Store },
    { id: 'privacy', label: 'Privacy & DPDP Rights', icon: Lock },
  ];

  const buyerNavItems = [
    { id: 'overview', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'listings', label: 'Saved Properties', icon: Heart },
    { id: 'visits', label: 'My Enquiries', icon: CalendarCheck },
    { id: 'referrals', label: 'Refer & Earn', icon: Gift },
    { id: 'privacy', label: 'Privacy & DPDP Rights', icon: Lock },
  ];

  const navItems = isAdmin ? adminNavItems : isBroker ? brokerNavItems : buyerNavItems;

  const filteredBrokers = adminBrokers.filter((b) => {
    if (userFilter === 'active' && b.isLocked) return false;
    if (userFilter === 'inactive' && !b.isLocked) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.fullName.toLowerCase().includes(q) ||
        b.agencyName.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.operatingCity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredBuyers = adminBuyers.filter((u) => {
    if (userFilter === 'active' && u.isLocked) return false;
    if (userFilter === 'inactive' && !u.isLocked) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const combinedProfiles = [
    ...adminBrokers.map((b) => ({
      id: b.id,
      fullName: b.fullName,
      email: b.email,
      phone: b.phone,
      role: 'broker' as const,
      agencyOrCity: `${b.agencyName} (${b.operatingCity})`,
      isLocked: b.isLocked,
      createdAt: b.createdAt,
      activityLabel: `${b.listingsCount || 0} Listings • ${b.leadsCount || 0} Leads`,
      wallet: b.wallet || { totalBalance: 0, paidBalance: 0, freeBalance: 0 },
    })),
    ...adminBuyers.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: 'buyer' as const,
      agencyOrCity: u.recentActivity || 'Verified Customer',
      isLocked: u.isLocked,
      createdAt: u.createdAt,
      activityLabel: `${u.enquiriesCount || 0} Enquiries • ${u.savedCount || 0} Saved`,
      wallet: u.wallet || { totalBalance: 0, paidBalance: 0, freeBalance: 0 },
    })),
  ];

  const filteredOverviewProfiles = combinedProfiles.filter((p) => {
    if (overviewRoleFilter !== 'all' && p.role !== overviewRoleFilter) return false;
    if (overviewStatusFilter === 'active' && p.isLocked) return false;
    if (overviewStatusFilter === 'inactive' && !p.isLocked) return false;
    if (overviewBalanceFilter === 'low' && (p.wallet?.totalBalance ?? 0) >= 10) return false;
    if (overviewSearchQuery.trim()) {
      const q = overviewSearchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.agencyOrCity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white font-sans flex flex-col md:flex-row overflow-hidden transition-colors duration-200">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 text-[#1A1A1A] dark:text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-[#DF6400] animate-pulse" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#1A1815] border-r border-[#1A1A1A]/10 dark:border-white/10 transition-all duration-300 flex flex-col justify-between ${
          isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div>
          <div className="p-4 border-b border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between">
            <Link href="/" className="inline-block">
              {!isSidebarCollapsed ? (
                <BrandLogo className="h-7 sm:h-7.5 w-auto" priority />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#DF6400] text-white flex items-center justify-center font-black text-xs">
                  BB
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-[#5C5852] dark:text-[#A8A29A] hover:bg-[#F4F0EA] dark:hover:bg-[#24201C]"
              aria-label="Toggle Sidebar"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="p-3">
            <div className={`p-3 rounded-2xl bg-[#F4F0EA] dark:bg-[#24201C] mb-4 flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-[#DF6400] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {currentUser?.name.charAt(0)}
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                    {currentUser?.name}
                  </h4>
                  <span className={`text-[10px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded ${
                    isAdmin
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      : isBroker
                      ? 'bg-[#DF6400]/10 text-[#DF6400]'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}>
                    {isAdmin ? 'Platform Admin' : isBroker ? 'Broker Portal' : 'Buyer Account'}
                  </span>
                </div>
              )}
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileSidebarOpen(false);
                      setSearchQuery('');
                      setUserFilter('all');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#DF6400] text-white shadow-sm'
                        : 'text-[#5C5852] dark:text-[#A8A29A] hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] hover:text-[#1A1A1A] dark:hover:text-white'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-3 border-t border-[#1A1A1A]/10 dark:border-white/10 space-y-1.5">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-[#5C5852] dark:text-[#A8A29A] hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="relative z-30 h-14 sm:h-16 px-4 sm:px-6 md:px-8 border-b border-[#1A1A1A]/10 dark:border-white/10 bg-white/80 dark:bg-[#1A1815]/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-[#5C5852] dark:text-[#A8A29A] hover:bg-[#F4F0EA] dark:hover:bg-[#24201C]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#1A1A1A] dark:text-white">
                {isAdmin ? 'Platform Administration Console' : isBroker ? 'Broker Portal' : 'Buyer Dashboard'}
              </h2>
              <p className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] hidden sm:block">
                {isAdmin ? 'BrokersBlitz Headquarters • Pan India Platform Operations & Governance' : isBroker ? currentUser?.agency : 'Saved properties and site visit enquiries'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 hover:border-purple-500 text-purple-700 dark:text-purple-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Platform Treasury: {platformStats.totalPlatformCredits || 0} Credits</span>
              </button>
            )}

            {isBroker && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setActiveTab('wallet')}
                  onMouseEnter={fetchWalletSummary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{walletSummary !== null ? `${walletSummary.total} Credits` : 'Credits'}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
                </button>

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
                        {walletSummary ? walletSummary.total : 0}
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
                          {walletSummary ? walletSummary.paid : 0}
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
                          {walletSummary ? walletSummary.free : 0}
                        </span>
                      </div>
                    </div>

                    {walletSummary?.nearestExpiryAmount && walletSummary.nearestExpiryAmount > 0 ? (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-900 dark:text-amber-200 font-semibold">
                        <Clock className="w-3 h-3 text-[#DF6400] flex-shrink-0" />
                        <span>
                          {walletSummary.nearestExpiryAmount} bonus credits expire in {walletSummary.nearestExpiryDays} days
                        </span>
                      </div>
                    ) : null}

                    <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
                      Rate: 2 credits/day per active property listing beyond first 5 free listings.
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('wallet')}
                      className="w-full py-1.5 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      <span>Open Passbook & Recharge</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors"
            >
              <span>View Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {isBroker && !currentUser?.isLocked && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Property</span>
              </button>
            )}
          </div>
        </header>

        {isBroker && currentUser?.isLocked && (
          <div className="bg-rose-500 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2">
            <Ban className="w-4 h-4" />
            <span>Account Inactive: Your broker profile has been suspended by administration. Please contact support.</span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6">
          {isAdmin && activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Overall Brokers</span>
                    <Building2 className="w-4 h-4 text-[#DF6400]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white">
                    {platformStats.totalBrokers}
                  </div>
                  <div className="mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {platformStats.activeBrokers} Active • {platformStats.lockedBrokers} Suspended
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Overall Listings</span>
                    <Home className="w-4 h-4 text-[#DF6400]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#DF6400]">
                    {platformStats.totalListings}
                  </div>
                  <div className="mt-1.5 text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-semibold truncate">
                    {platformStats.activeListings} Active • {platformStats.expiredListings || 0} Expired • {platformStats.pausedListings} Paused
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Active Profiles</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white">
                    {platformStats.activeBrokers + platformStats.activeBuyers}
                  </div>
                  <div className="mt-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {platformStats.lockedBrokers + platformStats.lockedBuyers} Inactive / Suspended
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Wallet Treasury</span>
                    <Wallet className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white">
                    {platformStats.totalPlatformCredits || 0} <span className="text-xs font-bold text-[#5C5852]">Credits</span>
                  </div>
                  <div className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {platformStats.totalPaidCredits || 0} Paid • {platformStats.totalFreeCredits || 0} Bonus
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Recharges Volume</span>
                    <CreditCard className="w-4 h-4 text-[#DF6400]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white">
                    ₹{(platformStats.totalRechargesVolume || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold text-[#5C5852] dark:text-[#A8A29A]">
                    Razorpay Gateway Vol.
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Verified Leads</span>
                    <CalendarCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white">
                    {platformStats.totalLeads}
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    WhatsApp & Chatbot Enquiries
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white">
                      User Profiles & Customer Wallet Balances
                    </h3>
                    <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                      Live overview of all registered brokers and buyers, their real-time wallet balances, and 1-click account suspension control.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5852]" />
                      <input
                        type="text"
                        value={overviewSearchQuery}
                        onChange={(e) => setOverviewSearchQuery(e.target.value)}
                        placeholder="Search name, phone, agency..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#DF6400]"
                      />
                    </div>

                    <div className="inline-flex rounded-xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/10 dark:border-white/10 p-0.5 text-xs font-bold">
                      {(['all', 'broker', 'buyer'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setOverviewRoleFilter(r)}
                          className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                            overviewRoleFilter === r ? 'bg-[#DF6400] text-white' : 'text-[#5C5852] dark:text-[#A8A29A]'
                          }`}
                        >
                          {r === 'all' ? 'All Roles' : r === 'broker' ? 'Brokers' : 'Customers'}
                        </button>
                      ))}
                    </div>

                    <div className="inline-flex rounded-xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/10 dark:border-white/10 p-0.5 text-xs font-bold">
                      {(['all', 'active', 'inactive'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setOverviewStatusFilter(s)}
                          className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                            overviewStatusFilter === s ? 'bg-[#DF6400] text-white' : 'text-[#5C5852] dark:text-[#A8A29A]'
                          }`}
                        >
                          {s === 'all' ? 'All Status' : s === 'active' ? 'Active' : 'Suspended'}
                        </button>
                      ))}
                    </div>

                    <div className="inline-flex rounded-xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/10 dark:border-white/10 p-0.5 text-xs font-bold">
                      {(['all', 'low'] as const).map((b) => (
                        <button
                          key={b}
                          onClick={() => setOverviewBalanceFilter(b)}
                          className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                            overviewBalanceFilter === b ? 'bg-[#DF6400] text-white' : 'text-[#5C5852] dark:text-[#A8A29A]'
                          }`}
                        >
                          {b === 'all' ? 'All Balances' : 'Low (<10)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] font-mono font-bold uppercase text-[#5C5852] dark:text-[#A8A29A]">
                        <th className="py-2.5 px-3">Profile / Agency</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Account Status</th>
                        <th className="py-2.5 px-3">Activity</th>
                        <th className="py-2.5 px-3">Wallet Balance</th>
                        <th className="py-2.5 px-3 text-right">Suspend / Inactive Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5 text-xs">
                      {filteredOverviewProfiles.length > 0 ? (
                        filteredOverviewProfiles.map((p) => {
                          const total = p.wallet?.totalBalance ?? 0;
                          const paid = p.wallet?.paidBalance ?? 0;
                          const free = p.wallet?.freeBalance ?? 0;

                          return (
                            <tr key={p.id} className="hover:bg-[#F4F0EA]/60 dark:hover:bg-[#181614]/60 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                    p.role === 'broker' ? 'bg-[#DF6400]/15 text-[#DF6400]' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {p.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                                      <span>{p.fullName}</span>
                                      <span className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                        p.role === 'broker' ? 'bg-[#DF6400]/10 text-[#DF6400]' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      }`}>
                                        {p.role === 'broker' ? 'Broker' : 'Customer'}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] truncate max-w-[200px]">
                                      {p.agencyOrCity}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-mono text-[11px] text-[#1A1A1A] dark:text-white">{p.phone}</div>
                                <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] truncate max-w-[180px]">{p.email}</div>
                              </td>

                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  p.isLocked
                                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${p.isLocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                  <span>{p.isLocked ? 'Suspended' : 'Active'}</span>
                                </span>
                              </td>

                              <td className="py-3 px-3 text-[11px] text-[#5C5852] dark:text-[#A8A29A] font-semibold">
                                {p.activityLabel}
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-black text-[#1A1A1A] dark:text-white text-xs">
                                  {total} <span className="text-[10px] font-normal text-[#5C5852]">Credits</span>
                                </div>
                                <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-mono">
                                  Paid: {paid} • Bonus: {free}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => triggerToggleUserModal(p.id, p.isLocked, p.fullName)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm ${
                                    p.isLocked
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  }`}
                                >
                                  {p.isLocked ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Activate Profile</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Suspend Profile</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
                            No customer or broker profiles match your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white">Recent Properties & Status</h3>
                      <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">Toggle live listing status across the network</p>
                    </div>
                    <button onClick={() => setActiveTab('listings')} className="inline-flex items-center gap-1 text-xs font-bold text-[#DF6400] hover:underline">
                      <span>View All ({properties.length})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  {properties.length > 0 ? (
                    <div className="space-y-3">
                      {properties.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/5 dark:border-white/5">
                          <div>
                            <div className="text-xs font-bold text-[#1A1A1A] dark:text-white line-clamp-1">{p.title}</div>
                            <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">
                              {p.city} • {p.formattedPrice} • {p.broker.agency}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleListingStatus(p)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              p.status === 'paused'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-[#DF6400] text-white hover:bg-[#C75700]'
                            }`}
                          >
                            {p.status === 'paused' ? 'Set Active' : 'Set Inactive'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[#5C5852] dark:text-[#A8A29A] text-center py-8">
                      No properties listed yet.
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white">Recent Buyer Leads & Visits</h3>
                      <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">Inquiries generated via WhatsApp & AI assistant</p>
                    </div>
                    <button onClick={() => setActiveTab('leads')} className="inline-flex items-center gap-1 text-xs font-bold text-[#DF6400] hover:underline">
                      <span>View All ({leads.length})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  {leads.length > 0 ? (
                    <div className="space-y-3">
                      {leads.slice(0, 5).map((l) => (
                        <div key={l.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/5 dark:border-white/5">
                          <div>
                            <div className="text-xs font-bold text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                              <span>{l.buyerName}</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 uppercase font-bold">
                                {l.source}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] line-clamp-1">
                              {l.propertyTitle} • {l.buyerPhone}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DF6400]/10 text-[#DF6400] capitalize">
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[#5C5852] dark:text-[#A8A29A] text-center py-8">
                      No customer leads recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'brokers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[#1A1A1A] dark:text-white">Broker Management</h3>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                    Activate or deactivate broker accounts to manage listing permissions and storefront visibility.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 p-0.5 text-xs font-bold">
                    {(['all', 'active', 'inactive'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setUserFilter(filter)}
                        className={`px-3 py-1 rounded-lg capitalize transition-all ${
                          userFilter === filter ? 'bg-[#DF6400] text-white' : 'text-[#5C5852] dark:text-[#A8A29A]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5852] dark:text-[#A8A29A]" />
                    <input
                      type="text"
                      placeholder="Search brokers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F0EA] dark:bg-[#181614] border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
                      <tr>
                        <th className="p-3.5">Broker & Agency</th>
                        <th className="p-3.5">Contact Details</th>
                        <th className="p-3.5">RERA Number</th>
                        <th className="p-3.5">City</th>
                        <th className="p-3.5">Listings & Leads</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Account Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                      {filteredBrokers.map((b) => {
                        const storeCode = (b.agencyName || b.fullName).toLowerCase().replace(/[^a-z0-9]/g, '');
                        return (
                          <tr key={b.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-[#1A1A1A] dark:text-white">{b.agencyName}</div>
                              <div className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">{b.fullName}</div>
                              <Link href={`/broker/${storeCode}`} target="_blank" className="text-[10px] text-[#DF6400] font-mono hover:underline inline-flex items-center gap-1 mt-0.5">
                                <span>/broker/{storeCode}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </td>
                            <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {b.email}</div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] mt-0.5"><Phone className="w-3 h-3" /> {b.phone}</div>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-[#1A1A1A] dark:text-white">
                              {b.reraNumber}
                            </td>
                            <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                              {b.operatingCity}
                            </td>
                            <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                              <div>{b.listingsCount || 0} Properties</div>
                              <div className="text-[11px] text-[#DF6400] font-semibold">{b.leadsCount || 0} Inquiries</div>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                b.isLocked ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              }`}>
                                {b.isLocked ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                <span>{b.isLocked ? 'Inactive' : 'Active'}</span>
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => triggerToggleUserModal(b.id, b.isLocked, b.fullName)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  b.isLocked
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                              >
                                {b.isLocked ? 'Activate Broker' : 'Deactivate Broker'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'buyers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[#1A1A1A] dark:text-white">Buyer Management & Activities</h3>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                    Track buyer enquiries, site visits, and manage active or inactive status.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 p-0.5 text-xs font-bold">
                    {(['all', 'active', 'inactive'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setUserFilter(filter)}
                        className={`px-3 py-1 rounded-lg capitalize transition-all ${
                          userFilter === filter ? 'bg-[#DF6400] text-white' : 'text-[#5C5852] dark:text-[#A8A29A]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5852] dark:text-[#A8A29A]" />
                    <input
                      type="text"
                      placeholder="Search buyers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F0EA] dark:bg-[#181614] border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
                    <tr>
                      <th className="p-3.5">Buyer Name</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Enquiries & Saved</th>
                      <th className="p-3.5">Recent Activity</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Account Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                    {filteredBuyers.map((u) => (
                      <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-[#1A1A1A] dark:text-white">{u.fullName}</div>
                          <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                          <div>{u.email}</div>
                          <div className="font-mono text-[11px]">{u.phone}</div>
                        </td>
                        <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                          <div className="font-semibold text-[#DF6400]">{u.enquiriesCount || 0} Enquiries Sent</div>
                          <div className="text-[11px]">{u.savedCount || 0} Shortlisted Properties</div>
                        </td>
                        <td className="p-3.5 text-[11px] text-[#5C5852] dark:text-[#A8A29A] max-w-xs truncate">
                          {u.recentActivity || 'Active on platform'}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isLocked ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {u.isLocked ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>{u.isLocked ? 'Inactive' : 'Active'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => triggerToggleUserModal(u.id, u.isLocked, u.fullName)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              u.isLocked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                            }`}
                          >
                            {u.isLocked ? 'Activate Buyer' : 'Deactivate Buyer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isAdmin && activeTab === 'listings' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-[#1A1A1A] dark:text-white">Properties Directory & Moderation</h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                  Review, pause, activate, or remove property listings across Indian cities.
                </p>
              </div>

              {properties.length > 0 ? (
                <div className="bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F0EA] dark:bg-[#181614] border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
                        <tr>
                          <th className="p-3.5">Property</th>
                          <th className="p-3.5">Listing Broker</th>
                          <th className="p-3.5">Price & City</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                        {properties.map((p) => (
                          <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="p-3.5">
                              <Link href={`/property/${p.slug}`} target="_blank" className="font-bold text-[#1A1A1A] dark:text-white hover:text-[#DF6400] transition-colors line-clamp-1 inline-flex items-center gap-1">
                                <span>{p.title}</span>
                                <ExternalLink className="w-3 h-3 text-[#5C5852] dark:text-[#A8A29A]" />
                              </Link>
                              <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">
                                {p.categoryLabel} • {p.carpetAreaSqft} sq.ft
                              </div>
                            </td>
                            <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                              <div className="font-semibold text-[#1A1A1A] dark:text-white">{p.broker.agency}</div>
                              <div className="text-[10px]">{p.broker.name}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-[#DF6400]">{p.formattedPrice}</div>
                              <div className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">{p.locality}, {p.city}</div>
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'paused' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              }`}>
                                {p.status === 'paused' ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                <span>{p.status === 'paused' ? 'Inactive' : 'Active'}</span>
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button
                                onClick={() => handleToggleListingStatus(p)}
                                className="px-2.5 py-1.5 rounded-xl border border-[#1A1A1A]/15 dark:border-white/15 text-xs font-bold text-[#1A1A1A] dark:text-white hover:bg-[#F4F0EA] dark:hover:bg-[#181614]"
                              >
                                {p.status === 'paused' ? 'Activate' : 'Deactivate'}
                              </button>
                              <button
                                onClick={() => triggerDeleteListingModal(p)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10">
                  <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white">No properties listed yet</h4>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
                    When brokers submit properties from the broker console, they will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {isAdmin && activeTab === 'leads' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-[#1A1A1A] dark:text-white">Site Visits & Leads</h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                  Track inspection requests and property inquiries logged across the platform.
                </p>
              </div>

              {leads.length > 0 ? (
                <div className="bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F0EA] dark:bg-[#181614] border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
                      <tr>
                        <th className="p-3.5">Property</th>
                        <th className="p-3.5">Assigned Broker</th>
                        <th className="p-3.5">Buyer Details</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-[#1A1A1A] dark:text-white">{l.propertyTitle}</div>
                            <div className="text-[10px] text-[#DF6400] font-mono">{l.propertyPrice || 'Price on enquiry'}</div>
                          </td>
                          <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                            <span className="font-mono text-[11px] text-[#1A1A1A] dark:text-white">{l.brokerStoreCode}</span>
                          </td>
                          <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                            <div className="font-bold text-[#1A1A1A] dark:text-white">{l.buyerName}</div>
                            <div className="font-mono text-[11px]">{l.buyerPhone}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                              {l.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                            {new Date(l.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10">
                  <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white">No visit requests logged yet</h4>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
                    When buyers submit visit requests or chat on WhatsApp, inquiries will be listed here.
                  </p>
                </div>
              )}
            </div>
          )}

          {isAdmin && activeTab === 'wallet' && (
            <AdminWalletView onToast={showToast} />
          )}

          {isAdmin && activeTab === 'referrals' && (
            <AdminReferralView onToast={showToast} />
          )}

          {isAdmin && activeTab === 'admins' && (
            <div className="max-w-2xl bg-white dark:bg-[#24201C] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">Add Admin Team Member</h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
                  For security, admin email accounts must end with <code className="text-[#DF6400] font-mono">@brokersblitz.in</code>.
                </p>
              </div>

              {adminStatusMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  adminStatusMsg.includes('success') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200'
                }`}>
                  {adminStatusMsg}
                </div>
              )}

              <form onSubmit={handleCreateSubAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations Manager"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="username@brokersblitz.in"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className="w-full bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Account Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Create password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors"
                >
                  Add Admin Member
                </button>
              </form>
            </div>
          )}

          {isBroker && activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Active Properties</span>
                    <Home className="w-4 h-4 text-[#DF6400]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#1A1A1A] dark:text-white">
                    {properties.filter((p) => (p.status || 'active') === 'active').length}
                  </div>
                  <div className="mt-2 text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                    {properties.length} Total Properties
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">Leads & Inquiries</span>
                    <CalendarCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#DF6400]">
                    {leads.length}
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    WhatsApp Support Connected
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between text-[#5C5852] dark:text-[#A8A29A] mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase">My Store Code</span>
                    <Store className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-[#1A1A1A] dark:text-white mt-1 truncate">
                    {brokerStoreCode}
                  </div>
                  <Link href={`/broker/${brokerStoreCode}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#DF6400] hover:underline">
                    <span>Open My Storefront</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white">Recent Properties</h3>
                  <button onClick={() => setActiveTab('listings')} className="inline-flex items-center gap-1 text-xs font-bold text-[#DF6400] hover:underline">
                    <span>Manage Properties</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {properties.length > 0 ? (
                  <div className="space-y-3">
                    {properties.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/5 dark:border-white/5">
                        <div>
                          <div className="text-xs font-bold text-[#1A1A1A] dark:text-white">{p.title}</div>
                          <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">
                            {p.locality}, {p.city} • {p.formattedPrice}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          p.status === 'paused' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {p.status === 'paused' ? 'Inactive' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mb-3">You have not published any properties yet.</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700]"
                    >
                      + Add Your First Property
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isBroker && activeTab === 'listings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#1A1A1A] dark:text-white">My Properties</h3>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                    Manage your active inventory, update pricing, mark deals as sold, or post new properties.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700]"
                >
                  + Add Property
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DF6400] flex-shrink-0" />
                  <span>First 5 listings are free for 15 days. Beyond 5 listings or after 15 days, listings remain active at 2 credits/day. Sold listings remain free on your storefront!</span>
                </div>
              </div>

              {properties.length > 0 ? (
                <div className="bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F0EA] dark:bg-[#181614] border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
                      <tr>
                        <th className="p-3.5">Property</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Billing & Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                      {properties.map((p) => {
                        const isExpired = p.status === 'expired';
                        const isSold = p.status === 'sold';
                        const isPaused = p.status === 'paused';
                        const isFree = p.isFreeListing && p.freeUntil && new Date(p.freeUntil).getTime() > Date.now();

                        return (
                          <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-[#1A1A1A] dark:text-white">{p.title}</div>
                              <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A]">{p.locality}, {p.city}</div>
                            </td>
                            <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">{p.categoryLabel}</td>
                            <td className="p-3.5 font-bold text-[#DF6400]">{p.formattedPrice}</td>
                            <td className="p-3.5">
                              {isSold ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                                  Sold Out
                                </span>
                              ) : isExpired ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400" title={p.expiredReason}>
                                  Expired (Unpaid)
                                </span>
                              ) : isPaused ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                                  Paused
                                </span>
                              ) : isFree ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                  Free (15 Days)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                                  Active (2 cr/day)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              {isExpired ? (
                                <button
                                  onClick={() => handleReactivateListing(p)}
                                  className="px-2.5 py-1 rounded-lg bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700]"
                                >
                                  Reactivate (2 Cr)
                                </button>
                              ) : isSold ? (
                                <button
                                  onClick={() => handleReactivateListing(p)}
                                  className="px-2.5 py-1 rounded-lg border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold hover:bg-[#F4F0EA] dark:hover:bg-[#181614]"
                                >
                                  Re-list
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleMarkListingAsSold(p)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                                    title="Mark property as Sold. Stops daily charges."
                                  >
                                    Mark Sold
                                  </button>
                                  <button
                                    onClick={() => handleToggleListingStatus(p)}
                                    className="px-2.5 py-1 rounded-lg border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold hover:bg-[#F4F0EA] dark:hover:bg-[#181614]"
                                  >
                                    {isPaused ? 'Resume' : 'Pause'}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => triggerDeleteListingModal(p)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10">
                  <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white">No properties published yet</h4>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1 mb-4">
                    List properties in your city to start receiving buyer enquiries.
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700]"
                  >
                    + Post First Property
                  </button>
                </div>
              )}
            </div>
          )}

          {isBroker && activeTab === 'visits' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-[#1A1A1A] dark:text-white">Site Visits & Leads</h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
                  Inquiries and visit bookings requested through BlitzBot and WhatsApp support.
                </p>
              </div>

              {leads.length > 0 ? (
                <div className="bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F4F0EA] dark:bg-[#181614] border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
                      <tr>
                        <th className="p-3.5">Property</th>
                        <th className="p-3.5">Buyer</th>
                        <th className="p-3.5">Message / Note</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-[#1A1A1A] dark:text-white">{l.propertyTitle}</div>
                            <div className="text-[10px] text-[#DF6400]">{l.propertyPrice || 'Price on enquiry'}</div>
                          </td>
                          <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A]">
                            <div className="font-bold text-[#1A1A1A] dark:text-white">{l.buyerName}</div>
                            <div className="font-mono text-[11px]">{l.buyerPhone}</div>
                          </td>
                          <td className="p-3.5 text-[#5C5852] dark:text-[#A8A29A] max-w-xs truncate">
                            {l.message}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                              {l.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {l.status === 'new' && (
                              <button
                                onClick={() => handleUpdateVisitStatus(l.id, 'confirmed')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                              >
                                Confirm Slot
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-[#24201C] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10">
                  <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white">No inquiries yet</h4>
                  <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
                    When buyers enquire about your properties, visit requests will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {isBroker && activeTab === 'wallet' && currentUser && (
            <div className="space-y-6">
              <UserReferralCard onToast={showToast} />
              <BrokerWalletView
                brokerId={currentUser.id}
                brokerName={currentUser.name}
                onToast={showToast}
              />
            </div>
          )}

          {!isAdmin && activeTab === 'referrals' && (
            <div className="max-w-4xl space-y-6">
              <UserReferralCard onToast={showToast} />
            </div>
          )}

          {isBroker && activeTab === 'store' && (
            <div className="max-w-2xl bg-white dark:bg-[#24201C] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">Your Digital Storefront</h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
                  Share your personalized broker link on WhatsApp, Facebook, or Instagram so clients can browse all your properties in one place.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/10 dark:border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Storefront Link</span>
                <div className="font-mono text-xs font-bold text-[#DF6400] select-all">
                  https://www.brokersblitz.in/broker/{brokerStoreCode}
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/broker/${brokerStoreCode}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors"
                >
                  <span>Open Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(`${window.location.origin}/broker/${brokerStoreCode}`);
                      showToast('Storefront link copied to clipboard!');
                    }
                  }}
                  className="px-4 py-2 rounded-xl border border-[#1A1A1A]/15 dark:border-white/15 text-xs font-bold text-[#1A1A1A] dark:text-white hover:bg-[#F4F0EA] dark:hover:bg-[#181614]"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setActiveTab('card')}
                  className="px-4 py-2 rounded-xl bg-[#DF6400]/10 border border-[#DF6400]/20 text-xs font-bold text-[#DF6400] hover:bg-[#DF6400]/20 flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Visiting Card & QR</span>
                </button>
              </div>
            </div>
          )}

          {isBroker && activeTab === 'card' && currentUser && (
            <BrokerProfileCardBuilder
              broker={{
                id: currentUser.id,
                fullName: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone,
                agencyName: currentUser.agency || 'Independent Broker Network',
                storeCode: brokerStoreCode,
                reraNumber: currentUser.reraNumber,
              }}
              onToast={showToast}
            />
          )}

          {!isAdmin && !isBroker && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">Welcome, {currentUser?.name}</h3>
                <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
                  Explore properties across India, save your shortlisted homes, and coordinate site visits.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link href="/search" className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700]">
                    <span>Browse All Properties</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'privacy' && (
            <PrivacyComplianceView
              currentUser={currentUser}
              onToast={showToast}
              onDownloadData={handleDownloadPersonalData}
              onTriggerErasure={triggerDeleteAccountModal}
            />
          )}
        </main>
      </div>

      {isCreateModalOpen && (
        <ListPropertyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onPropertyCreated={handlePropertyCreated}
          currentUser={currentUser}
          onRequireAuth={() => router.push('/login')}
        />
      )}

      <CriticalActionConfirmModal
        isOpen={criticalModalConfig.isOpen}
        title={criticalModalConfig.title}
        description={criticalModalConfig.description}
        confirmPhrase={criticalModalConfig.confirmPhrase}
        confirmButtonText={criticalModalConfig.confirmButtonText}
        dangerLevel={criticalModalConfig.dangerLevel}
        onConfirm={criticalModalConfig.onConfirm}
        onClose={() => setCriticalModalConfig((c) => ({ ...c, isOpen: false }))}
      />
    </div>
  );
}
