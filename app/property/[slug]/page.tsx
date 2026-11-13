import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAllProperties, getPropertyBySlug } from '@/lib/db/properties-store';
import PropertyDetailClient from './PropertyDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const properties = await getAllProperties();
  if (properties.length === 0) {
    return [{ slug: '_placeholder' }];
  }
  return properties.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug === '_placeholder') {
    return { title: 'Property Not Found | BrokersBlitz' };
  }

  const property = await getPropertyBySlug(slug);

  if (!property) {
    return { title: 'Property Not Found | BrokersBlitz' };
  }

  const title = `${property.title} | ${property.locality}, ${property.city}`;
  const desc = `${property.formattedPrice} • ${property.categoryLabel} in ${property.locality}, ${property.city}. RERA Reg: ${property.reraId} (Broker declared). ${property.description.slice(0, 150)}...`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: property.primaryImage ? [{ url: property.primaryImage, width: 1200, height: 630, alt: property.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: property.primaryImage ? [property.primaryImage] : [],
    },
    alternates: {
      canonical: `https://www.brokersblitz.in/property/${property.slug}`,
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  if (!slug || slug === '_placeholder') {
    notFound();
  }

  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const properties = await getAllProperties();
  const related = properties
    .filter((p) => p.city === property.city && p.id !== property.id)
    .slice(0, 4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `https://www.brokersblitz.in/property/${property.slug}`,
    image: [property.primaryImage, ...(property.additionalImages || [])].filter(Boolean),
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.locality,
      addressRegion: property.city,
      postalCode: property.pincode,
      addressCountry: 'IN',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailClient property={property} relatedProperties={related} />
    </>
  );
}
