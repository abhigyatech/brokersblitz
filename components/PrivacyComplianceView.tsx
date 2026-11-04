'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface PrivacyComplianceViewProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  } | null;
  onToast: (msg: string) => void;
  onTriggerErasure: () => void;
  onDownloadData: () => void;
}

export default function PrivacyComplianceView({
  currentUser,
  onToast,
  onTriggerErasure,
  onDownloadData,
}: PrivacyComplianceViewProps) {
  const maskedPhone = currentUser?.phone
    ? currentUser.phone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2')
    : 'Not available';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Privacy & Data Principal Rights
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              DPDP Act 2023
            </span>
          </div>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Exercise your statutory rights under India&apos;s Digital Personal Data Protection Act, 2023 and aligned GDPR principles.
          </p>
        </div>

        <Link
          href="/privacy"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1A1A1A]/10 dark:border-white/10 text-xs font-bold text-[#DF6400] hover:underline"
        >
          <span>Read Full Policy</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-7 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <ShieldCheck className="w-5 h-5 text-[#DF6400]" />
          <div>
            <h3 className="text-base font-black text-[#1A1A1A] dark:text-white">
              Data Principal Consent & Processing Status
            </h3>
            <span className="text-xs text-[#5C5852] dark:text-[#A8A29A]">
              Processed lawfully under Section 6 of the DPDP Act, 2023
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10">
            <span className="text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] block">
              Consent State
            </span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Affirmative & Active</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10">
            <span className="text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] block">
              Shielded Contact
            </span>
            <div className="text-sm font-bold font-mono text-[#1A1A1A] dark:text-white mt-0.5">
              {maskedPhone}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10">
            <span className="text-[10px] font-mono uppercase font-bold text-[#5C5852] dark:text-[#A8A29A] block">
              Data Fiduciary
            </span>
            <div className="text-sm font-bold text-[#1A1A1A] dark:text-white mt-0.5">
              BrokersBlitz Technologies
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#DF6400]/10 text-[#DF6400] flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Right to Access & Portability
            </h3>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
              Under Section 11 of the DPDP Act 2023 and GDPR Article 20, you are entitled to download a complete, structured JSON archive of all your personal data, listings, wallet transactions, and enquiries.
            </p>
          </div>

          <button
            type="button"
            onClick={onDownloadData}
            className="w-full py-3 px-4 rounded-xl bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 hover:border-[#DF6400] text-xs font-bold text-[#1A1A1A] dark:text-white transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-[#DF6400]" />
            <span>Download My Personal Data (.JSON)</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 border border-rose-500/20 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-[#1A1A1A] dark:text-white tracking-tight">
              Right to Erasure & Deletion
            </h3>
            <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] leading-relaxed">
              Under Section 12 of the DPDP Act 2023 and GDPR Article 17, you have the right to permanently erase your account, contact details, and listings from our active servers. Protected with 2-step verification.
            </p>
          </div>

          <button
            type="button"
            onClick={onTriggerErasure}
            className="w-full py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-600 hover:text-white text-xs font-bold text-rose-700 dark:text-rose-400 transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account & Erase Personal Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-5 sm:p-6 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#DF6400]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white">
            Statutory Grievance Redressal (Section 13, DPDP Act 2023)
          </h4>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/10 dark:border-white/10 text-xs text-[#5C5852] dark:text-[#A8A29A] space-y-1">
          <div><strong>Designated Officer:</strong> Grievance Redressal Cell, BrokersBlitz Technologies Pvt. Ltd.</div>
          <div><strong>Contact Email:</strong> <span className="font-mono text-[#DF6400] font-bold">grievance@brokersblitz.in</span></div>
          <div><strong>Headquarters:</strong> Express Towers, Nariman Point, Mumbai, MH 400021, India</div>
          <div><strong>Response Timeline:</strong> Acknowledgment within 24 hours, resolution within 15 business days.</div>
        </div>
      </div>
    </div>
  );
}

