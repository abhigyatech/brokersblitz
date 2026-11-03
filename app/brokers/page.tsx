import React, { Suspense } from 'react';
import { Metadata } from 'next';
import BrokersClient from './BrokersClient';
import BrokersDirectorySkeleton from '@/components/BrokersDirectorySkeleton';
import { getAllUsers } from '@/lib/auth/user-store';
import { getAllProperties } from '@/lib/db/properties-store';

export const metadata: Metadata = {
  title: 'Verified Real Estate Broker Stores Across India | BrokersBlitz',
  description: 'Explore certified real estate agencies, broker storefronts, and direct inventory by location across Mumbai, Bengaluru, Delhi NCR, Pune, Hyderabad, Goa, and Chennai.',
  openGraph: {
    title: 'Verified Real Estate Broker Stores Across India | BrokersBlitz',
    description: 'Explore certified real estate agencies, broker storefronts, and direct inventory by location across Mumbai, Bengaluru, Delhi NCR, Pune, Hyderabad, Goa, and Chennai.',
  },
};

export default function BrokersPage() {
  const allUsers = getAllUsers();
  const allProps = getAllProperties();

  const brokerUsers = allUsers.filter(
    (u) => u.role === 'broker' && !u.isLocked
  );

  const initialBrokers = brokerUsers.map((b) => {
    const storeCode = (
      b.storeCode ||
      b.agencyName ||
      b.fullName
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const normalizedCode = storeCode.replace(/[^a-z0-9]/g, '');
    const normalizedName = b.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const brokerProps = allProps.filter((p) => {
      const pCode = (p.broker.storeCode || p.broker.id)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const pBrokerName = p.broker.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        pCode === normalizedCode ||
        pBrokerName === normalizedName ||
        p.broker.id === b.id
      );
    });

    const matchedProp = brokerProps[0];
    const avatar =
      b.avatar ||
      matchedProp?.broker.avatar ||
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80';

    const operatingCity =
      b.operatingCity || matchedProp?.city || matchedProp?.broker.city || 'Pan India';

    const localitiesSet = new Set<string>();
    const specializationsSet = new Set<string>();

    brokerProps.forEach((p) => {
      if (p.locality) localitiesSet.add(p.locality);
      if (p.categoryLabel) specializationsSet.add(p.categoryLabel);
      if (p.category) {
        if (p.category.includes('commercial') || p.category.includes('office') || p.category.includes('retail')) {
          specializationsSet.add('Commercial & Retail');
        } else if (p.category.includes('villa') || p.category.includes('penthouse')) {
          specializationsSet.add('Luxury Residences');
        } else if (p.category.includes('plot') || p.category.includes('land')) {
          specializationsSet.add('Plots & Land');
        } else {
          specializationsSet.add('Residential Apartments');
        }
      }
    });

    if (specializationsSet.size === 0) {
      specializationsSet.add('Residential & Commercial');
    }

    const bio =
      matchedProp?.broker.bio ||
      `Verified real estate advisor with ${b.experienceYears || 10}+ years of proven transactional expertise across ${operatingCity}.`;

    const rating = matchedProp?.broker.rating || 4.9;
    const reraNumber = b.reraNumber || matchedProp?.broker.reraNumber || 'Applied (Self-declared)';

    return {
      id: b.id,
      fullName: b.fullName,
      agencyName: b.agencyName || `${b.fullName} Realty`,
      storeCode,
      operatingCity,
      reraNumber,
      experienceYears: b.experienceYears || 10,
      avatar,
      phone: b.phone,
      email: b.email,
      bio,
      rating,
      totalListings: brokerProps.length,
      localities: Array.from(localitiesSet),
      specializations: Array.from(specializationsSet),
      recentListings: brokerProps.slice(0, 3).map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        formattedPrice: p.formattedPrice,
        categoryLabel: p.categoryLabel,
        locality: p.locality,
        city: p.city,
        primaryImage: p.primaryImage,
      })),
    };
  });

  return (
    <Suspense fallback={<BrokersDirectorySkeleton />}>
      <BrokersClient initialBrokers={initialBrokers} />
    </Suspense>
  );
}

