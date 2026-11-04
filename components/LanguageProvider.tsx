'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import enLocale from '../data/locales/en.json';
import hiLocale from '../data/locales/hi.json';
import hinglishLocale from '../data/locales/hinglish.json';

export type LanguageCode = 'en' | 'hi' | 'hinglish';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (keyPath: string, fallback?: string) => string;
  isIndic: boolean;
  languages: { id: LanguageCode; label: string; nativeLabel: string }[];
}

const dictionaries: Record<LanguageCode, any> = {
  en: enLocale,
  hi: hiLocale,
  hinglish: hinglishLocale,
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (keyPath: string, fallback?: string) => fallback || keyPath,
  isIndic: false,
  languages: [],
});

export const languagesList: { id: LanguageCode; label: string; nativeLabel: string }[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { id: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish' },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bb_language') as LanguageCode;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'hinglish')) {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('bb_language', lang);
      document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    } catch {}
  };

  const t = useMemo(() => {
    return (keyPath: string, fallback?: string): string => {
      const activeDict = dictionaries[language] || dictionaries.en;
      const parts = keyPath.split('.');
      let current: any = activeDict;

      for (const p of parts) {
        if (current && typeof current === 'object' && p in current) {
          current = current[p];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current === 'string' && current.trim()) {
        return current;
      }

      let enCurrent: any = dictionaries.en;
      for (const p of parts) {
        if (enCurrent && typeof enCurrent === 'object' && p in enCurrent) {
          enCurrent = enCurrent[p];
        } else {
          enCurrent = undefined;
          break;
        }
      }

      if (typeof enCurrent === 'string' && enCurrent.trim()) {
        return enCurrent;
      }

      return fallback || keyPath;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isIndic: language === 'hi',
      languages: languagesList,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

