import { MetadataRoute } from 'next';
import { getAllProperties } from '@/lib/db/properties-store';
import { getAllBrokers } from '@/lib/auth/user-store';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.brokersblitz.in';
  const currentDate = new Date().toISOString();

  const cities = ['mumbai', 'bengaluru', 'delhi-ncr', 'pune', 'hyderabad', 'goa'];
  const categories = ['apartment', 'villa', 'commercial-office', 'retail-shop', 'residential-plot'];

  const properties = getAllProperties();
  const propertyUrls = properties.map((p) => ({
    url: `${baseUrl}/property/${p.slug}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  const cityUrls = cities.map((city) => ({
    url: `${baseUrl}/search?city=${encodeURIComponent(city)}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/search?category=${encodeURIComponent(cat)}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const brokers = getAllBrokers();
  const brokerUrls = brokers.map((b) => ({
    url: `${baseUrl}/broker/${b.storeCode || (b.agencyName || b.fullName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    lastModified: currentDate,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/brokers`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    ...propertyUrls,
    ...brokerUrls,
    ...cityUrls,
    ...categoryUrls,
  ];
}
