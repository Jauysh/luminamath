'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LuminaMathLogo, OrizontPosterMedallion } from '@/components/LuminaBrand';
import { ArrowLeft, Printer, UserPlus } from 'lucide-react';

export default function PosterPage() {
  const { locale, settings } = useLanguage();

  const examDateText =
    locale === 'RU'
      ? settings.stage2_date_ru
      : locale === 'EN'
      ? settings.stage2_date_en
      : settings.stage2_date_ro;

  const startHour = settings.exam_time.split('–')[0].trim();

  return (
    <div className="min-h-screen bg-slate-200/70 py-8 px-4 print:bg-[#FAF6F0] print:p-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-[680px] mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-extrabold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {locale === 'RU'
              ? 'На главную'
              : locale === 'EN'
              ? 'Back to Home'
              : 'Înapoi la Pagina Principală'}
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EB5A24] hover:bg-[#d64c19] text-white text-xs sm:text-sm font-black shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>
              {locale === 'RU'
                ? 'Скачать / Печать Постера (PDF)'
                : locale === 'EN'
                ? 'Print / Save Poster (PDF)'
                : 'Imprimă / Salvează Afișul (PDF)'}
            </span>
          </button>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B56A5] hover:bg-[#144382] text-white text-xs sm:text-sm font-black shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {locale === 'RU'
                ? 'Регистрация'
                : locale === 'EN'
                ? 'Register'
                : 'Înregistrare'}
            </span>
          </Link>
        </div>
      </div>

      {/* OFFICIAL POSTER CANVAS (CLASELE II–VIII) */}
      <div className="max-w-[680px] mx-auto bg-[#FAF6EE] rounded-3xl print:rounded-none shadow-2xl print:shadow-none border-4 border-white print:border-0 px-6 sm:px-12 py-10 sm:py-12 relative overflow-hidden">
        {/* Subtle Corner Confetti Dots */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#F5B316] absolute top-7 right-9" />
        <div className="w-2 h-2 rounded-full bg-[#1B56A5] absolute top-20 left-7" />

        {/* 1. Top Official Logo: LM + LuminaMath + CONCURSUL NAȚIONAL DE MATEMATICĂ */}
        <div className="flex justify-center mb-7">
          <LuminaMathLogo className="w-full max-w-[540px] h-auto" />
        </div>

        {/* 2. The 3 Iconic Poster Blocks (Updated to CLASELE II–VIII & 2026 Date) */}
        <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-6">
          {/* Block 1: PREMII ȘI DIPLOME! */}
          <div className="col-span-4 rounded-2xl bg-[#EB5A24] text-white py-4 px-2 sm:px-4 text-center shadow-md flex flex-col items-center justify-center">
            <div className="font-black text-base sm:text-2xl leading-[1.12] uppercase italic tracking-wide">
              PREMII
              <br />
              ȘI
              <br />
              DIPLOME!
            </div>
          </div>

          {/* Block 2: DATA & ORA 10:00 */}
          <div className="col-span-5 rounded-2xl bg-[#EB5A24] text-white py-4 px-2 sm:px-4 text-center shadow-md flex flex-col items-center justify-center">
            <div className="font-black text-sm sm:text-xl leading-tight uppercase tracking-wide">
              DATA
            </div>
            <div className="font-black text-xs sm:text-lg leading-tight uppercase my-1">
              {examDateText}
            </div>
            <div className="font-black text-sm sm:text-xl leading-tight uppercase">
              ORA {startHour}
            </div>
          </div>

          {/* Block 3: CLASELE II–VIII */}
          <div className="col-span-3 rounded-2xl bg-[#F5B316] text-white py-4 px-2 sm:px-3 text-center shadow-md flex flex-col items-center justify-center">
            <div className="font-black text-sm sm:text-xl leading-tight uppercase tracking-wide">
              CLASELE
            </div>
            <div className="font-black text-lg sm:text-2xl leading-tight uppercase mt-1">
              II–VIII
            </div>
          </div>
        </div>

        {/* 3. Centerpiece: Concentric Rings + Orizont 1993 Seal + Math Symbols */}
        <div className="my-2 flex justify-center">
          <OrizontPosterMedallion size="lg" />
        </div>

        {/* 4. Orange Pill Banner: LICEUL TEORETIC ORIZONT MOLDOVA */}
        <div className="mt-4 mb-6">
          <div className="w-full py-3 px-6 rounded-full bg-[#EB5A24] text-white font-black text-sm sm:text-xl uppercase tracking-wider text-center shadow-md">
            LICEUL TEORETIC „ORIZONT” MOLDOVA
          </div>
        </div>

        {/* 5. Bottom QR Code & Official URL Badge */}
        <div className="flex flex-col items-center justify-center gap-2 pt-1">
          <div className="p-2.5 rounded-2xl bg-[#EB5A24] shadow-md inline-flex flex-col items-center">
            <div className="bg-white p-2 rounded-xl">
              {/* Crisp Vector QR Code stylized block */}
              <svg
                viewBox="0 0 100 100"
                className="w-20 h-20 sm:w-24 sm:h-24"
                aria-label="QR Code www.luminamath.md"
              >
                <rect width="100" height="100" fill="#FFFFFF" />
                {/* Top-left finder */}
                <rect x="6" y="6" width="26" height="26" fill="none" stroke="#EB5A24" strokeWidth="5" />
                <rect x="13" y="13" width="12" height="12" fill="#EB5A24" />
                {/* Top-right finder */}
                <rect x="68" y="6" width="26" height="26" fill="none" stroke="#EB5A24" strokeWidth="5" />
                <rect x="75" y="13" width="12" height="12" fill="#EB5A24" />
                {/* Bottom-left finder */}
                <rect x="6" y="68" width="26" height="26" fill="none" stroke="#EB5A24" strokeWidth="5" />
                <rect x="13" y="75" width="12" height="12" fill="#EB5A24" />
                {/* Data modules */}
                <g fill="#EB5A24">
                  <rect x="38" y="8" width="6" height="6" />
                  <rect x="50" y="8" width="6" height="12" />
                  <rect x="38" y="20" width="6" height="12" />
                  <rect x="46" y="26" width="12" height="6" />
                  <rect x="8" y="38" width="12" height="6" />
                  <rect x="26" y="38" width="12" height="6" />
                  <rect x="68" y="38" width="12" height="6" />
                  <rect x="86" y="38" width="6" height="12" />
                  <rect x="8" y="50" width="6" height="12" />
                  <rect x="20" y="48" width="6" height="12" />
                  <rect x="74" y="52" width="16" height="6" />
                  <rect x="38" y="68" width="12" height="6" />
                  <rect x="56" y="68" width="6" height="12" />
                  <rect x="68" y="68" width="12" height="6" />
                  <rect x="86" y="74" width="6" height="18" />
                  <rect x="40" y="80" width="12" height="6" />
                  <rect x="38" y="88" width="6" height="6" />
                  <rect x="52" y="86" width="16" height="6" />
                  <rect x="74" y="82" width="6" height="12" />
                </g>
                {/* Center label */}
                <rect x="30" y="44" width="40" height="12" rx="3" fill="#1B56A5" />
                <text
                  x="50"
                  y="52.5"
                  fill="#FFFFFF"
                  fontSize="6.5"
                  fontWeight="900"
                  textAnchor="middle"
                >
                  LuminaMath
                </text>
              </svg>
            </div>
          </div>
          <div className="text-xs sm:text-sm font-black tracking-wider text-[#1B56A5] uppercase">
            www.luminamath.md
          </div>
        </div>
      </div>
    </div>
  );
}
