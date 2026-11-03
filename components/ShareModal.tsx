'use client';

import React, { useState } from 'react';
import { Share2, X, Copy, Check } from 'lucide-react';
import { PropertyListing } from '../data/types';

interface ShareModalProps {
  property: PropertyListing | null;
  onClose: () => void;
}

export default function ShareModal({ property, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/property/${property.slug}`
    : `https://www.brokersblitz.in/property/${property.slug}`;

  const shareText = `Check out this property on BrokersBlitz: ${property.title} in ${property.locality}, ${property.city} (${property.formattedPrice}). RERA Reg: ${property.reraId}. View here: ${currentUrl}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this ${property.categoryLabel} on BrokersBlitz`,
          url: currentUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-2xl p-6 text-left space-y-4 text-[#1A1A1A] dark:text-white">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#DF6400]" />
            </div>
            <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-white">Share Property</h4>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#5C5852] dark:text-[#A8A29A] hover:text-[#1A1A1A] dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-[#5C5852] dark:text-[#A8A29A] line-clamp-2">
          {property.title} ({property.formattedPrice}) • {property.locality}, {property.city}
        </div>

        <div className="space-y-2">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Share on WhatsApp</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 text-[#1A1A1A] dark:text-white text-xs font-bold hover:bg-white dark:hover:bg-[#24201C] flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#5C5852] dark:text-[#A8A29A]" />
                <span>Copy Property Link</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] text-xs font-bold hover:bg-black dark:hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors"
            >
              <span>More Sharing Options...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
