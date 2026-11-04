import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import BrandLogo from '../../components/BrandLogo';
import { ShieldCheck, Lock, FileText, CheckCircle, Scale, Download, UserX } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | DPDP Act 2023 & GDPR Compliance | BrokersBlitz',
  description: 'Digital Personal Data Protection Act (DPDP Act 2023) and GDPR compliance policy of BrokersBlitz.',
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#DF6400] bg-[#DF6400]/10 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              DPDP Act 2023 & GDPR Compliance
            </span>
            <span className="text-[11px] font-mono text-[#5C5852] dark:text-[#A8A29A]">
              Governed under Indian Statutory Law
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] dark:text-white mt-3 tracking-tight">
            Digital Personal Data Protection & Privacy Policy
          </h1>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1.5">
            Strictly formulated under the Digital Personal Data Protection Act, 2023 (DPDP Act, Act No. 22 of 2023), the Information Technology Act, 2000, and aligned with global General Data Protection Regulation (GDPR) standards.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-10 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-7 text-xs sm:text-sm text-[#5C5852] dark:text-[#C5BFB5] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#DF6400]" />
              1. Fiduciary Identification & Legal Framework
            </h2>
            <p>
              BrokersBlitz Technologies Pvt. Ltd. operates as a <strong>Data Fiduciary</strong> under Section 2(i) of the Digital Personal Data Protection Act, 2023. We determine the purpose and means of processing personal data provided by real estate buyers, sellers, tenants, and verified property brokers across India.
            </p>
            <p>
              This Policy details our compliance with the DPDP Act (2023), the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the European Union General Data Protection Regulation (GDPR) principles of transparency, fairness, and accountability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#DF6400]" />
              2. Consent Architecture & Lawful Grounds
            </h2>
            <p>
              In strict adherence to Section 6 of the DPDP Act, personal data is processed solely on the basis of <strong>free, specific, informed, unconditional, and unambiguous consent</strong>, manifested through an affirmative action during account registration or bot inquiry.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Consent is never bundled, pre-ticked, or coerced as a condition for non-essential browsing.</li>
              <li>Data Principals may withdraw consent at any time through our self-service Privacy Center or by writing to our Data Protection Officer.</li>
              <li>Withdrawal of consent terminates further processing and triggers statutory data erasure protocols.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              3. Data Collected & Specified Purposes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 space-y-1">
                <strong className="text-xs font-bold text-[#1A1A1A] dark:text-white block">Identity & Contact Data</strong>
                <p className="text-[11px]">Full Name, verified Email Address, and 10-digit WhatsApp/mobile number for transactional property alerts and scheduled visits.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 space-y-1">
                <strong className="text-xs font-bold text-[#1A1A1A] dark:text-white block">Professional Broker Data</strong>
                <p className="text-[11px]">Agency name, operating city, experience, and self-reported state RERA registration certificate number.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 space-y-1">
                <strong className="text-xs font-bold text-[#1A1A1A] dark:text-white block">Financial & Billing Records</strong>
                <p className="text-[11px]">Razorpay transaction reference IDs, recharge invoices, cryptographic wallet ledger entries, and promotional grant validity.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 space-y-1">
                <strong className="text-xs font-bold text-[#1A1A1A] dark:text-white block">Communication & Bot Logs</strong>
                <p className="text-[11px]">Property requirements, budget configuration, locality searches, and audio transcripts processed for voice-to-listing creation.</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#DF6400]" />
              4. Data Principal Rights (DPDP Act & GDPR Alignment)
            </h2>
            <p>
              Every user registered on BrokersBlitz is recognized as a <strong>Data Principal</strong> endowed with statutory rights enforceable under Indian law and GDPR:
            </p>
            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-xl border border-[#1A1A1A]/10 dark:border-white/10 flex items-start gap-3">
                <Download className="w-4 h-4 text-[#DF6400] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-bold text-[#1A1A1A] dark:text-white block">Right to Access & Data Portability (Sec 11 DPDP & Art 15/20 GDPR)</strong>
                  <p className="text-[11px]">Download an exhaustive, machine-readable JSON archive of all personal data, listings, and financial records processed by us at any time directly from your dashboard.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#1A1A1A]/10 dark:border-white/10 flex items-start gap-3">
                <FileText className="w-4 h-4 text-[#DF6400] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-bold text-[#1A1A1A] dark:text-white block">Right to Correction & Updating (Sec 12 DPDP & Art 16 GDPR)</strong>
                  <p className="text-[11px]">Correct misleading, inaccurate, or outdated personal contact numbers, agency credentials, or property listings immediately through your account.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#1A1A1A]/10 dark:border-white/10 flex items-start gap-3">
                <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-bold text-[#1A1A1A] dark:text-white block">Right to Erasure & Deletion (Sec 12 DPDP & Art 17 GDPR)</strong>
                  <p className="text-[11px]">Execute complete account and personal data erasure using our secure two-step verification mechanism. Once confirmed, all identifiers are permanently purged or anonymized.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              5. Broker Shielding & Telemarketing Protection
            </h2>
            <p>
              To eliminate unsolicited cold-calling, phone numbers are masked and protected behind automated bot workflows. Raw contact information is never published publicly to third-party web scrapers or aggregator bots.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              6. Storage Limitation & Data Retention Rules
            </h2>
            <p>
              Personal data is retained only for the duration necessary to satisfy the purpose for which it was collected or to comply with statutory accounting and regulatory obligations:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Active listing data: Retained while the listing remains active or until deleted by the broker.</li>
              <li>Financial ledger checksums: Maintained for statutory tax and audit verification as required under Indian financial laws.</li>
              <li>Communication sessions: Automatically purged after 90 days of conversation inactivity.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-white">
              7. Grievance Redressal & Data Protection Officer (DPO)
            </h2>
            <p>
              Pursuant to Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules, 2021, and Section 13 of the DPDP Act 2023, the designated Grievance Officer and Data Protection Officer details are provided below:
            </p>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 space-y-1.5 text-xs">
              <div className="font-bold text-sm text-[#1A1A1A] dark:text-white">Grievance & Data Protection Officer</div>
              <div><strong>Name:</strong> Officer, Legal & Privacy Compliance Cell</div>
              <div><strong>Entity:</strong> BrokersBlitz Technologies Pvt. Ltd.</div>
              <div><strong>Corporate Address:</strong> Express Towers, Nariman Point, Mumbai, Maharashtra 400021, India</div>
              <div><strong>Official Email:</strong> <span className="font-mono text-[#DF6400] font-bold">grievance@brokersblitz.in</span> / <span className="font-mono text-[#DF6400] font-bold">privacy@brokersblitz.in</span></div>
              <div><strong>Acknowledgment:</strong> Within 24 hours of grievance receipt.</div>
              <div><strong>Resolution Timeline:</strong> Within 15 business days (well within the statutory 30-day limit).</div>
              <div className="pt-2 text-[11px] text-[#5C5852] dark:text-[#A8A29A]">
                If unresolved, Data Principals possess the statutory right to file a complaint before the <strong>Data Protection Board of India (DPBI)</strong> under Section 13(3) of the DPDP Act, 2023.
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full border-t border-[#1A1A1A]/10 dark:border-white/10 py-6 text-center text-xs text-[#5C5852] dark:text-[#A8A29A]">
        &copy; 2026 BrokersBlitz Technologies Pvt. Ltd. All rights reserved. • <Link href="/terms" className="text-[#DF6400] hover:underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
