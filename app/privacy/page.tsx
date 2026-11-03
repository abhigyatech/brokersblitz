import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import BrandLogo from '../../components/BrandLogo';

export const metadata: Metadata = {
  title: 'Privacy Policy | BrokersBlitz',
  description: 'Digital Personal Data Protection Policy and privacy commitments of BrokersBlitz.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white font-sans flex flex-col justify-between transition-colors">
      <header className="w-full bg-[#F4F0EA]/95 dark:bg-[#141210]/95 border-b border-[#1A1A1A]/10 dark:border-white/10 px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
          <BrandLogo className="h-7 sm:h-8 w-auto" priority />
        </Link>
        <Link href="/" className="text-xs font-bold text-[#DF6400] hover:underline">
          Back to Listings
        </Link>
      </header>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#DF6400] bg-[#DF6400]/10 px-3 py-1 rounded-full">
            Data Protection
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] dark:text-white mt-2 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Governed by the Digital Personal Data Protection Act (DPDP Act, 2023)
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-10 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-6 text-xs sm:text-sm text-[#5C5852] dark:text-[#C5BFB5] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              1. Principles of Data Fiduciary Responsibility
            </h2>
            <p>
              BrokersBlitz processes personal data strictly for specified purposes with clear consent. In accordance with the DPDP Act (2023), we uphold data minimization, purpose limitation, storage limitation, and robust security safeguards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              2. Data We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identity & Contact: Full name, verified email address, and 10-digit mobile number.</li>
              <li>Broker Credentials: Agency name, broker self-reported state RERA registration certificate number, operating metro, and office address.</li>
              <li>Operational Interactions: Property inquiries, bot-guided site visit appointments, and WhatsApp communication delivery logs.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              3. Broker Shielding & Anti-Spam Architecture
            </h2>
            <p>
              BrokersBlitz shields phone numbers to prevent cold-call harassment and unauthorized aggregator harvesting. Buyer inquiries, property brochure dispatch, and site visits occur exclusively through automated bot channels or explicit mutual scheduling.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              4. Data Principal Rights
            </h2>
            <p>
              As a Data Principal under Indian law, you possess the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request summary and details of your personal data processed by us.</li>
              <li>Request correction, completion, or updating of your personal information.</li>
              <li>Withdraw your consent and request erasure of personal data from our operational repositories.</li>
              <li>Access grievance redressal mechanisms through our designated Data Protection Officer.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              5. Grievance Officer Contact
            </h2>
            <div className="p-4 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 space-y-1 text-xs">
              <strong className="block text-[#1A1A1A] dark:text-white font-bold">Grievance Redressal Officer:</strong>
              <div>BrokersBlitz Grievance Cell</div>
              <div>Email: <span className="font-mono text-[#DF6400] font-bold">privacy@brokersblitz.in</span></div>
              <div>Headquarters: Mumbai, Maharashtra, India</div>
              <div>Response Timeline: Within 48 business hours as mandated under DPDP guidelines.</div>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full border-t border-[#1A1A1A]/10 dark:border-white/10 py-6 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
        &copy; 2026 BrokersBlitz. All rights reserved. • <Link href="/terms" className="text-[#DF6400] hover:underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
