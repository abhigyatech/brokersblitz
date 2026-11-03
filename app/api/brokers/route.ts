import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/auth/user-store';
import { getAllProperties } from '@/lib/db/properties-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get('city');
    const queryParam = searchParams.get('q');
    const specParam = searchParams.get('specialization');
    const minExpParam = searchParams.get('minExp');

    const allUsers = getAllUsers();
    const allProps = getAllProperties();

    const brokerUsers = allUsers.filter(
      (u) => u.role === 'broker' && !u.isLocked
    );

    const brokerStores = brokerUsers.map((b) => {
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

    let filtered = brokerStores;

    if (cityParam && cityParam !== 'Pan India' && cityParam !== 'All India') {
      const c = cityParam.toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.operatingCity.toLowerCase() === c ||
          b.operatingCity.toLowerCase().includes(c) ||
          c.includes(b.operatingCity.toLowerCase())
      );
    }

    if (queryParam && queryParam.trim()) {
      const q = queryParam.toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.agencyName.toLowerCase().includes(q) ||
          b.fullName.toLowerCase().includes(q) ||
          b.operatingCity.toLowerCase().includes(q) ||
          b.reraNumber.toLowerCase().includes(q) ||
          b.localities.some((loc) => loc.toLowerCase().includes(q)) ||
          b.specializations.some((spec) => spec.toLowerCase().includes(q))
      );
    }

    if (specParam && specParam !== 'all') {
      const s = specParam.toLowerCase();
      filtered = filtered.filter((b) =>
        b.specializations.some((spec) => spec.toLowerCase().includes(s))
      );
    }

    if (minExpParam) {
      const exp = parseInt(minExpParam, 10);
      if (!isNaN(exp)) {
        filtered = filtered.filter((b) => b.experienceYears >= exp);
      }
    }

    const availableCities = Array.from(
      new Set(brokerStores.map((b) => b.operatingCity))
    ).sort();

    return NextResponse.json({
      success: true,
      totalBrokers: filtered.length,
      availableCities,
      brokers: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to retrieve broker stores' },
      { status: 500 }
    );
  }
}

