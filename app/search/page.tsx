import React, { Suspense } from 'react';
import { Metadata } from 'next';
import SearchClient from './SearchClient';
import SearchSkeleton from '@/components/SearchSkeleton';

export const metadata: Metadata = {
  title: 'Search Properties Across India | BrokersBlitz',
  description: 'Search residential apartments, luxury villas, penthouses, commercial offices, retail shops, warehouses, and plots across India with filter options.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchClient />
    </Suspense>
  );
}
