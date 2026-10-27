'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, translations } from '@/lib/i18n';

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
  isRegistrationOpen: boolean;
  refreshSettings: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'RO',
  setLocale: () => {},
  t: translations.RO,
  settings: DEFAULT_CLIENT_SETTINGS,
  isRegistrationOpen: true,
  refreshSettings: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('RO');
  const [settings, setSettings] = useState<SiteSettingsClient>(DEFAULT_CLIENT_SETTINGS);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('luminamath_locale') as Locale | null;
    if (saved && (saved === 'RO' || saved === 'RU' || saved === 'EN')) {
      setLocaleState(saved);
    }
    refreshSettings();
  }, [refreshSettings]);

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
        isRegistrationOpen: checkClientRegistrationOpen(settings),
        refreshSettings,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
