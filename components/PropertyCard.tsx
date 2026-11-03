'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Heart, MapPin, MessageSquare, CheckCircle2 } from 'lucide-react';
import { PropertyListing } from '../data/types';

interface PropertyCardProps {
  property: PropertyListing;
  isSaved?: boolean;
  onShare: (property: PropertyListing) => void;
  onToggleSave: (propertyId: string) => void;
  onEnquire?: (property: PropertyListing) => void;
}

export default function PropertyCard({
  property,
  isSaved = false,
  onShare,
  onToggleSave,
  onEnquire,
}: PropertyCardProps) {
  const handleEnquireClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEnquire) {
      onEnquire(property);
    } else if (typeof window !== 'undefined') {
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
    <div className="group relative flex-shrink-0 w-[280px] sm:w-auto snap-start flex flex-col justify-between rounded-2xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400]/60 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden text-left">
      <div>
        <div className="relative h-40 sm:h-44 w-full bg-black/5 overflow-hidden">
          <Link href={`/property/${property.slug}`}>
            <Image
              src={property.primaryImage}
              alt={property.title}
              fill
              sizes="(max-width: 640px) 280px, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span className="px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold uppercase backdrop-blur-sm">
              {property.purpose === 'sale' ? 'For Sale' : 'For Rent'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-700/90 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm" title="Declared by broker. Please verify on official state RERA portal.">
              <span>RERA</span>
              <CheckCircle2 className="w-3 h-3 text-white" />
            </span>
          </div>

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare(property);
              }}
              className="w-7 h-7 rounded-full bg-white/90 dark:bg-[#1A1815]/90 text-[#1A1A1A] dark:text-white hover:bg-white flex items-center justify-center shadow-sm transition-transform hover:scale-110"
              title="Share property"
            >
              <Share2 className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A29A]" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave(property.id);
              }}
              className="w-7 h-7 rounded-full bg-white/90 dark:bg-[#1A1815]/90 text-[#1A1A1A] dark:text-white hover:bg-white flex items-center justify-center shadow-sm transition-transform hover:scale-110"
              title={isSaved ? 'Remove from shortlist' : 'Save to shortlist'}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  isSaved ? 'text-rose-500 fill-rose-500' : 'text-[#5C5852] dark:text-[#A8A29A]'
                }`}
              />
            </button>
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold">
            <span className="bg-black/75 px-2 py-0.5 rounded-md backdrop-blur-sm">
              {property.categoryLabel}
            </span>
            <span className="bg-[#DF6400] text-white px-2 py-0.5 rounded-md shadow-sm">
              {property.formattedPrice}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 space-y-1.5">
          <Link href={`/property/${property.slug}`} className="block">
            <h3 className="text-xs font-black text-[#1A1A1A] dark:text-white line-clamp-1 hover:text-[#DF6400] transition-colors">
              {property.title}
            </h3>
          </Link>

          <p className="text-[11px] text-[#5C5852] dark:text-[#A8A29A] line-clamp-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#DF6400] flex-shrink-0" />
            <span>{property.locality}, {property.city}</span>
          </p>

          <div className="pt-1 flex items-center justify-between text-[11px] text-[#5C5852] dark:text-[#A8A29A] border-t border-[#1A1A1A]/5 dark:border-white/10">
            <span>{property.carpetAreaSqft.toLocaleString('en-IN')} sq.ft</span>
            <span>{property.formattedPricePerSqft}</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-3.5 pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href={`/property/${property.slug}`}
            className="w-full py-2 px-2 rounded-xl bg-[#F4F0EA] dark:bg-[#181614] hover:bg-[#DF6400] hover:text-white text-[#1A1A1A] dark:text-white text-[11px] font-bold text-center transition-all border border-transparent dark:border-white/10"
          >
            View Details
          </Link>

          <button
            type="button"
            onClick={handleEnquireClick}
            className="w-full py-2 px-2 rounded-xl bg-[#DF6400] text-white hover:bg-[#C75700] text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            <span>Enquire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
