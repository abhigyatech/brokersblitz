'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from '../../components/BrandLogo';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'broker'>('buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase().trim());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!dpdpConsent) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role: selectedRole,
          password,
          referralCode: referralCode.trim() || undefined,
          dpdpConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      if (selectedRole === 'broker') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch {
      setErrorMessage('Network error during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="p-2.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10">
        <span className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1.5">
          Are you a:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <label className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2 ${
            selectedRole === 'buyer'
              ? 'border-[#DF6400] bg-white dark:bg-[#24201C] font-bold text-[#1A1A1A] dark:text-white shadow-sm'
              : 'border-transparent text-[#5C5852] dark:text-[#A8A29A] bg-white/60 dark:bg-[#1A1815]'
          }`}>
            <input
              type="radio"
              name="role"
              value="buyer"
              checked={selectedRole === 'buyer'}
              onChange={() => setSelectedRole('buyer')}
              className="accent-[#DF6400]"
            />
            <span>1. Buyer / Tenant</span>
          </label>

          <label className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-2 ${
            selectedRole === 'broker'
              ? 'border-[#DF6400] bg-white dark:bg-[#24201C] font-bold text-[#1A1A1A] dark:text-white shadow-sm'
              : 'border-transparent text-[#5C5852] dark:text-[#A8A29A] bg-white/60 dark:bg-[#1A1815]'
          }`}>
            <input
              type="radio"
              name="role"
              value="broker"
              checked={selectedRole === 'broker'}
              onChange={() => setSelectedRole('broker')}
              className="accent-[#DF6400]"
            />
            <span>2. Broker</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Full Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Anand Varma"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Email Address</label>
          <input
            type="email"
            required
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Mobile Number</label>
          <input
            type="tel"
            required
            maxLength={10}
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-[#1A1A1A] dark:text-white font-mono outline-none focus:ring-2 focus:ring-[#DF6400]"
          />
          <p className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
            To enjoy WhatsApp features, please give a WhatsApp number
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Password</label>
        <input
          type="password"
          required
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
          Referral Code <span className="font-normal text-[#5C5852] dark:text-[#A8A29A]">(Optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. INDORE1001 or APEXPRIME"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs text-[#1A1A1A] dark:text-white font-mono uppercase outline-none focus:ring-2 focus:ring-[#DF6400]"
        />
        {referralCode ? (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            🎁 Referral code active! You and your referrer will each receive 50 bonus credits on registration.
          </p>
        ) : (
          <p className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
            Invited by a friend or broker? Enter their code above to unlock welcome credits.
          </p>
        )}
      </div>

      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] space-y-0.5">
        <strong className="block font-bold">Important Notice:</strong>
        <p>RERA numbers on this platform are self-reported by brokers. Buyers must independently verify all registration details on official state RERA portals.</p>
      </div>

      <label className="flex items-start gap-2 text-xs text-[#1A1A1A] dark:text-white cursor-pointer pt-0.5">
        <input
          type="checkbox"
          required
          checked={dpdpConsent}
          onChange={(e) => setDpdpConsent(e.target.checked)}
          className="accent-[#DF6400] mt-0.5"
        />
        <span className="text-[11px] leading-tight text-[#5C5852] dark:text-[#A8A29A]">
          I agree to the <Link href="/terms" target="_blank" className="underline text-[#1A1A1A] dark:text-white font-semibold">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="underline text-[#1A1A1A] dark:text-white font-semibold">Privacy Policy</Link>.
        </span>
      </label>

      {errorMessage && (
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 px-4 rounded-xl bg-[#DF6400] text-white font-extrabold text-xs sm:text-sm hover:bg-[#C75700] shadow-sm transition-all ${isSubmitting ? 'animate-pulse opacity-85' : ''}`}
      >
        {isSubmitting ? 'Registering...' : 'Complete Registration'}
      </button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] flex flex-col justify-between font-sans transition-colors duration-200">
      <header className="w-full px-6 sm:px-12 py-4 border-b border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between">
        <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
          <BrandLogo className="h-7 sm:h-8 w-auto" priority />
        </Link>
        <span className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
          Already registered?{' '}
          <Link href="/login" className="text-[#DF6400] font-bold hover:underline">
            Log In
          </Link>
        </span>
      </header>

      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Create Your Account
            </h1>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
              Join India&apos;s real estate listing network. Open for buyers and brokers.
            </p>
          </div>

          <Suspense fallback={<div className="py-8 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">Loading signup form...</div>}>
            <SignupForm />
          </Suspense>
        </div>
      </main>

      <footer className="w-full py-4 border-t border-[#1A1A1A]/10 dark:border-white/10 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
        &copy; 2026 BrokersBlitz. All rights reserved. • <Link href="/privacy" className="text-[#DF6400] hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
