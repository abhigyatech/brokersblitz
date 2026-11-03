import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import BrandLogo from '../../components/BrandLogo';

export const metadata: Metadata = {
  title: 'Terms of Service | BrokersBlitz',
  description: 'Terms and conditions governing the use of BrokersBlitz real estate listing and matchmaking platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white font-sans flex flex-col justify-between transition-colors duration-200">
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
            Legal Agreement
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] dark:text-white mt-2 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Last Updated: January 2026 • Applicable Pan-India
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-10 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-6 text-xs sm:text-sm text-[#5C5852] dark:text-[#A8A29A] leading-relaxed transition-colors">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              1. Nature of Platform & Role
            </h2>
            <p>
              BrokersBlitz operates strictly as an independent online listing, discovery, and communication matchmaking network. BrokersBlitz is not a registered real estate broker, agent, underwriter, escrow manager, or legal representative for any transaction executed between buyers, tenants, owners, and brokers.
            </p>
            <p>
              BrokersBlitz does not charge brokerage commissions on property transactions, does not execute conveyance deeds, and does not hold earnest money or booking deposits.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              2. Independent RERA Verification Requirement
            </h2>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-medium">
              Important: BrokersBlitz does not verify, audit, or authenticate RERA registration numbers submitted by brokers. All RERA IDs displayed on this platform are self-reported. Buyers and tenants are strictly required to independently cross-verify all details on the respective State Government RERA website before making financial commitments.
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              3. Anti-Fraud & Payment Advisory
            </h2>
            <p>
              Users must never transfer advance tokens, stamp duty fees, or inspection charges via unsecured digital channels without physical inspection and formal legal agreements drafted with certified advocates.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              4. Contact Privacy & Telemarketing Prohibition
            </h2>
            <p>
              BrokersBlitz implements contact shielding to protect brokers and buyers against telemarketing scrapers and automated unsolicited calls. Unauthorized scraping, extraction, or solicitation using contact channels facilitated by this platform is strictly prohibited and subject to civil remedies under the Information Technology Act, 2000.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              5. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed and construed in accordance with the substantive laws of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra, India.
            </p>
          </section>
        </div>
      </main>

      <footer className="w-full border-t border-[#1A1A1A]/10 dark:border-white/10 py-6 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
        &copy; 2026 BrokersBlitz. All rights reserved. • <Link href="/privacy" className="text-[#DF6400] hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}
