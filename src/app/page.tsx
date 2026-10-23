'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LuminaMathLogo, OrizontPosterMedallion } from '@/components/LuminaBrand';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Clock,
  FileSearch,
  MapPin,
  Printer,
  Sparkles,
  Trophy,
  UserPlus,
} from 'lucide-react';

interface BranchItem {
  id: number;
  code: number;
  name_ro: string;
  name_ru: string;
  name_en: string;
  city: string;
  address: string;
}

export default function HomePage() {
  const { locale, t, settings } = useLanguage();
  const [branches, setBranches] = useState<BranchItem[]>([]);

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data) => {
        if (data.branches) setBranches(data.branches);
      })
      .catch(() => {});
  }, []);

  const getBranchName = (b: BranchItem) => {
    if (locale === 'RU') return b.name_ru;
    if (locale === 'EN') return b.name_en;
    return b.name_ro;
  };

  // Dynamic dates from Admin Calendar Settings (3 Official Stages)
  const stage1Date =
    locale === 'RU'
      ? settings.stage1_date_ru
      : locale === 'EN'
      ? settings.stage1_date_en
      : settings.stage1_date_ro;

  const stage2Date =
    locale === 'RU'
      ? settings.stage2_date_ru
      : locale === 'EN'
      ? settings.stage2_date_en
      : settings.stage2_date_ro;

  const stage3Date =
    locale === 'RU'
      ? settings.stage3_date_ru
      : locale === 'EN'
      ? settings.stage3_date_en
      : settings.stage3_date_ro;

  const posterBox1Text =
    locale === 'RU'
      ? 'ПРИЗЫ И ДИПЛОМЫ!'
      : locale === 'EN'
      ? 'PRIZES & DIPLOMAS!'
      : 'PREMII ȘI DIPLOME!';

  const posterBox2Label =
    locale === 'RU' ? 'ДАТА' : locale === 'EN' ? 'DATE' : 'DATA';

  const posterBox2Time =
    locale === 'RU'
      ? `ВРЕМЯ ${settings.exam_time.split('–')[0].trim()}`
      : locale === 'EN'
      ? `TIME ${settings.exam_time.split('–')[0].trim()}`
      : `ORA ${settings.exam_time.split('–')[0].trim()}`;

  const posterBox3Top =
    locale === 'RU' ? 'КЛАССЫ' : locale === 'EN' ? 'GRADES' : 'CLASELE';

  const calendarStages = [
    {
      num: '01',
      date: stage1Date,
      title: t.calendar.stage1Title,
      desc: t.calendar.stage1Desc,
      isActive: true,
      actionHref: '/register',
      actionLabel: t.hero.registerBtn,
    },
    {
      num: '02',
      date: `${stage2Date} (${settings.exam_time})`,
      title: `${t.calendar.stage2Title} (${settings.exam_time})`,
      desc: t.calendar.stage2Desc,
      isActive: false,
      badgeText: `${settings.exam_time} • ${t.calendar.examDurationBadge}`,
    },
    {
      num: '03',
      date: stage3Date,
      title: t.calendar.stage3Title,
      desc: t.calendar.stage3Desc,
      isActive: false,
      actionHref: '/results',
      actionLabel: t.hero.resultsBtn,
    },
  ];

  return (
    <div className="overflow-hidden bg-[#FAF6F0]">
      {/* POSTER-INSPIRED HERO SECTION (Warm Cream #FAF6F0 + Colorful Math Confetti for Grades II–VIII) */}
      <section className="relative bg-[#FAF6F0] text-slate-900 py-10 sm:py-16 lg:py-20 overflow-hidden border-b-2 border-orange-200/80">
        {/* Soft warm radial highlights */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#F5B316]/15 blur-[110px] pointer-events-none" />
        <div className="absolute top-16 right-0 w-[420px] h-[420px] rounded-full bg-[#EB5A24]/12 blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-[380px] h-[380px] rounded-full bg-[#1758A8]/10 blur-[110px] pointer-events-none" />

        {/* Playful Background Math Symbols Pattern (+, -, ×, △, dots) */}
        <div className="hidden lg:block absolute top-10 left-8 text-4xl font-black text-[#1758A8]/20 rotate-12 select-none pointer-events-none">
          +
        </div>
        <div className="hidden lg:block absolute bottom-12 left-14 text-5xl font-black text-[#EB5A24]/20 -rotate-12 select-none pointer-events-none">
          ×
        </div>
        <div className="hidden lg:block absolute top-14 right-14 text-4xl font-black text-[#F5B316]/35 rotate-6 select-none pointer-events-none">
          △
        </div>
        <div className="hidden lg:block absolute bottom-14 right-10 text-4xl font-black text-[#1758A8]/20 -rotate-6 select-none pointer-events-none">
          ÷
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Official Logo, 3 Poster Badges (PREMII / DATA / CLASELE II-VIII), Description & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1758A8] text-white text-xs sm:text-sm font-black shadow-sm">
                <Sparkles className="w-4 h-4 text-[#F5B316]" />
                <span>
                  {t.hero.badge} {settings.edition}
                </span>
              </div>

              {/* Large Official LuminaMath Vector Logo */}
              <div className="py-1">
                <LuminaMathLogo className="w-full max-w-[340px] sm:max-w-[460px] h-auto drop-shadow-sm" />
              </div>

              {/* THE 3 ICONIC POSTER BLOCKS (Adapted for Grades II–VIII) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1">
                {/* Block 1: PREMII ȘI DIPLOME! */}
                <div className="sm:col-span-4 rounded-2xl bg-[#EB5A24] text-white p-4 text-center shadow-lg shadow-orange-600/20 flex flex-col items-center justify-center border-2 border-[#d94d1a]">
                  <Trophy className="w-6 h-6 text-[#F5B316] mb-1" />
                  <div className="font-black text-base sm:text-lg leading-tight uppercase tracking-wide italic">
                    {posterBox1Text}
                  </div>
                </div>

                {/* Block 2: DATA & ORA 10:00 */}
                <div className="sm:col-span-5 rounded-2xl bg-[#EB5A24] text-white p-4 text-center shadow-lg shadow-orange-600/20 flex flex-col items-center justify-center border-2 border-[#d94d1a]">
                  <div className="text-xs font-black uppercase tracking-widest text-orange-100">
                    {posterBox2Label}
                  </div>
                  <div className="font-black text-base sm:text-lg leading-tight uppercase my-0.5">
                    {stage2Date}
                  </div>
                  <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#F5B316]">
                    {posterBox2Time}
                  </div>
                </div>

                {/* Block 3: CLASELE II–VIII */}
                <div className="sm:col-span-3 rounded-2xl bg-[#F5B316] text-white p-4 text-center shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center border-2 border-[#e0a00d]">
                  <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-white/95 drop-shadow-sm">
                    {posterBox3Top}
                  </div>
                  <div className="font-black text-2xl sm:text-3xl leading-none tracking-tight text-white drop-shadow-sm mt-1">
                    II–VIII
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-lg text-slate-700 font-medium leading-relaxed max-w-2xl">
                {t.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#EB5A24] to-[#F58220] hover:from-[#d94e1b] hover:to-[#e07114] text-white font-black text-base shadow-xl shadow-orange-500/25 transition-all hover:-translate-y-0.5"
                >
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <span>{t.hero.registerBtn}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>

                <Link
                  href="/results"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-[#1B56A5] hover:bg-[#144382] text-white font-black text-base shadow-lg shadow-blue-700/20 transition-all hover:-translate-y-0.5"
                >
                  <FileSearch className="w-5 h-5 text-[#F5B316] shrink-0" />
                  <span>{t.hero.resultsBtn}</span>
                </Link>

                <Link
                  href="/poster"
                  className="inline-flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white hover:bg-orange-50 text-slate-800 border-2 border-orange-200 font-extrabold text-sm shadow-sm transition-all"
                  title="Afiș Oficial LuminaMath (CLASELE II–VIII)"
                >
                  <Printer className="w-4 h-4 text-[#EB5A24] shrink-0" />
                  <span>
                    {locale === 'RU'
                      ? 'Постер (II–VIII)'
                      : locale === 'EN'
                      ? 'Poster (II–VIII)'
                      : 'Afiș (II–VIII)'}
                  </span>
                </Link>
              </div>
            </div>

            {/* Right Column: Official Orizont 1993 Concentric Medallion + 3-Stage Schedule Card */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-md bg-white/90 backdrop-blur-md border-2 border-orange-200/90 rounded-3xl p-5 sm:p-6 shadow-xl">
                {/* Poster Medallion with Math Confetti + Orizont 1993 Emblem */}
                <OrizontPosterMedallion size="md" />

                {/* Orange Pill Banner: LICEUL TEORETIC ORIZONT MOLDOVA */}
                <div className="mt-1 mb-5 py-2 px-4 rounded-full bg-gradient-to-r from-[#EB5A24] to-[#F37022] text-white font-black text-xs sm:text-sm uppercase tracking-wider text-center shadow-md">
                  LICEUL TEORETIC „ORIZONT” MOLDOVA
                </div>

                {/* Compact 3-Stage Official Timeline */}
                <div className="space-y-2 border-t border-orange-100 pt-4">
                  <div className="p-3 rounded-2xl bg-orange-50/90 border border-orange-200 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded-lg bg-[#EB5A24] text-white font-mono text-xs font-black shrink-0 mt-0.5">
                      01
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 flex items-center justify-between gap-2">
                        <span>{t.calendar.stage1Title}</span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black shrink-0">
                          {t.calendar.activeBadge}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#EB5A24] mt-0.5">
                        {stage1Date}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded-lg bg-[#1B56A5] text-white font-mono text-xs font-black shrink-0 mt-0.5">
                      02
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900">
                        {t.calendar.stage2Title}
                      </div>
                      <div className="text-xs font-bold text-[#1B56A5] mt-0.5">
                        {stage2Date} • {settings.exam_time}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded-lg bg-[#F5B316] text-slate-950 font-mono text-xs font-black shrink-0 mt-0.5">
                      03
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900">
                        {t.calendar.stage3Title}
                      </div>
                      <div className="text-xs font-bold text-amber-900 mt-0.5">
                        {stage3Date}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC CALENDAR SECTION (3 Official Stages) */}
      <section id="calendar" className="py-20 bg-white border-b border-orange-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-[#EB5A24] border border-orange-200 text-xs font-black uppercase tracking-wider mb-3">
              <Calendar className="w-4 h-4" />
              {t.calendar.badge} • {settings.edition}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.calendar.title}
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              {t.calendar.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {calendarStages.map((stage, idx) => (
              <div
                key={stage.num}
                className={`group relative rounded-3xl p-6 sm:p-7 border-2 transition-all flex flex-col justify-between ${
                  stage.isActive
                    ? 'bg-gradient-to-b from-orange-50/80 via-white to-white border-[#EB5A24] shadow-xl shadow-orange-500/10'
                    : 'bg-[#FAF6F0]/70 border-orange-200/80 hover:border-[#1B56A5] hover:bg-white hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Stage Pill & Active Status */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-black ${
                        stage.isActive
                          ? 'bg-[#EB5A24] text-white shadow-sm'
                          : idx === 1
                          ? 'bg-[#1B56A5] text-white'
                          : 'bg-[#F5B316] text-slate-950'
                      }`}
                    >
                      {t.calendar.stageLabel} {stage.num}
                    </span>

                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        stage.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {stage.isActive ? t.calendar.activeBadge : t.calendar.upcomingBadge}
                    </span>
                  </div>

                  {/* Date Highlight */}
                  <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs sm:text-sm font-extrabold">
                    <Clock className="w-4 h-4 text-[#EB5A24] shrink-0" />
                    <span>{stage.date}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mb-2.5 leading-snug">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-orange-200/60">
                  {stage.actionHref ? (
                    <Link
                      href={stage.actionHref}
                      className={`text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        idx === 0
                          ? 'text-[#EB5A24] hover:text-[#c74312]'
                          : 'text-[#1B56A5] hover:text-[#113a70]'
                      }`}
                    >
                      <span>{stage.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs font-bold text-[#1B56A5]">
                      {stage.badgeText}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RULES & PRIZES SECTION */}
      <section id="rules" className="py-20 bg-[#FAF6F0] border-b border-orange-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B316]/25 text-amber-950 border border-[#F5B316] text-xs font-black uppercase tracking-wider mb-3">
              <Award className="w-4 h-4 text-[#EB5A24]" />
              {t.rules.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.rules.title}
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              {t.rules.subtitle}
            </p>
          </div>

          {/* 4 Steps Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {t.rules.steps.map((step, i) => (
              <div
                key={step.num}
                className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-orange-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div
                  className={`w-11 h-11 rounded-2xl font-mono font-black text-lg flex items-center justify-center mb-4 text-white shadow-sm ${
                    i % 3 === 0
                      ? 'bg-[#EB5A24]'
                      : i % 3 === 1
                      ? 'bg-[#1B56A5]'
                      : 'bg-[#F5B316] text-slate-950'
                  }`}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Prizes Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-orange-200 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-[#EB5A24]" />
              {t.rules.prizesTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {t.rules.prizes.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-6 border-2 border-orange-100 bg-gradient-to-b from-[#FAF6F0]/70 to-white flex flex-col justify-between hover:border-[#EB5A24] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r ${p.color} shadow-sm`}
                    >
                      {p.tier}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {p.badge}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {p.points}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-sm leading-relaxed">
              <AlertCircle className="w-5 h-5 text-[#EB5A24] shrink-0 mt-0.5" />
              <p>{t.rules.examNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* BRANCHES SECTION (4 Official Exam Centers) */}
      <section id="branches" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1B56A5] border border-blue-200 text-xs font-black uppercase tracking-wider mb-3">
              <Building2 className="w-4 h-4" />
              {t.branchesSection.badge} • Moldova
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.branchesSection.title}
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              {t.branchesSection.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {branches.map((branch, idx) => (
              <div
                key={branch.id}
                className="rounded-3xl p-5 sm:p-7 border-2 border-orange-200/80 hover:border-[#EB5A24] transition-all bg-gradient-to-br from-[#FAF6F0]/80 to-white shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start gap-4 sm:gap-5"
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md ${
                    idx % 2 === 0 ? 'bg-[#EB5A24]' : 'bg-[#1B56A5]'
                  }`}
                >
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {getBranchName(branch)}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-start sm:items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#EB5A24] shrink-0 mt-0.5 sm:mt-0" />
                    <span>{branch.address}</span>
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#1B56A5] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      {branch.city}
                    </span>
                    <Link
                      href="/register"
                      className="text-xs font-black text-[#EB5A24] hover:text-[#c74312]"
                    >
                      {t.branchesSection.registerHereBtn}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
