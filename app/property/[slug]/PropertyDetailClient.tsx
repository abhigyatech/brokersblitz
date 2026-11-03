'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Share2, MapPin, Maximize2, Bed, CheckCircle2 } from 'lucide-react';
import { PropertyListing } from '../../../data/types';
import ShareModal from '../../../components/ShareModal';
import BlitzChatbot from '../../../components/BlitzChatbot';
import BrandLogo from '../../../components/BrandLogo';

interface Props {
  property: PropertyListing;
  relatedProperties: PropertyListing[];
}

export default function PropertyDetailClient({ property, relatedProperties }: Props) {
  const [activeImage, setActiveImage] = useState(property.primaryImage);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const allImages = [property.primaryImage, ...(property.additionalImages || [])];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEnquireWithBot = () => {
    setIsChatOpen(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('blitzbot:enquire', {
          detail: {
            propertyId: property.id,
            propertyTitle: property.title,
            propertyPrice: property.formattedPrice,
            propertyLocality: property.locality,
            propertyCity: property.city,
            brokerStoreCode: property.broker.storeCode || property.broker.id,
            brokerName: property.broker.name,
            brokerAgency: property.broker.agency,
          },
        })
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white font-sans flex flex-col justify-between transition-colors duration-200">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-[#24201C] text-[#1A1A1A] dark:text-white border border-[#1A1A1A]/10 dark:border-white/10 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DF6400] animate-pulse" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full bg-[#F4F0EA]/95 dark:bg-[#141210]/95 backdrop-blur-md border-b border-[#1A1A1A]/10 dark:border-white/10 px-4 sm:px-6 md:px-8 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
            <BrandLogo className="h-7 sm:h-8 w-auto" priority />
          </Link>
          <span className="text-xs text-[#5C5852] dark:text-[#A8A29A] hidden sm:inline">
            / {property.city} / {property.locality}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-xs font-bold hover:bg-[#F4F0EA] dark:hover:bg-[#1A1815] flex items-center gap-1.5 shadow-sm text-[#1A1A1A] dark:text-white"
          >
            <Share2 className="w-4 h-4 text-[#DF6400]" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Explore Properties</span>
          </Link>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase font-mono px-2.5 py-0.5 rounded-full bg-[#DF6400]/10 text-[#DF6400]">
                  {property.categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  RERA Declared by Broker: {property.reraId}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
                {property.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#DF6400] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{property.address}, {property.locality}, {property.city} - {property.pincode}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative w-full h-72 sm:h-96 md:h-[480px] rounded-3xl overflow-hidden bg-black/5 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                <Image
                  src={activeImage}
                  alt={property.title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImage === img ? 'border-[#DF6400] ring-2 ring-[#DF6400]/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-1">
              <strong className="block font-bold">Official Verification Advisory:</strong>
              <p>
                BrokersBlitz does not independently cross-check or verify RERA registrations submitted by brokers. All buyers and tenants are strictly advised to verify the registration number ({property.reraId}), carpet area, and sanction plan directly on the official state government RERA website prior to signing any deal or paying advance money.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-[#5C5852] dark:text-[#A8A29A] block">Carpet Area</span>
                <span className="text-base font-black text-[#1A1A1A] dark:text-white">{property.carpetAreaSqft.toLocaleString('en-IN')} sq.ft</span>
                <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] block mt-0.5">{property.superBuiltupSqft} super built-up</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-[#5C5852] dark:text-[#A8A29A] block">Configuration</span>
                <span className="text-base font-black text-[#1A1A1A] dark:text-white">{property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'Commercial Space'}</span>
                <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] block mt-0.5">{property.bathrooms} Baths • {property.balconies} Balconies</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-[#5C5852] dark:text-[#A8A29A] block">Possession</span>
                <span className="text-base font-black text-[#1A1A1A] dark:text-white capitalize">{property.possession.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] block mt-0.5">{property.floorInfo}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-[#5C5852] dark:text-[#A8A29A] block">Facing</span>
                <span className="text-base font-black text-[#1A1A1A] dark:text-white truncate block">{property.facing}</span>
                <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] block mt-0.5">{property.carParking} Parking</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#24201C] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white">Property Details</h3>
              <p className="text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
                {property.description}
              </p>
            </div>

            <div className="bg-white dark:bg-[#24201C] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white">Declared Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#1A1A1A] dark:text-white p-2.5 rounded-xl bg-[#F4F0EA]/60 dark:bg-[#181614]">
                    <span className="w-2 h-2 rounded-full bg-[#DF6400]" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#24201C] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-5 sticky top-24">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#5C5852] dark:text-[#A8A29A] tracking-wider block">Price</span>
                <div className="text-3xl sm:text-4xl font-black text-[#DF6400] mt-0.5 tracking-tight">
                  {property.formattedPrice}
                </div>
                <div className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1 font-medium">
                  {property.formattedPricePerSqft}{property.maintenanceMonthly ? ` • Maintenance: ₹${property.maintenanceMonthly.toLocaleString('en-IN')}/mo` : ''}
                </div>
              </div>

              <div className="pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10 space-y-2.5">
                <button
                  onClick={handleEnquireWithBot}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#DF6400] text-white font-extrabold text-sm hover:bg-[#C75700] shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>Enquire & Schedule Visit via Bot</span>
                </button>

                <a
                  href={`https://wa.me/917272357771?text=${encodeURIComponent(`Hi BrokersBlitz, I am enquiring about property ID: ${property.id} (${property.title}, ${property.formattedPrice}) in ${property.city}. Broker: ${property.broker.name} (${property.broker.storeCode || property.broker.id}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Chat on WhatsApp (+91 72723 57771)</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
                <span className="text-[11px] font-bold uppercase text-[#5C5852] dark:text-[#A8A29A] tracking-wider block mb-3">Listing Broker</span>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-brandDark border border-[#1A1A1A]/10 flex-shrink-0">
                    <Image src={property.broker.avatar} alt={property.broker.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">{property.broker.agency}</h4>
                    <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">{property.broker.name} • {property.broker.experienceYears}+ Yrs</p>
                    <Link
                      href={`/broker/${property.broker.storeCode || property.broker.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DF6400] hover:underline mt-0.5"
                    >
                      <span>View Broker Store</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-[#F4F0EA] dark:bg-[#181614] border border-[#1A1A1A]/5 dark:border-white/10 text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                  Direct numbers protected against telemarketing scrapers. Site visits coordinated via bot.
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProperties.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#1A1A1A]/10 dark:border-white/10">
            <h3 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white mb-6 tracking-tight">
              Other Properties in {property.city}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProperties.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/property/${rel.slug}`}
                  className="group bg-white dark:bg-[#24201C] rounded-2xl overflow-hidden border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400] transition-all shadow-sm hover:shadow-md"
                >
                  <div className="relative h-44 w-full">
                    <Image src={rel.primaryImage} alt={rel.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                      {rel.formattedPrice}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">{rel.title}</h4>
                    <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A]">{rel.locality}, {rel.city}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <ShareModal
        property={isShareOpen ? property : null}
        onClose={() => setIsShareOpen(false)}
      />

      <BlitzChatbot
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      <footer className="w-full border-t border-[#1A1A1A]/10 dark:border-white/10 py-6 px-4 sm:px-8 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
        &copy; 2026 BrokersBlitz. All rights reserved. • <Link href="/terms" className="text-[#DF6400] hover:underline">Terms</Link> • <Link href="/privacy" className="text-[#DF6400] hover:underline">Privacy</Link>
      </footer>
    </div>
  );
}
