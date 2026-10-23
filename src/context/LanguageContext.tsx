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
  stage1_date_ro: '08 Septembrie – 31 Octombrie 2026',
  stage1_date_ru: '08 Сентября – 31 Октября 2026',
  stage1_date_en: '08 September – 31 October 2026',
  stage2_date_ro: '05 Decembrie 2026',
  stage2_date_ru: '05 Декабря 2026',
  stage2_date_en: '05 December 2026',
  stage3_date_ro: '18 Decembrie 2026',
  stage3_date_ru: '18 Декабря 2026',
  stage3_date_en: '18 December 2026',
  stage4_date_ro: '15 Ianuarie 2027',
  stage4_date_ru: '15 Января 2027',
  stage4_date_en: '15 January 2027',
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
