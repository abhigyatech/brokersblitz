'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, MessageSquare } from 'lucide-react';
import initialPropertiesData from '../../../data/properties.json';
import { PropertyListing } from '../../../data/types';
import PropertyCard from '../../../components/PropertyCard';
import ShareModal from '../../../components/ShareModal';
import BlitzChatbot from '../../../components/BlitzChatbot';
import Footer from '../../../components/Footer';
import BrandLogo from '../../../components/BrandLogo';
import BrokerStoreSkeleton from '../../../components/BrokerStoreSkeleton';

function BrokerStoreInner() {
  const params = useParams();
  const storeCode = (params?.code as string)?.toLowerCase();

  const [properties, setProperties] = useState<PropertyListing[]>(
    initialPropertiesData as PropertyListing[]
  );

  const [isBrokerLocked, setIsBrokerLocked] = useState(false);
  const [remoteBrokerInfo, setRemoteBrokerInfo] = useState<any>(null);

  React.useEffect(() => {
    if (!storeCode) return;
    fetch(`/api/properties?broker=${encodeURIComponent(storeCode)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.isBrokerLocked) {
          setIsBrokerLocked(true);
        }
        if (data.brokerProfile) {
          setRemoteBrokerInfo(data.brokerProfile);
        }
        if (data.success && Array.isArray(data.properties)) {
          setProperties(data.properties);
        }
      })
      .catch(() => {});

    fetch('/api/saved')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.savedIds) && data.savedIds.length > 0) {
          setSavedPropertyIds(data.savedIds);
        }
      })
      .catch(() => {});
  }, [storeCode]);

  const brokerProperties = useMemo(() => {
    if (!storeCode) return properties;
    const bNorm = storeCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    return properties.filter((p) => {
      const pStore = (p.broker.storeCode || p.broker.id).toLowerCase().replace(/[^a-z0-9]/g, '');
      const pName = p.broker.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return pStore === bNorm || pName === bNorm || p.broker.id === storeCode;
    });
  }, [properties, storeCode]);

  const brokerInfo = brokerProperties[0]?.broker || (remoteBrokerInfo ? {
    id: storeCode,
    name: remoteBrokerInfo.name,
    storeCode: storeCode || 'broker',
    agency: remoteBrokerInfo.agency || 'Independent Broker Agency',
    reraNumber: remoteBrokerInfo.reraNumber || 'Self-Reported',
    isReraVerified: false,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    experienceYears: 10,
    totalListings: brokerProperties.length,
    rating: 4.8,
    responseTime: 'Within 30 mins',
    bio: 'Independent real estate broker on BrokersBlitz. Self-declared RERA credentials; buyers must independently verify on state portal.',
    city: remoteBrokerInfo.city || 'India',
  } : {
    id: storeCode,
    name: 'Real Estate Broker',
    storeCode: storeCode || 'partner',
    agency: 'Independent Broker Agency',
    reraNumber: 'Self-Declared ID',
    isReraVerified: false,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    experienceYears: 10,
    totalListings: brokerProperties.length,
    rating: 4.8,
    responseTime: 'Within 30 mins',
    bio: 'Independent real estate broker on BrokersBlitz. Self-declared RERA credentials; buyers must independently verify on state portal.',
    city: 'India',
  });

  const [activeTab, setActiveTab] = useState<'all' | 'sale' | 'rent'>('all');
  const [sharingProperty, setSharingProperty] = useState<PropertyListing | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSave = (propId: string) => {
    let updated: string[];
    if (savedPropertyIds.includes(propId)) {
      updated = savedPropertyIds.filter((id) => id !== propId);
      showToast('Property removed from your shortlist.');
    } else {
      updated = [...savedPropertyIds, propId];
      showToast('Property saved to your shortlist!');
    }
    setSavedPropertyIds(updated);
    try {
      localStorage.setItem('bb_saved_properties', JSON.stringify(updated));
    } catch {}

    fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: propId }),
    }).catch(() => {});
  };

  const currentStoreUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/broker/${storeCode}`
    : `https://www.brokersblitz.in/broker/${storeCode}`;

  const handleCopyStoreLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentStoreUrl);
      setCopiedStoreLink(true);
      showToast('Store link copied to clipboard!');
      setTimeout(() => setCopiedStoreLink(false), 2500);
    }
  };

  const handleShareStoreWhatsApp = () => {
    const text = `Explore our property portfolio on BrokersBlitz: ${brokerInfo.agency} (${brokerInfo.name}) - ${currentStoreUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEnquireStore = () => {
    setIsChatOpen(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('blitzbot:enquire', {
          detail: {
            brokerStoreCode: storeCode,
            brokerName: brokerInfo.name,
            brokerAgency: brokerInfo.agency,
            propertyTitle: `Broker Portfolio Consultation (${brokerInfo.agency})`,
          },
        })
      );
    }
  };

  const filteredListings = brokerProperties.filter((p) => {
    if (activeTab === 'all') return true;
    return p.purpose === activeTab;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white font-sans transition-colors duration-200">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-[#24201C] text-[#1A1A1A] dark:text-white border border-[#1A1A1A]/10 dark:border-white/10 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in duration-150">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DF6400] animate-pulse" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full bg-[#F4F0EA]/95 dark:bg-[#141210]/95 backdrop-blur-md border-b border-[#1A1A1A]/10 dark:border-white/10 px-4 sm:px-6 md:px-8 lg:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
            <BrandLogo className="h-7 sm:h-8 w-auto" priority />
          </Link>
          <span className="text-[#5C5852] dark:text-[#A8A29A] hidden sm:inline">•</span>
          <span className="text-xs font-bold text-[#1A1A1A] dark:text-white hidden sm:inline">
            Broker Profile
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEnquireStore}
            className="py-1.5 px-3 rounded-xl bg-[#DF6400] text-white text-xs font-bold hover:bg-[#C75700] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Enquire with Broker</span>
            <span className="sm:hidden">Enquire</span>
          </button>
          <button
            onClick={handleShareStoreWhatsApp}
            className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>Share WhatsApp</span>
          </button>
          <button
            onClick={handleCopyStoreLink}
            className="py-1.5 px-3 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-[#1A1A1A] dark:text-white text-xs font-bold hover:bg-[#F4F0EA] dark:hover:bg-[#1A1815] transition-colors"
          >
            {copiedStoreLink ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </header>

      {isBrokerLocked && (
        <div className="bg-rose-600 text-white px-4 py-3 text-center text-xs font-bold">
          Account Suspended: This broker profile is currently locked by platform administration. Listings are temporarily unavailable.
        </div>
      )}

      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
        <section className="w-full bg-white dark:bg-[#24201C] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1A1A1A]/10 dark:border-white/10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-brandDark/10 border-2 border-[#DF6400] flex-shrink-0">
                <Image
                  src={brokerInfo.avatar}
                  alt={brokerInfo.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white">
                    {brokerInfo.agency}
                  </h1>
                  <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Self-Reported RERA: {brokerInfo.reraNumber}
                  </span>
                </div>
                <div className="text-xs text-[#5C5852] dark:text-[#A8A29A] font-medium">
                  Advisor: <strong className="text-[#1A1A1A] dark:text-white">{brokerInfo.name}</strong> • City: {brokerInfo.city}
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F0EA] dark:bg-[#181614] text-xs font-mono font-semibold text-[#1A1A1A] dark:text-white border border-[#1A1A1A]/10 dark:border-white/10">
                  <span className="text-[#DF6400] font-bold">Store Link:</span>
                  <span>brokersblitz.in/broker/{storeCode}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center sm:text-right border-t md:border-t-0 pt-4 md:pt-0 dark:border-white/10">
              <div className="p-3 bg-[#F4F0EA]/60 dark:bg-[#181614] rounded-2xl border border-[#1A1A1A]/5 dark:border-white/10">
                <div className="text-lg font-black text-[#1A1A1A] dark:text-white">{brokerProperties.length}</div>
                <div className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Properties</div>
              </div>
              <div className="p-3 bg-[#F4F0EA]/60 dark:bg-[#181614] rounded-2xl border border-[#1A1A1A]/5 dark:border-white/10">
                <div className="text-lg font-black text-[#1A1A1A] dark:text-white">{brokerInfo.experienceYears}+ Yrs</div>
                <div className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Experience</div>
              </div>
              <div className="p-3 bg-[#F4F0EA]/60 dark:bg-[#181614] rounded-2xl border border-[#1A1A1A]/5 dark:border-white/10">
                <div className="text-lg font-black text-amber-500 flex items-center justify-center sm:justify-end gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
                  <span>{brokerInfo.rating}</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-[#5C5852] dark:text-[#A8A29A]">Rating</div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5C5852] dark:text-[#A8A29A] gap-2">
            <p className="max-w-3xl leading-relaxed">
              {brokerInfo.bio}
            </p>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px]">
              Buyers must independently cross-check this broker&apos;s RERA certificate on the state portal.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
                Listings by {brokerInfo.agency}
              </h2>
              <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-0.5">
                Showing {filteredListings.length} properties
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/10 p-0.5 shadow-sm text-xs font-bold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all' ? 'bg-[#DF6400] text-white' : 'text-[#1A1A1A] dark:text-white hover:text-[#DF6400]'
                }`}
              >
                All ({brokerProperties.length})
              </button>
              <button
                onClick={() => setActiveTab('sale')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'sale' ? 'bg-[#DF6400] text-white' : 'text-[#1A1A1A] dark:text-white hover:text-[#DF6400]'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setActiveTab('rent')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'rent' ? 'bg-[#DF6400] text-white' : 'text-[#1A1A1A] dark:text-white hover:text-[#DF6400]'
                }`}
              >
                Rent
              </button>
            </div>
          </div>

          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {filteredListings.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isSaved={savedPropertyIds.includes(prop.id)}
                  onShare={(p) => setSharingProperty(p)}
                  onToggleSave={handleToggleSave}
                  onEnquire={(p) => {
                    setIsChatOpen(true);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('blitzbot:enquire', {
                          detail: {
                            propertyId: p.id,
                            propertyTitle: p.title,
                            propertyPrice: p.formattedPrice,
                            propertyLocality: p.locality,
                            propertyCity: p.city,
                            brokerStoreCode: storeCode,
                            brokerName: brokerInfo.name,
                            brokerAgency: brokerInfo.agency,
                          },
                        })
                      );
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#24201C] rounded-3xl p-10 text-center border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm">
              <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white">No listings in this category</h3>
              <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">Check back soon or view all properties listed by this broker.</p>
            </div>
          )}
        </section>
      </main>

      <ShareModal
        property={sharingProperty}
        onClose={() => setSharingProperty(null)}
      />

      <BlitzChatbot
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      <Footer
        onSelectCity={() => {}}
      />
    </div>
  );
}

export default function BrokerStorePage() {
  return (
    <Suspense fallback={<BrokerStoreSkeleton />}>
      <BrokerStoreInner />
    </Suspense>
  );
}
