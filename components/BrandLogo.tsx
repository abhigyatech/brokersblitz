'use client';

import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({
  className = 'h-7 sm:h-8 w-auto object-contain',
  priority = false,
}: BrandLogoProps) {
  return (
    <span className="inline-flex items-center">
      <Image
        src="/light-logo.svg"
        alt="BrokersBlitz"
        width={160}
        height={46}
        priority={priority}
        className={`${className} dark:hidden`}
      />
      <Image
        src="/dark-logo.svg"
        alt="BrokersBlitz"
        width={160}
        height={46}
        priority={priority}
        className={`${className} hidden dark:block`}
      />
    </span>
  );
}
