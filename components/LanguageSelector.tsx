'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, LanguageCode } from './LanguageProvider';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export default function LanguageSelector({ className = '', variant = 'compact' }: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeLang = languages.find((l) => l.id === language) || languages[0];

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white dark:bg-[#24201C] border border-[#1A1A1A]/15 dark:border-white/15 text-[11px] sm:text-xs font-bold text-[#1A1A1A] dark:text-white hover:border-[#DF6400] transition-colors shadow-xs"
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#DF6400] flex-shrink-0" />
        <span className="truncate">{activeLang.nativeLabel}</span>
        <ChevronDown className="w-3 h-3 text-[#5C5852] dark:text-[#A8A29A]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#24201C] border border-[#1A1A1A]/10 dark:border-white/15 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[9px] font-bold text-[#5C5852] dark:text-[#A8A29A] uppercase font-mono">
            Language / भाषा
          </div>
          <div className="space-y-0.5 pt-0.5">
            {languages.map((l) => {
              const isSelected = l.id === language;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelect(l.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#DF6400]/10 text-[#DF6400]'
                      : 'text-[#1A1A1A] dark:text-white hover:bg-[#F4F0EA] dark:hover:bg-[#181614]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="leading-tight">{l.nativeLabel}</span>
                    <span className="text-[10px] text-[#5C5852] dark:text-[#A8A29A] font-normal leading-tight">
                      {l.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#DF6400]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

