'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { INDIAN_METROS, PROPERTY_TYPES, BUDGET_RANGES } from '../data/cities';

interface NavbarSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSearch: (filters: {
    purpose: 'sale' | 'rent' | 'all';
    city: string;
    locality: string;
    category: string;
    budget: string;
    bhk: string;
  }) => void;
}

export default function NavbarSearchModal({
  isOpen,
  onClose,
  selectedCity,
  onSearch,
}: NavbarSearchModalProps) {
  const [city, setCity] = useState(selectedCity);
  const [purpose, setPurpose] = useState<'all' | 'sale' | 'rent'>('sale');
  const [locality, setLocality] = useState('');
  const [category, setCategory] = useState('all');
  const [budget, setBudget] = useState('all');
  const [bhk, setBhk] = useState('all');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      purpose,
      city,
      locality,
      category,
      budget,
      bhk,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 text-left space-y-4 text-[#1A1A1A] dark:text-white">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
              <Search className="w-4 h-4 text-[#DF6400]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1A1A1A] dark:text-white">
                Refine Property Search
              </h3>
              <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                Change your city, budget or configuration anytime
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            {(['all', 'sale', 'rent'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  purpose === p ? 'bg-[#DF6400] text-white' : 'bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white'
                }`}
              >
                {p === 'all' ? 'All Purpose' : p === 'sale' ? 'Buy Flat/House' : 'Rent Flat/House'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] dark:text-white mb-1">Target City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
              >
                {INDIAN_METROS.map((m) => (
                  <option key={m.slug} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] dark:text-white mb-1">Locality / Sector</label>
              <input
                type="text"
                placeholder="e.g. Bandra, Whitefield"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] dark:text-white mb-1">Property Kind</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1A1A1A] dark:text-white mb-1">Budget</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
              >
                {BUDGET_RANGES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5C5852] dark:text-[#A8A29A] font-medium">BHK:</span>
              {['all', '1', '2', '3', '4'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBhk(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    bhk === b ? 'bg-[#DF6400] text-white' : 'bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white'
                  }`}
                >
                  {b === 'all' ? 'All' : `${b} BHK`}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-all"
            >
              Update Search Results
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
