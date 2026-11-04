'use client';

import React, { useState, useEffect } from 'react';
import {
  Gift,
  Users,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface ReferralConfig {
  referrerRewardCredits: number;
  refereeRewardCredits: number;
  expiryDays: number;
  isEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerCode: string;
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string;
  refereeRole: string;
  referrerCredits: number;
  refereeCredits: number;
  expiryDays: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

interface AdminReferralViewProps {
  onToast: (msg: string) => void;
}

export default function AdminReferralView({ onToast }: AdminReferralViewProps) {
  const [config, setConfig] = useState<ReferralConfig>({
    referrerRewardCredits: 50,
    refereeRewardCredits: 50,
    expiryDays: 30,
    isEnabled: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin@brokersblitz.in',
  });
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [totalCreditsDistributed, setTotalCreditsDistributed] = useState(0);
  const [totalReferralsCount, setTotalReferralsCount] = useState(0);

  const [formReferrerCredits, setFormReferrerCredits] = useState('50');
  const [formRefereeCredits, setFormRefereeCredits] = useState('50');
  const [formExpiryDays, setFormExpiryDays] = useState('30');
  const [formIsEnabled, setFormIsEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/referrals');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setFormReferrerCredits(String(data.config.referrerRewardCredits));
        setFormRefereeCredits(String(data.config.refereeRewardCredits));
        setFormExpiryDays(String(data.config.expiryDays));
        setFormIsEnabled(data.config.isEnabled);

        setReferrals(data.referrals || []);
        setTotalCreditsDistributed(data.totalCreditsDistributed || 0);
        setTotalReferralsCount(data.totalReferralsCount || 0);
      } else {
        onToast(data.error || 'Failed to load referral program settings');
      }
    } catch {
      onToast('Network error loading referral settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerRewardCredits: parseInt(formReferrerCredits, 10),
          refereeRewardCredits: parseInt(formRefereeCredits, 10),
          expiryDays: parseInt(formExpiryDays, 10),
          isEnabled: formIsEnabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        onToast('Referral program settings updated successfully!');
      } else {
        onToast(data.error || 'Failed to update referral configuration');
      }
    } catch {
      onToast('Error updating referral configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.referrerName.toLowerCase().includes(q) ||
      r.referrerCode.toLowerCase().includes(q) ||
      r.refereeName.toLowerCase().includes(q) ||
      r.refereeEmail.toLowerCase().includes(q) ||
      r.refereePhone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Referral Program & Reward Rules
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                config.isEnabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {config.isEnabled ? 'Program Active' : 'Program Paused'}
            </span>
          </div>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Configure credit rewards for referrers and newly joined members, expiry durations, and audit all referral credits.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReferralData}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-5 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
              Referrer Reward
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1A1A1A] dark:text-white">
            {config.referrerRewardCredits} <span className="text-sm font-semibold text-[#5C5852] dark:text-[#A8A29A]">Credits</span>
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Awarded to existing member upon referral
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-5 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
              New Member Reward
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {config.refereeRewardCredits} <span className="text-sm font-semibold text-[#5C5852] dark:text-[#A8A29A]">Credits</span>
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Welcome bonus credited to new account
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-5 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
              Credit Validity
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#1A1A1A] dark:text-white">
            {config.expiryDays} <span className="text-sm font-semibold text-[#5C5852] dark:text-[#A8A29A]">Days</span>
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Auto-expires if unused ({Math.round(config.expiryDays / 30)} Month)
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-5 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">
              Total Distributed
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {totalCreditsDistributed.toLocaleString('en-IN')} <span className="text-sm font-semibold text-[#5C5852] dark:text-[#A8A29A]">Credits</span>
          </div>
          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Across {totalReferralsCount} successful invites
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-7 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <ShieldCheck className="w-5 h-5 text-[#DF6400]" />
          <div>
            <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">
              Configure Referral Credit Rules
            </h3>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
              Changes apply instantly to all subsequent registrations using referral codes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1.5">
              Referrer Reward (Credits)
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              required
              value={formReferrerCredits}
              onChange={(e) => setFormReferrerCredits(e.target.value)}
              className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-[#DF6400]"
            />
            <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] mt-1 block">
              Credits credited to the inviter
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1.5">
              New Member Reward (Credits)
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              required
              value={formRefereeCredits}
              onChange={(e) => setFormRefereeCredits(e.target.value)}
              className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-[#DF6400]"
            />
            <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] mt-1 block">
              Credits credited to the new user
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1.5">
              Expiry Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              required
              value={formExpiryDays}
              onChange={(e) => setFormExpiryDays(e.target.value)}
              className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-[#DF6400]"
            />
            <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] mt-1 block">
              30 days = 1 calendar month
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsEnabled}
                onChange={(e) => setFormIsEnabled(e.target.checked)}
                className="accent-[#DF6400] w-4 h-4 rounded"
              />
              <span>Program Active</span>
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 py-2.5 px-4 rounded-xl bg-[#DF6400] text-white font-bold text-xs hover:bg-[#C75700] transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                isSaving ? 'opacity-80 animate-pulse' : ''
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        <div className="pt-2 text-[11px] text-[#5C5852] dark:text-[#A8A29A] flex items-center justify-between">
          <span>
            Last updated by: <strong className="font-mono text-[#1A1A1A] dark:text-white">{config.updatedBy}</strong>
          </span>
          <span>
            Last modified: {new Date(config.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div>
            <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">
              Referral Activity & Audit Ledger
            </h3>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
              Real-time audit log of all successful invitations and credit distributions.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, code or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
            />
          </div>
        </div>

        {filteredReferrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1A1A1A] dark:text-white">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10 dark:border-white/10 text-[10px] font-mono uppercase text-[#5C5852] dark:text-[#A8A29A]">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Referrer (Inviter)</th>
                  <th className="py-2.5 px-3">Code Used</th>
                  <th className="py-2.5 px-3">New Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Referrer Credits</th>
                  <th className="py-2.5 px-3 text-right">New Member Credits</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/5 dark:divide-white/5">
                {filteredReferrals.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F4F0EA]/50 dark:hover:bg-[#141210]/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-[#5C5852] dark:text-[#A8A29A] whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold">{r.referrerName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#DF6400]">{r.referrerCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold">{r.refereeName}</div>
                      <div className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-mono">{r.refereePhone}</div>
                    </td>
                    <td className="py-3 px-3 capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-bold">
                        {r.refereeRole}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{r.referrerCredits}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{r.refereeCredits}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Credited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-[#F4F0EA]/50 dark:bg-[#141210]/50 rounded-2xl border border-dashed border-[#1A1A1A]/10 dark:border-white/10">
            <Gift className="w-8 h-8 text-[#5C5852] dark:text-[#A8A29A] mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white">
              No referral registrations recorded yet
            </h4>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1 max-w-sm mx-auto">
              When members invite friends or brokers sign up with their partner codes, audit entries will be recorded here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

