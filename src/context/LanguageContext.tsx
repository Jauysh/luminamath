'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, translations } from '@/lib/i18n';

export interface BranchClientItem {
  id: number;
  code: number;
  name_ro: string;
  name_ru: string;
  name_en: string;
  city: string;
  address: string;
}

export const DEFAULT_CLIENT_BRANCHES: BranchClientItem[] = [
  {
    id: 1,
    code: 1,
    name_ro: 'Filiala Ceadîr-Lunga',
    name_ru: 'Филиал Чадыр-Лунга (Ceadîr-Lunga)',
    name_en: 'CEADIR LUNGA BRANCH',
    city: 'Ceadîr-Lunga',
    address: 'Str. Lenin 87, MD-6104, Ceadir Lunga, Moldova',
  },
  {
    id: 2,
    code: 2,
    name_ro: 'Filiala Ciocana Primary (Chișinău)',
    name_ru: 'Филиал Чеканы Primary (Кишинёв)',
    name_en: 'CIOCANA PRIMARY BRANCH',
    city: 'Chișinău',
    address: 'Str. Mircea Cel Batrin 10/2, MD-2044, Ciocana, Mun. Chisinau, Moldova',
  },
  {
    id: 3,
    code: 3,
    name_ro: 'Filiala Buiucani (Chișinău)',
    name_ru: 'Филиал Буюканы (Кишинёв)',
    name_en: 'BUIUCANI BRANCH',
    city: 'Chișinău',
    address: 'Str. Ion Pelivan 13/A, MD-2064, Buiucani, Mun. Chisinau, Moldova',
  },
  {
    id: 4,
    code: 4,
    name_ro: 'Filiala Bălți',
    name_ru: 'Филиал Бельцы (Bălți)',
    name_en: 'BALTI BRANCH',
    city: 'Bălți',
    address: 'Str. Chisinaului 28, MD-3310, Balti, Moldova',
  },
];

export interface SiteSettingsClient {
  edition: string;
  exam_time: string;
  stage1_date_ro: string;
  stage1_date_ru: string;
  stage1_date_en: string;
  stage2_date_ro: string;
  stage2_date_ru: string;
  stage2_date_en: string;
  stage3_date_ro: string;
  stage3_date_ru: string;
  stage3_date_en: string;
  stage4_date_ro: string;
  stage4_date_ru: string;
  stage4_date_en: string;
  contact_email: string;
  contact_phone: string;
  registration_open?: boolean;
  registration_deadline?: string;
}

const DEFAULT_CLIENT_SETTINGS: SiteSettingsClient = {
  edition: '2026–2027',
  exam_time: '10:00 – 12:00',
  stage1_date_ro: '05 – 25 Noiembrie 2026',
  stage1_date_ru: '05 – 25 Ноября 2026',
  stage1_date_en: '05 – 25 November 2026',
  stage2_date_ro: '28 Noiembrie 2026',
  stage2_date_ru: '28 Ноября 2026',
  stage2_date_en: '28 November 2026',
  stage3_date_ro: 'Până pe 08 Decembrie 2026 (în 10 zile)',
  stage3_date_ru: 'До 08 Декабря 2026 (в течение 10 дней)',
  stage3_date_en: 'By 08 December 2026 (within 10 days)',
  stage4_date_ro: 'Decembrie 2026',
  stage4_date_ru: 'Декабрь 2026',
  stage4_date_en: 'December 2026',
  contact_email: 'luminamath@orizont.md',
  contact_phone: '+373 (79) 000 073',
  registration_open: true,
  registration_deadline: '',
};

export function checkClientRegistrationOpen(settings: SiteSettingsClient): boolean {
  if (settings.registration_open === false) {
    return false;
  }
  const deadlineStr = settings.registration_deadline?.trim();
  if (deadlineStr) {
    const deadlineMs = Date.parse(deadlineStr);
    if (!isNaN(deadlineMs) && Date.now() > deadlineMs) {
      return false;
    }
  }
  return true;
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (typeof translations)['RO'];
  settings: SiteSettingsClient;
  branches: BranchClientItem[];
  isRegistrationOpen: boolean;
  refreshSettings: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'RO',
  setLocale: () => {},
  t: translations.RO,
  settings: DEFAULT_CLIENT_SETTINGS,
  branches: DEFAULT_CLIENT_BRANCHES,
  isRegistrationOpen: true,
  refreshSettings: async () => {},
});

const SETTINGS_CACHE_KEY = 'luminamath_settings_cache_v2';
const BRANCHES_CACHE_KEY = 'luminamath_branches_cache_v2';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('RO');
  const [settings, setSettings] = useState<SiteSettingsClient>(DEFAULT_CLIENT_SETTINGS);
  const [branches, setBranches] = useState<BranchClientItem[]>(DEFAULT_CLIENT_BRANCHES);

  const refreshSettings = useCallback(async (forceNoStore = false) => {
    try {
      const res = await fetch('/api/settings', forceNoStore ? { cache: 'no-store' } : undefined);
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        try {
          window.sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data.settings));
        } catch {
          // ignore storage quota errors
        }
      }
    } catch {
      // keep defaults
    }
  }, []);

  const refreshBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (Array.isArray(data.branches) && data.branches.length > 0) {
        setBranches(data.branches);
        try {
          window.sessionStorage.setItem(BRANCHES_CACHE_KEY, JSON.stringify(data.branches));
        } catch {
          // ignore storage quota errors
        }
      }
    } catch {
      // keep default branches
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('luminamath_locale') as Locale | null;
    if (saved && (saved === 'RO' || saved === 'RU' || saved === 'EN')) {
      setLocaleState(saved);
    }
    try {
      const cachedSettings = window.sessionStorage.getItem(SETTINGS_CACHE_KEY);
      if (cachedSettings) {
        setSettings(JSON.parse(cachedSettings));
      }
      const cachedBranches = window.sessionStorage.getItem(BRANCHES_CACHE_KEY);
      if (cachedBranches) {
        const parsedBranches = JSON.parse(cachedBranches);
        if (Array.isArray(parsedBranches) && parsedBranches.length > 0) {
          setBranches(parsedBranches);
        }
      }
    } catch {
      // ignore invalid sessionStorage JSON
    }
    refreshSettings(false);
    refreshBranches();
  }, [refreshSettings, refreshBranches]);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    window.localStorage.setItem('luminamath_locale', loc);
  };

  useEffect(() => {
    const titles: Record<Locale, string> = {
      RO: 'LuminaMath Moldova — Concursul Național de Matematică',
      RU: 'LuminaMath Moldova — Национальная математическая олимпиада',
      EN: 'LuminaMath Moldova — National Mathematics Competition',
    };
    document.title = titles[locale] || titles.RO;
    document.documentElement.lang = locale.toLowerCase();
  }, [locale]);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t: translations[locale],
        settings,
        branches,
        isRegistrationOpen: checkClientRegistrationOpen(settings),
        refreshSettings: () => refreshSettings(true),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
