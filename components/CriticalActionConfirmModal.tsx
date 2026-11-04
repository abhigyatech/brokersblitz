'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw, ShieldAlert } from 'lucide-react';

interface CriticalActionConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmPhrase: string;
  confirmButtonText?: string;
  dangerLevel?: 'danger' | 'warning';
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export default function CriticalActionConfirmModal({
  isOpen,
  title,
  description,
  confirmPhrase,
  confirmButtonText = 'Confirm & Proceed',
  dangerLevel = 'danger',
  onConfirm,
  onClose,
}: CriticalActionConfirmModalProps) {
  const [typedValue, setTypedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedValue('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = typedValue.trim() === confirmPhrase.trim();

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched) {
      setErrorMsg(`Please type "${confirmPhrase}" exactly to proceed.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to execute critical action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRed = dangerLevel === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/15 dark:border-white/15 shadow-2xl p-6 text-left space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isRed
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {isRed ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-[#1A1A1A] dark:text-white tracking-tight">
                {title}
              </h3>
              <span className="text-[10px] font-mono uppercase font-bold text-rose-600 dark:text-rose-400">
                Two-Step Verification Required
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-xl text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 text-xs text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
          {description}
        </div>

        <form onSubmit={handleExecute} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1.5">
              To proceed, please type <code className="px-1.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 font-mono text-rose-600 dark:text-rose-400 font-black select-all">{confirmPhrase}</code> below:
            </label>
            <input
              type="text"
              autoFocus
              required
              disabled={isSubmitting}
              placeholder={`Type "${confirmPhrase}"`}
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5C5852] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isMatched || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                isMatched && !isSubmitting
                  ? isRed
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                  : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmButtonText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

