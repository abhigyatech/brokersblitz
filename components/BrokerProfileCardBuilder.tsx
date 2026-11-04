'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Sparkles,
  Palette,
  Layers,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Award,
} from 'lucide-react';
import { generateWhatsAppQRMatrix } from '../lib/qr';

export type CardTheme = 'obsidian_gold' | 'signature_sunset' | 'executive_white' | 'royal_emerald';
export type CardLayout = 'landscape' | 'portrait';

interface BrokerProfileCardBuilderProps {
  broker: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    agencyName?: string;
    storeCode?: string;
    reraNumber?: string;
    operatingCity?: string;
    experienceYears?: number;
  };
  onToast?: (msg: string) => void;
}

export default function BrokerProfileCardBuilder({ broker, onToast }: BrokerProfileCardBuilderProps) {
  const [theme, setTheme] = useState<CardTheme>('obsidian_gold');
  const [layout, setLayout] = useState<CardLayout>('landscape');
  const [title, setTitle] = useState('Certified Real Estate Partner');
  const [slogan, setSlogan] = useState('Direct Verified Properties • Transparent Brokerage');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [showRera, setShowRera] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cleanStoreCode = broker.storeCode || broker.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const storefrontUrl = `https://brokersblitz.in/broker/${cleanStoreCode}`;

  const qrMatrix = useMemo(() => {
    try {
      return generateWhatsAppQRMatrix(storefrontUrl);
    } catch {
      return generateWhatsAppQRMatrix(`https://brokersblitz.in`);
    }
  }, [storefrontUrl]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        if (onToast) onToast('Logo file size must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
          if (onToast) onToast('Custom brand logo applied!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyStorefront = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopiedLink(true);
    if (onToast) onToast('Storefront link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHighResPNG = async () => {
    try {
      setIsExporting(true);
      if (onToast) onToast('Rendering print-ready 300 DPI business card...');

      const canvas = document.createElement('canvas');
      const isLandscape = layout === 'landscape';

      const width = isLandscape ? 2100 : 1600;
      const height = isLandscape ? 1200 : 2000;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (theme === 'obsidian_gold') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#141311');
        bgGrad.addColorStop(0.5, '#0A0A09');
        bgGrad.addColorStop(1, '#1A1815');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(45, 45, width - 90, height - 90);
      } else if (theme === 'signature_sunset') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#DF6400');
        bgGrad.addColorStop(0.4, '#B34A00');
        bgGrad.addColorStop(1, '#1E1B17');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 12;
        ctx.strokeRect(30, 30, width - 60, height - 60);
      } else if (theme === 'royal_emerald') {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#064E3B');
        bgGrad.addColorStop(0.6, '#022C22');
        bgGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, width - 60, height - 60);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#DF6400';
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.strokeRect(45, 45, width - 90, height - 90);
      }

      const isDark = theme !== 'executive_white';
      const primaryTextColor = isDark ? '#FFFFFF' : '#1A1A1A';
      const secondaryTextColor = isDark ? '#D1D5DB' : '#4B5563';
      const accentColor = theme === 'obsidian_gold' ? '#D4AF37' : theme === 'royal_emerald' ? '#FCD34D' : '#DF6400';

      if (isLandscape) {
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('BROKERSBLITZ VERIFIED PARTNER', 100, 140);

        ctx.fillStyle = primaryTextColor;
        ctx.font = '900 78px sans-serif';
        ctx.fillText(broker.fullName, 100, 240);

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(broker.agencyName || 'Independent Real Estate Advisory', 100, 310);

        ctx.fillStyle = secondaryTextColor;
        ctx.font = '500 34px sans-serif';
        ctx.fillText(title, 100, 370);

        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(100, 420);
        ctx.lineTo(1300, 420);
        ctx.stroke();

        let currentY = 490;
        if (showRera && broker.reraNumber) {
          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 32px monospace';
          ctx.fillText(`✓ RERA: ${broker.reraNumber}`, 100, currentY);
          currentY += 60;
        }

        if (showPhone && broker.phone) {
          ctx.fillStyle = primaryTextColor;
          ctx.font = 'bold 36px monospace';
          ctx.fillText(`📞 +91 ${broker.phone}`, 100, currentY);
          currentY += 60;
        }

        if (showEmail && broker.email) {
          ctx.fillStyle = secondaryTextColor;
          ctx.font = '32px sans-serif';
          ctx.fillText(`✉️ ${broker.email}`, 100, currentY);
          currentY += 60;
        }

        if (broker.operatingCity) {
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText(`📍 Operating City: ${broker.operatingCity}`, 100, currentY);
        }

        ctx.fillStyle = isDark ? '#9CA3AF' : '#6B7280';
        ctx.font = 'italic 30px sans-serif';
        ctx.fillText(`"${slogan}"`, 100, 1080);

        const qrBoxSize = 520;
        const qrBoxX = 1440;
        const qrBoxY = 280;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrBoxX - 30, qrBoxY - 30, qrBoxSize + 60, qrBoxSize + 60, 36);
        ctx.fill();

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 8;
        ctx.stroke();

        const matrixSize = qrMatrix.length;
        const cellSize = qrBoxSize / matrixSize;

        ctx.fillStyle = '#0F172A';
        for (let r = 0; r < matrixSize; r++) {
          for (let c = 0; c < matrixSize; c++) {
            if (qrMatrix[r][c]) {
              ctx.fillRect(qrBoxX + c * cellSize, qrBoxY + r * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
          }
        }

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN FOR DIGITAL STOREFRONT', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 80);

        ctx.fillStyle = isDark ? '#FFFFFF' : '#1A1A1A';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`brokersblitz.in/broker/${cleanStoreCode}`, qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 125);
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'center';

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 38px sans-serif';
        ctx.fillText('BROKERSBLITZ VERIFIED PARTNER', width / 2, 160);

        ctx.fillStyle = primaryTextColor;
        ctx.font = '900 84px sans-serif';
        ctx.fillText(broker.fullName, width / 2, 270);

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 46px sans-serif';
        ctx.fillText(broker.agencyName || 'Independent Real Estate Advisory', width / 2, 350);

        ctx.fillStyle = secondaryTextColor;
        ctx.font = '500 36px sans-serif';
        ctx.fillText(title, width / 2, 420);

        const qrBoxSize = 700;
        const qrBoxX = (width - qrBoxSize) / 2;
        const qrBoxY = 520;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrBoxX - 35, qrBoxY - 35, qrBoxSize + 70, qrBoxSize + 70, 42);
        ctx.fill();

        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 10;
        ctx.stroke();

        const matrixSize = qrMatrix.length;
        const cellSize = qrBoxSize / matrixSize;

        ctx.fillStyle = '#0F172A';
        for (let r = 0; r < matrixSize; r++) {
          for (let c = 0; c < matrixSize; c++) {
            if (qrMatrix[r][c]) {
              ctx.fillRect(qrBoxX + c * cellSize, qrBoxY + r * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
          }
        }

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('SCAN TO VIEW VERIFIED PROPERTIES', width / 2, qrBoxY + qrBoxSize + 90);

        ctx.fillStyle = primaryTextColor;
        ctx.font = 'bold 32px monospace';
        ctx.fillText(`brokersblitz.in/broker/${cleanStoreCode}`, width / 2, qrBoxY + qrBoxSize + 145);

        let currentY = 1520;
        if (showRera && broker.reraNumber) {
          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 38px monospace';
          ctx.fillText(`✓ RERA: ${broker.reraNumber}`, width / 2, currentY);
          currentY += 75;
        }

        if (showPhone && broker.phone) {
          ctx.fillStyle = primaryTextColor;
          ctx.font = 'bold 42px monospace';
          ctx.fillText(`📞 +91 ${broker.phone}`, width / 2, currentY);
          currentY += 75;
        }

        if (showEmail && broker.email) {
          ctx.fillStyle = secondaryTextColor;
          ctx.font = '36px sans-serif';
          ctx.fillText(`✉️ ${broker.email}`, width / 2, currentY);
          currentY += 75;
        }

        ctx.fillStyle = isDark ? '#9CA3AF' : '#6B7280';
        ctx.font = 'italic 32px sans-serif';
        ctx.fillText(`"${slogan}"`, width / 2, 1880);

        ctx.textAlign = 'left';
      }

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = dataUrl;
      downloadAnchor.download = `${broker.fullName.replace(/\s+/g, '_')}_BrokersBlitz_PrintCard_300DPI.png`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      if (onToast) onToast('High-Res 300 DPI card downloaded successfully!');
    } catch {
      if (onToast) onToast('Failed to export card image');
    } finally {
      setIsExporting(false);
    }
  };

  const getThemeBgClass = () => {
    switch (theme) {
      case 'obsidian_gold':
        return 'bg-gradient-to-br from-[#161412] via-[#0B0A09] to-[#1E1B17] text-white border-2 border-[#D4AF37]/60 shadow-2xl';
      case 'signature_sunset':
        return 'bg-gradient-to-br from-[#DF6400] via-[#C75700] to-[#1E1B17] text-white border-2 border-white/30 shadow-2xl';
      case 'royal_emerald':
        return 'bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F172A] text-white border-2 border-amber-300/60 shadow-2xl';
      case 'executive_white':
        return 'bg-white text-[#1A1A1A] border-2 border-[#DF6400] shadow-2xl';
    }
  };

  const getAccentColorClass = () => {
    switch (theme) {
      case 'obsidian_gold':
        return 'text-[#D4AF37]';
      case 'signature_sunset':
        return 'text-amber-200';
      case 'royal_emerald':
        return 'text-amber-300';
      case 'executive_white':
        return 'text-[#DF6400]';
    }
  };

  const isDarkTheme = theme !== 'executive_white';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
              High-Resolution Printable Profile Cards
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#DF6400]/10 text-[#DF6400] border border-[#DF6400]/20">
              300 DPI Print Ready
            </span>
          </div>
          <p className="text-xs text-[#5C5852] dark:text-[#A8A29A] mt-1">
            Generate and download ultra-sharp, RERA-verified business cards with your personalized vector QR code for print and WhatsApp marketing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 hover:border-[#DF6400] text-xs font-bold text-[#1A1A1A] dark:text-white transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#DF6400]" />
            <span>Print Card</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHighResPNG}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-[#DF6400] hover:bg-[#C75700] text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#DF6400]/25 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : 'Download 300 DPI PNG'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white dark:bg-[#1E1B17] rounded-3xl p-5 sm:p-6 border border-[#1A1A1A]/10 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1A1A1A]/10 dark:border-white/10">
            <Palette className="w-4 h-4 text-[#DF6400]" />
            <h3 className="text-sm font-black text-[#1A1A1A] dark:text-white uppercase tracking-wider">
              Card Customizer & Brand Styles
            </h3>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
              Luxury Palette Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('obsidian_gold')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 text-left ${
                  theme === 'obsidian_gold'
                    ? 'border-[#D4AF37] bg-[#141210] text-[#D4AF37] ring-1 ring-[#D4AF37]'
                    : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] hover:bg-[#F4F0EA]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#141210] shrink-0" />
                <span>Obsidian Gold</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('signature_sunset')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 text-left ${
                  theme === 'signature_sunset'
                    ? 'border-[#DF6400] bg-[#DF6400]/10 text-[#DF6400] ring-1 ring-[#DF6400]'
                    : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] hover:bg-[#F4F0EA]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#DF6400] shrink-0" />
                <span>Signature Sunset</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('royal_emerald')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 text-left ${
                  theme === 'royal_emerald'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 ring-1 ring-emerald-500'
                    : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] hover:bg-[#F4F0EA]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#064E3B] shrink-0" />
                <span>Royal Emerald</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('executive_white')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 text-left ${
                  theme === 'executive_white'
                    ? 'border-[#DF6400] bg-stone-100 text-[#1A1A1A] ring-1 ring-[#DF6400]'
                    : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852] hover:bg-[#F4F0EA]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white border border-stone-300 shrink-0" />
                <span>Executive White</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white">
              Card Aspect & Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLayout('landscape')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  layout === 'landscape'
                    ? 'border-[#DF6400] bg-[#DF6400]/10 text-[#DF6400]'
                    : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Landscape (3.5&quot; x 2&quot;)</span>
              </button>

              <button
                type="button"
                onClick={() => setLayout('portrait')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  layout === 'portrait'
                    ? 'border-[#DF6400] bg-[#DF6400]/10 text-[#DF6400]'
                    : 'border-[#1A1A1A]/10 dark:border-white/10 text-[#5C5852]'
                }`}
              >
                <Layers className="w-4 h-4 rotate-90" />
                <span>Portrait Standee</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                Professional Title / Role
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Principal Property Consultant"
                className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="e.g. Direct Verified Properties • Transparent Brokerage"
                className="w-full bg-[#F4F0EA] dark:bg-[#141210] border border-[#1A1A1A]/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#1A1A1A] dark:text-white outline-none focus:ring-1 focus:ring-[#DF6400]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#1A1A1A]/10 dark:border-white/10">
            <span className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1.5">
              Toggle Badges & Identifiers
            </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-[#1A1A1A] dark:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showRera}
                  onChange={(e) => setShowRera(e.target.checked)}
                  className="accent-[#DF6400] w-4 h-4 rounded"
                />
                <span>Display Verified RERA Certificate Badge</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#1A1A1A] dark:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="accent-[#DF6400] w-4 h-4 rounded"
                />
                <span>Display Contact Number</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#1A1A1A] dark:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="accent-[#DF6400] w-4 h-4 rounded"
                />
                <span>Display Official Email Address</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1A1A1A]/10 dark:border-white/10 space-y-2">
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Custom Agency Logo (Optional)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 py-2 px-3 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] border border-dashed border-[#1A1A1A]/20 dark:border-white/20 hover:border-[#DF6400] text-xs text-[#5C5852] dark:text-[#A8A29A] cursor-pointer flex items-center justify-center gap-2 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{customLogoUrl ? 'Change Logo Image' : 'Upload PNG / SVG Logo'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {customLogoUrl && (
                <button
                  type="button"
                  onClick={() => setCustomLogoUrl('')}
                  className="px-2.5 py-2 rounded-xl text-[11px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-stone-200/50 dark:bg-black/30 rounded-3xl p-4 sm:p-8 flex items-center justify-center border border-[#1A1A1A]/10 dark:border-white/10 min-h-[460px]">
            <div
              ref={cardRef}
              className={`w-full max-w-xl rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 ${getThemeBgClass()} ${
                layout === 'portrait' ? 'max-w-sm aspect-[4/5]' : 'aspect-[1.75/1]'
              }`}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-white/10 to-transparent pointer-events-none rounded-full blur-2xl" />

              {layout === 'landscape' ? (
                <div className="h-full flex flex-col justify-between relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${getAccentColorClass()}`}>
                          BrokersBlitz Verified Partner
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                        {broker.fullName}
                      </h3>
                      <div className={`text-xs font-bold ${getAccentColorClass()}`}>
                        {broker.agencyName || 'Prime Advisory Real Estate'}
                      </div>
                      <div className="text-[11px] opacity-80 font-medium">
                        {title}
                      </div>
                    </div>

                    {customLogoUrl ? (
                      <img
                        src={customLogoUrl}
                        alt="Brand Logo"
                        className="h-10 w-auto max-w-[90px] object-contain rounded-lg bg-white/10 p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <Building2 className={`w-5 h-5 ${getAccentColorClass()}`} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-end pt-3 border-t border-white/10">
                    <div className="col-span-8 space-y-1 text-[11px]">
                      {showRera && broker.reraNumber && (
                        <div className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>RERA: {broker.reraNumber}</span>
                        </div>
                      )}

                      {showPhone && broker.phone && (
                        <div className="font-mono font-bold flex items-center gap-1.5 opacity-90">
                          <Phone className="w-3 h-3 text-[#DF6400]" />
                          <span>+91 {broker.phone}</span>
                        </div>
                      )}

                      {showEmail && broker.email && (
                        <div className="opacity-80 flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-[#DF6400]" />
                          <span>{broker.email}</span>
                        </div>
                      )}

                      {broker.operatingCity && (
                        <div className={`font-semibold flex items-center gap-1.5 ${getAccentColorClass()}`}>
                          <MapPin className="w-3 h-3" />
                          <span>{broker.operatingCity}</span>
                        </div>
                      )}

                      <p className="text-[9px] opacity-60 italic pt-1 line-clamp-1">
                        &quot;{slogan}&quot;
                      </p>
                    </div>

                    <div className="col-span-4 flex flex-col items-center">
                      <div className="p-1.5 bg-white rounded-xl shadow-md">
                        <svg
                          viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                          className="w-20 h-20"
                          shapeRendering="crispEdges"
                        >
                          {qrMatrix.map((row, r) =>
                            row.map((cell, c) =>
                              cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0F172A" /> : null
                            )
                          )}
                        </svg>
                      </div>
                      <span className="text-[8px] font-mono uppercase font-bold text-center mt-1 opacity-80 leading-tight">
                        Scan Storefront
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between items-center text-center relative z-10 py-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${getAccentColorClass()}`}>
                        BrokersBlitz Verified Partner
                      </span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                      {broker.fullName}
                    </h3>
                    <div className={`text-xs font-bold ${getAccentColorClass()}`}>
                      {broker.agencyName || 'Prime Advisory Real Estate'}
                    </div>
                    <div className="text-[11px] opacity-80 font-medium">
                      {title}
                    </div>
                  </div>

                  <div className="my-2 flex flex-col items-center">
                    <div className="p-2 bg-white rounded-2xl shadow-lg border border-black/10">
                      <svg
                        viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                        className="w-32 h-32 sm:w-36 sm:h-36"
                        shapeRendering="crispEdges"
                      >
                        {qrMatrix.map((row, r) =>
                          row.map((cell, c) =>
                            cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0F172A" /> : null
                          )
                        )}
                      </svg>
                    </div>
                    <span className="text-[9px] font-mono uppercase font-bold text-center mt-1.5 opacity-90">
                      Scan to browse verified listings
                    </span>
                    <span className="text-[9px] font-mono opacity-70">
                      brokersblitz.in/broker/{cleanStoreCode}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] w-full pt-2 border-t border-white/10">
                    {showRera && broker.reraNumber && (
                      <div className="text-emerald-400 font-mono font-bold">
                        ✓ RERA: {broker.reraNumber}
                      </div>
                    )}

                    {showPhone && broker.phone && (
                      <div className="font-mono font-bold opacity-90">
                        📞 +91 {broker.phone}
                      </div>
                    )}

                    {showEmail && broker.email && (
                      <div className="opacity-80 truncate">
                        ✉️ {broker.email}
                      </div>
                    )}

                    <p className="text-[9px] opacity-60 italic pt-1">
                      &quot;{slogan}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B17] border border-[#1A1A1A]/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#DF6400]" />
              <span className="text-[#5C5852] dark:text-[#A8A29A]">Your Direct Link:</span>
              <strong className="font-mono text-[#1A1A1A] dark:text-white truncate max-w-xs select-all">
                {storefrontUrl}
              </strong>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyStorefront}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#F4F0EA] dark:bg-[#141210] hover:bg-[#DF6400] hover:text-white font-bold transition-all flex items-center justify-center gap-1.5 border border-[#1A1A1A]/10 dark:border-white/10"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my verified property listings on BrokersBlitz: ${storefrontUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

