'use client';

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { State, City } from 'country-state-city';
import { PROPERTY_TYPES } from '../data/cities';
import { PropertyListing } from '../data/types';

interface ListPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyCreated: (newProperty: PropertyListing) => void;
  currentUser: {
    name: string;
    agency?: string;
    phone?: string;
    reraNumber?: string;
  } | null;
  onRequireAuth: () => void;
}

export default function ListPropertyModal({
  isOpen,
  onClose,
  onPropertyCreated,
  currentUser,
  onRequireAuth,
}: ListPropertyModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const states = useMemo(() => State.getStatesOfCountry('IN'), []);
  const [selectedStateCode, setSelectedStateCode] = useState<string>('MH');
  const availableCities = useMemo(() => City.getCitiesOfState('IN', selectedStateCode), [selectedStateCode]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('apartment');
  const [purpose, setPurpose] = useState<'sale' | 'rent'>('sale');
  const [city, setCity] = useState(availableCities[0]?.name || 'Mumbai');
  const [locality, setLocality] = useState('');
  const [priceInr, setPriceInr] = useState('');
  const [carpetArea, setCarpetArea] = useState('');
  const [bedrooms, setBedrooms] = useState('3');
  const [reraId, setReraId] = useState(currentUser?.reraNumber || '');
  const [possession, setPossession] = useState('ready_to_move');
  const [description, setDescription] = useState('');
  const [whatsappNotificationsConsent, setWhatsappNotificationsConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleStateChange = (code: string) => {
    setSelectedStateCode(code);
    const newCities = City.getCitiesOfState('IN', code);
    if (newCities.length > 0) {
      setCity(newCities[0].name);
    }
  };

  const formatPricePreview = (raw: string) => {
    const num = parseFloat(raw);
    if (!num) return '₹0';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const handlePublish = async () => {
    if (!title.trim() || !priceInr || !carpetArea) {
      setErrorMessage('Please fill in title, price, and carpet area.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const numPrice = parseFloat(priceInr);
    const numArea = parseFloat(carpetArea);
    const pricePerSqft = Math.round(numPrice / numArea);

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          categoryLabel: `${bedrooms} BHK ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          purpose,
          price: numPrice,
          pricePerSqft,
          city,
          locality: locality.trim() || city,
          address: `${locality.trim() ? locality.trim() + ', ' : ''}${city}`,
          carpetAreaSqft: numArea,
          bedrooms: parseInt(bedrooms) || 3,
          bathrooms: (parseInt(bedrooms) || 3) + 1,
          possession,
          reraId: reraId.trim(),
          description: description.trim() || 'Direct broker listing on BrokersBlitz.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          onRequireAuth();
          return;
        }
        setErrorMessage(data.error || 'Failed to publish property');
        setIsSubmitting(false);
        return;
      }

      onPropertyCreated(data.property);
      onClose();
    } catch {
      setErrorMessage('Network error occurred while publishing listing.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-6 border-b border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#1E1B17]">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#DF6400]">
              Step {step} of 3
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white">
              {step === 1 && 'Property Specifications & Location'}
              {step === 2 && 'Pricing & Commercial Terms'}
              {step === 3 && 'RERA Details & Confirmation'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F0EA] dark:bg-[#2A2621] text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Property Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sea-Facing 3 BHK Luxury Haven with Private Sun Deck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Property Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Listing Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
                  >
                    <option value="sale">Outright Sale</option>
                    <option value="rent">Rental Lease</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Indian State / UT</label>
                  <select
                    value={selectedStateCode}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none cursor-pointer"
                  >
                    {states.map((s) => (
                      <option key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none cursor-pointer"
                  >
                    {availableCities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Locality or Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Bandra West, Whitefield, Baner"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Bedrooms / BHK</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                    Price (₹ INR) {priceInr && <span className="text-[#DF6400]">({formatPricePreview(priceInr)})</span>}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000000 for 1.5 Cr"
                    value={priceInr}
                    onChange={(e) => setPriceInr(e.target.value)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Carpet Area (sq.ft)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1450"
                    value={carpetArea}
                    onChange={(e) => setCarpetArea(e.target.value)}
                    className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Possession Timeline</label>
                <select
                  value={possession}
                  onChange={(e) => setPossession(e.target.value)}
                  className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none"
                >
                  <option value="ready_to_move">Ready to Move In</option>
                  <option value="under_construction">Under Construction (Within 12 Months)</option>
                  <option value="new_launch">New Launch (Within 2-3 Years)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Property Description</label>
                <textarea
                  rows={3}
                  placeholder="Detail key highlights, amenities, vastu orientation, or landmarks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl p-3 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">Self-Declared RERA Registration ID</label>
                <input
                  type="text"
                  placeholder="e.g. P51800049210"
                  value={reraId}
                  onChange={(e) => setReraId(e.target.value)}
                  className="w-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-[#1A1A1A] dark:text-white outline-none focus:ring-2 focus:ring-[#DF6400]"
                />
                <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 block">
                  Notice: Listings clearly display that RERA details are broker-reported and subject to buyer portal cross-check.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F0EA] dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Summary Preview</span>
                <div className="text-sm font-black text-[#1A1A1A] dark:text-white">{title || 'Untitled Property'}</div>
                <div className="text-xs text-[#DF6400] font-bold">
                  {formatPricePreview(priceInr)} • {carpetArea || 0} sq.ft • {city}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                <span className="font-bold">Listing Policy: </span>First 5 properties are free for 15 days. Active listings beyond 5 or after 15 days require 2 credits/day.
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappNotificationsConsent}
                  onChange={(e) => setWhatsappNotificationsConsent(e.target.checked)}
                  className="mt-0.5 rounded text-[#DF6400] focus:ring-[#DF6400]"
                />
                <span className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                  I confirm that all property details and RERA numbers are truthful. I agree to receive site visit coordination alerts via WhatsApp support.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-[#1A1A1A]/10 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#1E1B17]">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl border border-[#1A1A1A]/15 dark:border-white/15 text-xs font-bold text-[#1A1A1A] dark:text-white hover:bg-[#F4F0EA] dark:hover:bg-[#24201C] transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !title.trim()) {
                  setErrorMessage('Please enter a property title');
                  return;
                }
                setErrorMessage('');
                setStep((s) => (s + 1) as any);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors shadow-sm"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
