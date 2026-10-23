'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { GRADES } from '@/lib/i18n';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck2,
  FileSearch,
  Globe2,
  GraduationCap,
  HelpCircle,
  MapPin,
  Medal,
  Sparkles,
  Timer,
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

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function HomePage() {
  const { locale, t, settings } = useLanguage();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 43,
    hours: 10,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data) => {
        if (data.branches) setBranches(data.branches);
      })
      .catch(() => {});
  }, []);

  // Live Countdown Timer to Exam Day (default target: Dec 5, 2026 10:00)
  useEffect(() => {
    const parseExamTarget = (): number => {
      const startHourMatch = settings.exam_time.match(/(\d{1,2}):(\d{2})/);
      const hh = startHourMatch ? Number(startHourMatch[1]) : 10;
      const mm = startHourMatch ? Number(startHourMatch[2]) : 0;
      const parsedEn = Date.parse(`${settings.stage2_date_en} ${hh}:${mm}:00`);
      if (!isNaN(parsedEn) && parsedEn > 0) {
        return parsedEn;
      }
      return new Date(2026, 11, 5, hh, mm, 0).getTime();
    };

    const updateTimer = () => {
      const target = parseExamTarget();
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [settings.stage2_date_en, settings.exam_time]);

  const getBranchName = (b: BranchItem) => {
    if (locale === 'RU') return b.name_ru;
    if (locale === 'EN') return b.name_en;
    return b.name_ro;
  };

  // Dynamic dates from Admin Calendar Settings
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

  const gradeQuickTitle =
    locale === 'RU'
      ? 'Выберите свой класс для быстрой регистрации (3 – 8 классы):'
      : locale === 'EN'
      ? 'Select your grade for instant registration (Grades 3 – 8):'
      : 'Alege clasa ta pentru înscriere rapidă (Clasele III – VIII):';

  const countdownTitle =
    locale === 'RU'
      ? 'До письменного экзамена осталось'
      : locale === 'EN'
      ? 'Countdown to Written Exam'
      : 'Timp rămas până la Proba Scrisă';

  const countdownUnits =
    locale === 'RU'
      ? { d: 'Дней', h: 'Часов', m: 'Минут', s: 'Секунд' }
      : locale === 'EN'
      ? { d: 'Days', h: 'Hours', m: 'Min', s: 'Sec' }
      : { d: 'Zile', h: 'Ore', m: 'Min', s: 'Sec' };

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
    <div className="overflow-hidden">
      {/* OPTION 1: MODERN EDTECH / BRILLIANT-STYLE LIGHT HERO FOR GRADES 3–8 */}
      <section className="relative bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#FFF7ED] text-slate-900 py-12 sm:py-20 lg:py-24 overflow-hidden border-b border-indigo-100">
        {/* Soft luminous ambient mesh orbs */}
        <div className="absolute -top-36 -left-36 w-[500px] h-[500px] rounded-full bg-indigo-400/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-12 right-0 w-[460px] h-[460px] rounded-full bg-amber-400/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-[440px] h-[440px] rounded-full bg-sky-400/15 blur-[120px] pointer-events-none" />

        {/* Subtle geometric notebook grid */}
        <div className="absolute inset-0 opacity-[0.35] pointer-events-none bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:36px_36px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-indigo-200/80 text-[#2C3987] text-xs sm:text-sm font-extrabold shadow-sm">
                <Sparkles className="w-4 h-4 text-[#F59122]" />
                <span>
                  {t.hero.badge} {settings.edition}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-[#1E293B]">
                <span className="text-[#2C3987]">{t.hero.title}</span>{' '}
                <span className="bg-gradient-to-r from-[#F59122] via-[#ED5526] to-[#2C3987] bg-clip-text text-transparent">
                  {t.hero.titleAccent}
                </span>
              </h1>

              <p className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl">
                {t.hero.subtitle}
              </p>

              {/* Interactive Quick Grade Selector (Grades 3–8) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-indigo-100 shadow-md shadow-indigo-950/5 space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#2C3987]">
                  <GraduationCap className="w-4 h-4 text-[#F59122] shrink-0" />
                  <span>{gradeQuickTitle}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {GRADES.map((g) => (
                    <Link
                      key={g}
                      href={`/register?grade=${g}`}
                      className="group relative py-2.5 px-3 rounded-2xl bg-gradient-to-b from-white to-slate-50/90 hover:from-[#2C3987] hover:to-[#1e2866] border-2 border-indigo-100 hover:border-[#2C3987] text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-300">
                        {t.register.gradeLabel}
                      </div>
                      <div className="text-lg sm:text-xl font-black text-[#2C3987] group-hover:text-white leading-tight">
                        {g}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-1">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#F59122] to-[#ED5526] hover:from-[#e48113] hover:to-[#d94618] text-white font-black text-base shadow-xl shadow-orange-500/25 transition-all hover:-translate-y-0.5"
                >
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <span>{t.hero.registerBtn}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>

                <Link
                  href="/results"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white hover:bg-indigo-50/60 border-2 border-indigo-200/90 text-[#2C3987] font-extrabold text-base shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <FileSearch className="w-5 h-5 text-[#F59122] shrink-0" />
                  <span>{t.hero.resultsBtn}</span>
                </Link>
              </div>

              {/* 3 Modern EdTech Stat Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-white/85 border border-indigo-100/90 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2C3987] shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900">{t.hero.statGrades}</div>
                    <div className="text-xs font-semibold text-slate-500">
                      {t.hero.statGradesSub}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/85 border border-indigo-100/90 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F59122] shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900">{t.hero.statFormat}</div>
                    <div className="text-xs font-semibold text-slate-500">
                      {t.hero.statFormatSub}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/85 border border-indigo-100/90 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900">{t.hero.statLangs}</div>
                    <div className="text-xs font-semibold text-slate-500">
                      {t.hero.statLangsSub}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Exam Countdown + 3-Stage Competition Roadmap Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-r from-[#2C3987]/20 via-[#F59122]/25 to-amber-400/20 blur-xl" />
                <div className="relative bg-white/95 backdrop-blur-xl border-2 border-indigo-100/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-indigo-950/10">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-extrabold uppercase tracking-wider text-[#2C3987]">
                      <Calendar className="w-3.5 h-3.5 text-[#F59122]" />
                      {t.hero.sampleIdLabel}
                    </span>
                    <span className="text-xs font-mono font-black text-[#F59122] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                      {settings.edition}
                    </span>
                  </div>

                  {/* Live Countdown Timer Widget */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2C3987] to-[#1e296b] text-white mb-5 shadow-md">
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 mb-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-[#F8A71A]" />
                        {countdownTitle}
                      </span>
                      <span className="text-amber-300 font-mono">{stage2Date}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white/10 border border-white/15 rounded-xl py-2 px-1">
                        <div className="text-xl sm:text-2xl font-mono font-black text-white leading-none">
                          {String(countdown.days).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-indigo-200 mt-1">
                          {countdownUnits.d}
                        </div>
                      </div>
                      <div className="bg-white/10 border border-white/15 rounded-xl py-2 px-1">
                        <div className="text-xl sm:text-2xl font-mono font-black text-white leading-none">
                          {String(countdown.hours).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-indigo-200 mt-1">
                          {countdownUnits.h}
                        </div>
                      </div>
                      <div className="bg-white/10 border border-white/15 rounded-xl py-2 px-1">
                        <div className="text-xl sm:text-2xl font-mono font-black text-white leading-none">
                          {String(countdown.minutes).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-indigo-200 mt-1">
                          {countdownUnits.m}
                        </div>
                      </div>
                      <div className="bg-[#F59122]/25 border border-[#F59122]/50 rounded-xl py-2 px-1">
                        <div className="text-xl sm:text-2xl font-mono font-black text-amber-300 leading-none">
                          {String(countdown.seconds).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-amber-200 mt-1">
                          {countdownUnits.s}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3-Stage Competition Roadmap */}
                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-xs font-black shrink-0 mt-0.5">
                        01
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-slate-900 flex items-center justify-between gap-2">
                          <span>{t.calendar.stage1Title}</span>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black shrink-0">
                            {t.calendar.activeBadge}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5">
                          {stage1Date}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-[#2C3987] text-white font-mono text-xs font-black shrink-0 mt-0.5">
                        02
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-slate-900">
                          {t.calendar.stage2Title}
                        </div>
                        <div className="text-xs font-bold text-[#2C3987] mt-0.5">
                          {stage2Date} • {settings.exam_time}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-[#F59122] text-white font-mono text-xs font-black shrink-0 mt-0.5">
                        03
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-slate-900">
                          {t.calendar.stage3Title}
                        </div>
                        <div className="text-xs font-bold text-[#d97706] mt-0.5">
                          {stage3Date}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-start gap-2.5 text-left">
                    <Trophy className="w-4 h-4 text-[#F59122] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {t.hero.sampleIdDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC CALENDAR SECTION (3 Official Stages) */}
      <section id="calendar" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-[#2C3987] border border-indigo-200 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Calendar className="w-4 h-4 text-[#F59122]" />
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
                    ? 'bg-gradient-to-b from-orange-50/60 via-white to-white border-[#F59122] shadow-xl shadow-orange-500/10'
                    : 'bg-slate-50/70 border-slate-200/90 hover:border-[#2C3987] hover:bg-white hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Stage Pill & Active Status */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-black ${
                        stage.isActive
                          ? 'bg-[#F59122] text-white shadow-sm'
                          : 'bg-[#2C3987] text-white'
                      }`}
                    >
                      {t.calendar.stageLabel} {stage.num}
                    </span>

                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        stage.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {stage.isActive ? t.calendar.activeBadge : t.calendar.upcomingBadge}
                    </span>
                  </div>

                  {/* Date Highlight */}
                  <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm font-extrabold">
                    <Clock className="w-4 h-4 text-[#F59122] shrink-0" />
                    <span>{stage.date}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mb-2.5 leading-snug">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80">
                  {stage.actionHref ? (
                    <Link
                      href={stage.actionHref}
                      className={`text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        idx === 0
                          ? 'text-[#F59122] hover:text-[#d94618]'
                          : 'text-[#2C3987] hover:text-indigo-950'
                      }`}
                    >
                      <span>{stage.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">
                      {stage.badgeText}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RULES & 3D MEDAL PRIZES SECTION */}
      <section
        id="rules"
        className="py-20 bg-gradient-to-b from-slate-50 to-indigo-50/30 border-b border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Award className="w-4 h-4 text-[#F59122]" />
              {t.rules.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.rules.title}
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              {t.rules.subtitle}
            </p>
          </div>

          {/* Official About LuminaMath Moldova & Answer Sheet Guidelines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 text-[#2C3987] text-xs font-extrabold mb-3">
                  <Sparkles className="w-4 h-4 text-[#F59122]" />
                  <span>LuminaMath Moldova • IPLT „Orizont”</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">
                  {t.rules.aboutTitle}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {t.rules.aboutDesc}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-extrabold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.rules.freeBadge}</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-[#2C3987] to-[#1e296b] text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-amber-300 text-xs font-extrabold mb-3">
                  <FileCheck2 className="w-4 h-4 text-[#F8A71A]" />
                  <span>Etapa Scrisă • 10:00 – 12:00</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mb-3">
                  {t.rules.answerSheetRulesTitle}
                </h3>
                <p className="text-sm text-indigo-100 leading-relaxed">
                  {t.rules.answerSheetRulesDesc}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs font-bold text-amber-300">
                <span>A • B • C • D • E (1 răspuns corect)</span>
                <span>Clasele III – VIII</span>
              </div>
            </div>
          </div>

          {/* 4 Steps Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {t.rules.steps.map((step, idx) => (
              <div
                key={step.num}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden"
              >
                <div
                  className={`w-12 h-12 rounded-2xl font-mono font-black text-lg flex items-center justify-center mb-4 shadow-sm ${
                    idx % 2 === 0
                      ? 'bg-[#2C3987] text-white'
                      : 'bg-gradient-to-br from-[#F8A71A] to-[#ED5526] text-white'
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

          {/* 3D Medal Prizes Card (Cash & Medal Prizes per Grade — No 85-100 Score Thresholds) */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-[#F59122]" />
              {t.rules.prizesTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {t.rules.prizes.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-6 border-2 border-slate-100 bg-gradient-to-b from-slate-50/70 to-white flex flex-col justify-between hover:border-[#F59122] hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r ${p.color} shadow-sm`}
                      >
                        <Medal className="w-3.5 h-3.5" />
                        {p.tier}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#2C3987] mb-2">
                      {p.points}
                    </div>
                    <div className="text-xs font-bold text-slate-600">
                      {p.badge}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-sm leading-relaxed">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>{t.rules.examNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* BRANCHES SECTION (4 Official Exam Centers) */}
      <section id="branches" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-[#2C3987] border border-indigo-200 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Building2 className="w-4 h-4 text-[#F59122]" />
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
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="rounded-3xl p-5 sm:p-7 border-2 border-slate-200 hover:border-[#2C3987] transition-all bg-gradient-to-br from-slate-50/80 to-white shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start gap-4 sm:gap-5"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2C3987] to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MapPin className="w-6 h-6 text-[#F8A71A]" />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {getBranchName(branch)}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-start sm:items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#F59122] shrink-0 mt-0.5 sm:mt-0" />
                    <span>{branch.address}</span>
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#2C3987] bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                      {branch.city}
                    </span>
                    <Link
                      href="/register"
                      className="text-xs font-extrabold text-[#F59122] hover:text-[#d94618]"
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

      {/* FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
      <section id="faq" className="py-20 bg-slate-50/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-[#F59122] border border-orange-200 text-xs font-extrabold uppercase tracking-wider mb-3">
              <HelpCircle className="w-4 h-4 text-[#F59122]" />
              {t.faq.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {t.faq.title}
            </h2>
            <p className="mt-3 text-slate-600 text-base sm:text-lg">
              {t.faq.subtitle}
            </p>
          </div>

          <div className="space-y-3.5">
            {t.faq.items.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border-2 transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-white border-[#2C3987] shadow-md'
                      : 'bg-white/90 border-slate-200/90 hover:border-indigo-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-extrabold text-sm sm:text-base text-slate-900">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#2C3987] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#F59122]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
