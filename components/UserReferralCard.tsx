'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, Share2, Sparkles, Users } from 'lucide-react';

interface UserReferralCardProps {
  onToast?: (msg: string) => void;
  className?: string;
}

export default function UserReferralCard({ onToast, className = '' }: UserReferralCardProps) {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalCreditsEarned, setTotalCreditsEarned] = useState(0);
  const [referrerCredits, setReferrerCredits] = useState(50);
  const [refereeCredits, setRefereeCredits] = useState(50);
  const [expiryDays, setExpiryDays] = useState(30);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReferralInfo() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/referrals/my-code');
        const data = await res.json();
        if (data.success) {
          setReferralCode(data.referralCode);
          setReferralLink(data.referralLink);
          setTotalReferrals(data.totalReferrals || 0);
          setTotalCreditsEarned(data.totalCreditsEarned || 0);
          if (data.config) {
            setReferrerCredits(data.config.referrerRewardCredits || 50);
            setRefereeCredits(data.config.refereeRewardCredits || 50);
            setExpiryDays(data.config.expiryDays || 30);
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    loadReferralInfo();
  }, []);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    if (onToast) onToast('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `Hey! Join BrokersBlitz - India's direct broker-verified real estate intelligence network. Use my referral code ${referralCode} to claim ${refereeCredits} free listing credits: ${referralLink}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  if (isLoading) {
    return (
      <div className={`p-6 rounded-3xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/3 mb-4" />
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-1/2 mb-2" />
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-[#DF6400]/5 via-amber-500/5 to-transparent rounded-3xl p-6 sm:p-7 border border-[#DF6400]/20 shadow-sm space-y-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#DF6400] text-white flex items-center justify-center shadow-md">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Refer & Earn Free Credits
            </h3>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
              Invite other brokers or buyers. Both you and your friend get {referrerCredits} Credits (valid for {Math.round(expiryDays / 30)} Month).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 text-xs">
            <span className="text-[#5C5852] dark:text-[#A8A29A]">Invited: </span>
            <strong className="text-[#1A1A1A] dark:text-white font-mono font-bold">{totalReferrals}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="opacity-80">Earned: </span>
            <strong className="font-mono font-bold">+{totalCreditsEarned} Credits</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 space-y-2">
          <span className="text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] block">
            Your Exclusive Referral Code
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xl sm:text-2xl font-mono font-black tracking-wider text-[#DF6400]">
              {referralCode || 'BROKER100'}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-[#F4F0EA] dark:bg-[#181614] hover:bg-[#DF6400] hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#1A1A1A]/10 dark:border-white/10"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-3 px-4 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400] text-xs font-bold text-[#1A1A1A] dark:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[#DF6400]" />}
            <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

