'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandLogo from '../../components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

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
        setErrorMessage(data.error || 'Login failed. Please check credentials.');
        setIsSubmitting(false);
        return;
      }

      if (data.user?.role === 'broker' || data.user?.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch {
      setErrorMessage('Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!otpTarget.trim()) {
      setErrorMessage('Please enter your mobile number or email.');
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
        setErrorMessage(data.error || 'Failed to dispatch code.');
        setIsSubmitting(false);
        return;
      }

      setOtpSent(true);
      setSuccessMessage(data.message || 'Verification code sent!');
      if (data.sampleOtp) {
        setSampleOtpHint(data.sampleOtp);
      }
    } catch {
      setErrorMessage('Network error while requesting verification code.');
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
        setErrorMessage(data.error || 'Invalid verification code.');
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

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] flex flex-col justify-between font-sans transition-colors duration-200">
      <header className="w-full px-6 sm:px-12 py-4 border-b border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between">
        <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
          <BrandLogo className="h-7 sm:h-8 w-auto" priority />
        </Link>
        <span className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
          New to BrokersBlitz?{' '}
          <Link href="/signup" className="text-[#DF6400] font-bold hover:underline">
            Create Account
          </Link>
        </span>
      </header>

      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-5 transition-colors">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
              Access your property listings, bot inquiries, and saved items.
            </p>
          </div>

          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                  Email or 10-Digit Mobile
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. broker@apexrealty.in or 9820144520"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-2 w-full py-3 px-4 rounded-xl bg-[#DF6400] text-white font-extrabold text-xs sm:text-sm hover:bg-[#C75700] shadow-sm transition-all ${isSubmitting ? 'animate-pulse opacity-85' : ''}`}
              >
                {isSubmitting ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-3.5">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpType('whatsapp')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${otpType === 'whatsapp' ? 'border-[#DF6400] bg-[#DF6400]/5 text-[#DF6400]' : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] dark:text-[#A8A29A]'
                        }`}
                    >
                      WhatsApp OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpType('email')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${otpType === 'email' ? 'border-[#DF6400] bg-[#DF6400]/5 text-[#DF6400]' : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] dark:text-[#A8A29A]'
                        }`}
                    >
                      Email OTP (Zoho)
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                      {otpType === 'whatsapp' ? '10-Digit Mobile Number' : 'Registered Email Address'}
                    </label>
                    <input
                      type={otpType === 'whatsapp' ? 'tel' : 'email'}
                      required
                      placeholder={otpType === 'whatsapp' ? 'e.g. 9820144520' : 'e.g. broker@apexrealty.in'}
                      value={otpTarget}
                      onChange={(e) => setOtpTarget(e.target.value)}
                      className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-xl bg-[#DF6400] text-white font-extrabold text-xs sm:text-sm hover:bg-[#C75700] shadow-sm transition-all ${isSubmitting ? 'animate-pulse opacity-85' : ''}`}
                  >
                    {isSubmitting ? 'Sending Code...' : `Send Code on ${otpType === 'whatsapp' ? 'WhatsApp' : 'Email'}`}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#1A1A1A] dark:text-white">Enter 6-Digit Code</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setSampleOtpHint(null);
                        }}
                        className="text-[11px] font-bold text-[#DF6400] hover:underline"
                      >
                        Change Number/Email
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                    />
                  </div>

                  {sampleOtpHint && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] text-center font-mono">
                      Test Verification Code: <strong className="font-bold">{sampleOtpHint}</strong>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length < 6}
                    className={`w-full py-3 px-4 rounded-xl bg-[#DF6400] text-white font-extrabold text-xs sm:text-sm hover:bg-[#C75700] shadow-sm transition-all disabled:opacity-50 ${isSubmitting ? 'animate-pulse opacity-85' : ''}`}
                  >
                    {isSubmitting ? 'Verifying Code...' : 'Verify & Log In'}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod(authMethod === 'password' ? 'otp' : 'password');
                setErrorMessage('');
              }}
              className="text-xs font-bold text-[#DF6400] hover:underline"
            >
              {authMethod === 'password'
                ? 'Sign in with OTP instead'
                : 'Sign in with Password instead'}
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 border-t border-[#1A1A1A]/10 dark:border-white/10 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
        &copy; 2026 BrokersBlitz. All rights reserved. • <Link href="/privacy" className="text-[#DF6400] hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}