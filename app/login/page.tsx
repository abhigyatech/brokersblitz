'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '../../components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [otpTarget, setOtpTarget] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'whatsapp'>('whatsapp');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sampleOtpHint, setSampleOtpHint] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'We could not sign you in. Please check your details and try again.');
        setIsSubmitting(false);
        return;
      }

      if (data.user?.role === 'broker' || data.user?.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch {
      setErrorMessage('Unable to reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!otpTarget.trim()) {
      setErrorMessage(
        otpType === 'whatsapp'
          ? 'Please enter your 10-digit mobile number.'
          : 'Please enter your email address.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: otpTarget, type: otpType }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Could not send the code. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setOtpSent(true);
      setSuccessMessage(
        data.message ||
        `We sent a 6-digit verification code to your ${otpType === 'whatsapp' ? 'WhatsApp' : 'email'}.`
      );
      if (data.sampleOtp) {
        setSampleOtpHint(data.sampleOtp);
      }
    } catch {
      setErrorMessage('Network error while sending your code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: otpTarget, code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'That code does not match. Please double-check and try again.');
        setIsSubmitting(false);
        return;
      }

      if (data.user?.role === 'broker' || data.user?.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch {
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchAuthMethod = (method: 'password' | 'otp') => {
    setAuthMethod(method);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="relative min-h-screen bg-[#F4F0EA] dark:bg-[#12100E] flex flex-col justify-between font-sans transition-colors duration-300 overflow-hidden selection:bg-[#DF6400]/20 selection:text-[#DF6400]">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[360px] rounded-full bg-[#DF6400]/10 dark:bg-[#DF6400]/15 blur-3xl" />

      <header className="relative z-10 w-full px-6 sm:px-12 py-5 border-b border-[#1A1A1A]/[0.08] dark:border-white/[0.08] bg-[#F4F0EA]/80 dark:bg-[#12100E]/80 backdrop-blur-md flex items-center justify-between">
        <Link href="/" className="inline-flex items-center transition-transform duration-200 hover:scale-[1.02]">
          <BrandLogo className="h-7 sm:h-8 w-auto" priority />
        </Link>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A]">
          <span className="hidden sm:inline">New to BrokersBlitz?</span>
          <Link
            href="/signup"
            className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 text-[#DF6400] font-bold hover:border-[#DF6400]/40 hover:shadow-sm transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-8 sm:p-6">
        <div className="w-full max-w-[440px] bg-white/95 dark:bg-[#1B1815]/95 backdrop-blur-xl rounded-[28px] p-7 sm:p-9 border border-[#1A1A1A]/10 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(26,26,26,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] space-y-6 transition-all">
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-2xl sm:text-[26px] font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
              Sign in to manage your property listings, client inquiries, and saved homes.
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F4F0EA] dark:bg-[#12100E] border border-[#1A1A1A]/[0.06] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => switchAuthMethod('password')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${authMethod === 'password'
                  ? 'bg-white dark:bg-[#25211D] text-[#1A1A1A] dark:text-white shadow-sm'
                  : 'text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchAuthMethod('otp')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${authMethod === 'otp'
                  ? 'bg-white dark:bg-[#25211D] text-[#1A1A1A] dark:text-white shadow-sm'
                  : 'text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
            >
              One-Time Code
            </button>
          </div>

          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
                  Email or Mobile Number
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="broker@apexrealty.in or 9820144520"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#F4F0EA]/70 dark:bg-[#12100E] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#1A1A1A] dark:text-white placeholder:text-[#5C5852]/60 dark:placeholder:text-[#A8A29A]/50 outline-none focus:border-[#DF6400] focus:ring-4 focus:ring-[#DF6400]/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-semibold text-[#DF6400] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F4F0EA]/70 dark:bg-[#12100E] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl pl-4 pr-14 py-3 text-xs sm:text-sm text-[#1A1A1A] dark:text-white placeholder:text-[#5C5852]/60 dark:placeholder:text-[#A8A29A]/50 outline-none focus:border-[#DF6400] focus:ring-4 focus:ring-[#DF6400]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-medium leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-[#DF6400] hover:bg-[#C75700] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#DF6400]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing you in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
                      Where should we send your code?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpType('whatsapp');
                          setOtpTarget('');
                          setErrorMessage('');
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${otpType === 'whatsapp'
                            ? 'border-[#DF6400] bg-[#DF6400]/10 text-[#DF6400]'
                            : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] dark:text-[#A8A29A] hover:border-[#1A1A1A]/25 dark:hover:border-white/25'
                          }`}
                      >
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpType('email');
                          setOtpTarget('');
                          setErrorMessage('');
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${otpType === 'email'
                            ? 'border-[#DF6400] bg-[#DF6400]/10 text-[#DF6400]'
                            : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] dark:text-[#A8A29A] hover:border-[#1A1A1A]/25 dark:hover:border-white/25'
                          }`}
                      >
                        <span>Email</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
                      {otpType === 'whatsapp' ? '10-Digit Mobile Number' : 'Registered Email Address'}
                    </label>
                    <input
                      type={otpType === 'whatsapp' ? 'tel' : 'email'}
                      required
                      placeholder={otpType === 'whatsapp' ? '9820144520' : 'broker@apexrealty.in'}
                      value={otpTarget}
                      onChange={(e) => setOtpTarget(e.target.value)}
                      className="w-full bg-[#F4F0EA]/70 dark:bg-[#12100E] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-[#1A1A1A] dark:text-white placeholder:text-[#5C5852]/60 dark:placeholder:text-[#A8A29A]/50 outline-none focus:border-[#DF6400] focus:ring-4 focus:ring-[#DF6400]/10 transition-all"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-medium leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#DF6400] hover:bg-[#C75700] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#DF6400]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? 'Sending code...'
                      : `Send Verification Code via ${otpType === 'whatsapp' ? 'WhatsApp' : 'Email'}`}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  {successMessage && (
                    <div className="p-3 rounded-xl bg-[#F4F0EA] dark:bg-[#12100E] border border-[#1A1A1A]/10 dark:border-white/10 text-[#1A1A1A] dark:text-white text-xs leading-relaxed">
                      {successMessage}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setSampleOtpHint(null);
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className="text-[11px] font-bold text-[#DF6400] hover:underline"
                      >
                        Edit {otpType === 'whatsapp' ? 'number' : 'email'}
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#F4F0EA]/70 dark:bg-[#12100E] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.4em] text-[#1A1A1A] dark:text-white placeholder:text-[#5C5852]/30 dark:placeholder:text-[#A8A29A]/25 outline-none focus:border-[#DF6400] focus:ring-4 focus:ring-[#DF6400]/10 transition-all"
                    />
                  </div>

                  {sampleOtpHint && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 text-xs text-center font-mono">
                      Demo Code: <strong className="font-bold tracking-wider">{sampleOtpHint}</strong>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-medium leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length < 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#DF6400] hover:bg-[#C75700] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#DF6400]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Verifying code...' : 'Verify & Sign In'}
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="text-center text-xs text-[#5C5852] dark:text-[#A8A29A] pt-1 sm:hidden">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#DF6400] font-bold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 w-full py-5 border-t border-[#1A1A1A]/[0.08] dark:border-white/[0.08] text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
        &copy; 2026 BrokersBlitz. All rights reserved. &bull;{' '}
        <Link href="/privacy" className="text-[#DF6400] font-medium hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}