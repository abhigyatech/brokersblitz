'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Search,
  RefreshCw,
  Gift,
  Clock,
  X,
  AlertTriangle,
  Building2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface BrokerWalletEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  agencyName: string;
  reraNumber: string;
  city: string;
  paidBalance: number;
  freeBalance: number;
  totalBalance: number;
  activeGrantsCount: number;
}

interface PlatformSummary {
  totalPaidCirculation: number;
  totalFreeCirculation: number;
  totalCirculation: number;
  totalRechargesVolume: number;
  totalTransactionsCount: number;
  walletsCount: number;
  recentLedger: any[];
}

interface AdminWalletViewProps {
  onToast: (msg: string) => void;
}

export default function AdminWalletView({ onToast }: AdminWalletViewProps) {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [brokerWallets, setBrokerWallets] = useState<BrokerWalletEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'brokers' | 'ledger'>('brokers');

  const [selectedBroker, setSelectedBroker] = useState<BrokerWalletEntry | null>(null);
  const [grantAmount, setGrantAmount] = useState<string>('100');
  const [grantExpiryDays, setGrantExpiryDays] = useState<string>('30');
  const [grantReason, setGrantReason] = useState<string>('Festive Promotional Credit');
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);

  const fetchAdminSummary = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/wallet/summary');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setBrokerWallets(data.brokerWallets || []);
      } else {
        onToast(data.error || 'Failed to load admin wallet data');
      }
    } catch {
      onToast('Network error fetching admin wallet summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSummary();
  }, []);

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBroker) return;

    try {
      setIsSubmittingGrant(true);
      const res = await fetch('/api/admin/wallet/grant-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: selectedBroker.id,
          amount: parseInt(grantAmount, 10),
          expiryDays: parseInt(grantExpiryDays, 10),
          reason: grantReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onToast(data.message || 'Free promotional credits granted successfully!');
        setSelectedBroker(null);
        fetchAdminSummary();
      } else {
        onToast(data.error || 'Failed to grant promotional credits');
      }
    } catch (err: any) {
      onToast(err.message || 'Error granting credits');
    } finally {
      setIsSubmittingGrant(false);
    }
  };

  const filteredBrokers = brokerWallets.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.fullName.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.agencyName.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
            Platform Wallets & Broker Credit Management
          </h2>
          <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
            Manage broker credit balances, promotional grants, daily listing deductions, and verified records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAdminSummary}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400] text-xs font-bold text-[#1A1A1A] dark:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Paid Circulation</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {summary ? summary.totalPaidCirculation.toLocaleString('en-IN') : '...'}
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Permanent purchased credits across {summary?.walletsCount || 0} brokers
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Free Promotional</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {summary ? summary.totalFreeCirculation.toLocaleString('en-IN') : '...'}
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Promotional & referral credits with expiration
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Total Active Credits</span>
            <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1A1A1A] dark:text-white">
            {summary ? summary.totalCirculation.toLocaleString('en-IN') : '...'}
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Total credits ready for listing deductions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Recharge Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            ₹{summary ? summary.totalRechargesVolume.toLocaleString('en-IN') : '...'}
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Cumulative Razorpay collections
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('brokers')}
              className={`text-sm font-black transition-colors ${
                activeSubTab === 'brokers'
                  ? 'text-[#DF6400] border-b-2 border-[#DF6400] pb-1'
                  : 'text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A]'
              }`}
            >
              Broker Wallets ({filteredBrokers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('ledger')}
              className={`text-sm font-black transition-colors ${
                activeSubTab === 'ledger'
                  ? 'text-[#DF6400] border-b-2 border-[#DF6400] pb-1'
                  : 'text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A]'
              }`}
            >
              Audit Feed ({summary?.recentLedger.length || 0})
            </button>
          </div>

          {activeSubTab === 'brokers' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5852]" />
              <input
                type="text"
                placeholder="Search brokers, agency, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400] w-64"
              />
            </div>
          )}
        </div>

        {activeSubTab === 'brokers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1A1A1A] dark:text-white">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] font-mono uppercase text-[#5C5852] dark:text-[#A8A29A]">
                  <th className="py-2.5 px-3">Broker Partner</th>
                  <th className="py-2.5 px-3">Agency & RERA</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3 text-right">Paid Balance</th>
                  <th className="py-2.5 px-3 text-right">Free / Promo</th>
                  <th className="py-2.5 px-3 text-right">Total Balance</th>
                  <th className="py-2.5 px-3 text-center">Active Grants</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                {filteredBrokers.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F4F0EA]/50 dark:hover:bg-[#141210]/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold">{b.fullName}</div>
                      <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-mono">{b.phone}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold">{b.agencyName}</div>
                      <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-mono">{b.reraNumber || 'Non-RERA'}</div>
                    </td>

                    <td className="py-3 px-3 text-[#5C5852] dark:text-[#A8A29A] font-medium">
                      {b.city || 'Pan India'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {b.paidBalance}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {b.freeBalance}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-black text-[#1A1A1A] dark:text-white">
                      {b.totalBalance}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10">
                        {b.activeGrantsCount} Active
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBroker(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#DF6400]/10 hover:bg-[#DF6400] text-[#DF6400] hover:text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Issue Credits</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'ledger' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1A1A1A] dark:text-white">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] font-mono uppercase text-[#5C5852] dark:text-[#A8A29A]">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Reference / Txn ID</th>
                  <th className="py-2.5 px-3">Broker ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3 text-center">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5 font-mono text-[11px]">
                {(summary?.recentLedger || []).map((t: any) => {
                  const isCredit = t.amount > 0;
                  return (
                    <tr key={t.id} className="hover:bg-[#F4F0EA]/50 dark:hover:bg-[#141210]/50 transition-colors">
                      <td className="py-2.5 px-3 text-[#5C5852] dark:text-[#A8A29A] whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-2.5 px-3 text-[#DF6400] font-bold whitespace-nowrap">
                        {t.referenceId}
                      </td>

                      <td className="py-2.5 px-3 text-[#5C5852] dark:text-[#A8A29A]">
                        {t.brokerId}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded-md bg-[#F4F0EA] dark:bg-[#141210] text-[10px] font-bold text-[#1A1A1A] dark:text-white">
                          {t.type}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-sans text-xs max-w-xs truncate text-[#1A1A1A] dark:text-white">
                        {t.description}
                      </td>

                      <td className={`py-2.5 px-3 text-right font-bold ${
                        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isCredit ? `+${t.amount}` : t.amount}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-[#1A1A1A] dark:text-white">
                        {t.balanceAfter}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>HMAC OK</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleGrantCredits}
            className="w-full max-w-md bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/15 dark:border-white/15 shadow-2xl p-5 sm:p-6 text-left space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white">Grant Promotional Credits</h3>
                  <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">Admin goodwill issuance with expiry</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBroker(null)}
                className="p-1 rounded-lg text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10">
              <div className="text-xs font-bold text-[#1A1A1A] dark:text-white">{selectedBroker.fullName}</div>
              <div className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">{selectedBroker.agencyName} • {selectedBroker.city}</div>
              <div className="text-[10px] font-mono text-[#DF6400] font-bold mt-1">
                Current Total: {selectedBroker.totalBalance} Credits ({selectedBroker.paidBalance} Paid + {selectedBroker.freeBalance} Free)
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] mb-1">
                  Credit Amount
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGrantAmount(String(amt))}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        grantAmount === String(amt)
                          ? 'bg-[#DF6400] text-white border-[#DF6400]'
                          : 'bg-[#F4F0EA] dark:bg-[#141210] border-[#1A1A1A]/10 dark:border-white/10'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/15 dark:border-white/15 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] mb-1">
                  Validity Period (Days)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[15, 30, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setGrantExpiryDays(String(days))}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        grantExpiryDays === String(days)
                          ? 'bg-[#DF6400] text-white border-[#DF6400]'
                          : 'bg-[#F4F0EA] dark:bg-[#141210] border-[#1A1A1A]/10 dark:border-white/10'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={grantExpiryDays}
                  onChange={(e) => setGrantExpiryDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/15 dark:border-white/15 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] mb-1">
                  Audit Reason / Note
                </label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/15 dark:border-white/15 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1A1A1A]/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedBroker(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmittingGrant}
                className="px-5 py-2.5 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-black shadow-md shadow-[#DF6400]/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingGrant ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Granting...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Issue Free Credits</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
