'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileSearch,
  Globe2,
  MapPin,
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

  const stage4Date =
    locale === 'RU'
      ? settings.stage4_date_ru
      : locale === 'EN'
      ? settings.stage4_date_en
      : settings.stage4_date_ro;

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
    {
      num: '04',
      date: stage4Date,
      title: t.calendar.stage4Title,
      desc: t.calendar.stage4Desc,
      isActive: false,
      actionHref: '/results',
      actionLabel: t.hero.resultsBtn,
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* MODERN HERO SECTION */}
      <section className="relative bg-slate-950 text-white py-16 sm:py-24 lg:py-28 overflow-hidden">
        {/* Vibrant ambient mesh gradients */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-indigo-600/30 blur-[130px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[460px] h-[460px] rounded-full bg-cyan-500/20 blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-[420px] h-[420px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />

        {/* Subtle grid & mathematical symbols background */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="hidden lg:block absolute top-14 right-12 text-8xl font-serif font-black text-white/[0.04] select-none pointer-events-none">
          ∑ π √x ∞
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-amber-300 text-xs sm:text-sm font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  {t.hero.badge} {settings.edition}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] break-words">
                {t.hero.title}{' '}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-cyan-300 bg-clip-text text-transparent">
                  {t.hero.titleAccent}
                </span>
              </h1>

              <p className="text-sm sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
                {t.hero.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all hover:-translate-y-0.5"
                >
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <span>{t.hero.registerBtn}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>

                <Link
                  href="/results"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-base backdrop-blur-md transition-all hover:-translate-y-0.5"
                >
                  <FileSearch className="w-5 h-5 text-cyan-300 shrink-0" />
                  <span>{t.hero.resultsBtn}</span>
                </Link>
              </div>

              {/* Bento Stat Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6">
                <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white">{t.hero.statGrades}</div>
                    <div className="text-xs text-slate-400">{t.hero.statGradesSub}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white">{t.hero.statFormat}</div>
                    <div className="text-xs text-slate-400">{t.hero.statFormatSub}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white">{t.hero.statLangs}</div>
                    <div className="text-xs text-slate-400">{t.hero.statLangsSub}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Official Competition Schedule & Overview Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-cyan-400 to-amber-400 opacity-40 blur-xl" />
                <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {t.hero.sampleIdLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-0.5 rounded-full">
                      {settings.edition}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-black shrink-0 mt-0.5">
                        01
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-white flex items-center justify-between gap-2">
                          <span>{t.calendar.stage1Title}</span>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
                            {t.calendar.activeBadge}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-amber-300 mt-0.5">
                          {stage1Date}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 text-slate-300 font-mono text-xs font-black shrink-0 mt-0.5">
                        02
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-white">
                          {t.calendar.stage2Title}
                        </div>
                        <div className="text-xs font-semibold text-cyan-300 mt-0.5">
                          {stage2Date} • {settings.exam_time}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 text-slate-300 font-mono text-xs font-black shrink-0 mt-0.5">
                        03
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-white">
                          {t.calendar.stage3Title}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">{stage3Date}</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded-lg bg-white/10 text-slate-300 font-mono text-xs font-black shrink-0 mt-0.5">
                        04
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-white">
                          {t.calendar.stage4Title}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">{stage4Date}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/10 flex items-start gap-2.5 text-left">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.hero.sampleIdDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC CALENDAR SECTION (4 Official Stages) */}
      <section id="calendar" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold uppercase tracking-wider mb-3">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {calendarStages.map((stage, idx) => (
              <div
                key={stage.num}
                className={`group relative rounded-3xl p-6 sm:p-7 border-2 transition-all flex flex-col justify-between ${
                  stage.isActive
                    ? 'bg-gradient-to-b from-indigo-50/70 via-white to-white border-indigo-500 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-50/70 border-slate-200/90 hover:border-indigo-300 hover:bg-white hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Stage Pill & Active Status */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-black ${
                        stage.isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-700'
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
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
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
                          ? 'text-indigo-700 hover:text-indigo-900'
                          : 'text-amber-700 hover:text-amber-900'
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

      {/* RULES, OMR WORKFLOW & PRIZES SECTION */}
      <section id="rules" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Award className="w-4 h-4" />
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
            {t.rules.steps.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-black text-lg flex items-center justify-center mb-4">
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
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-amber-500" />
              {t.rules.prizesTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {t.rules.prizes.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-6 border border-slate-200 bg-gradient-to-b from-slate-50/70 to-white flex flex-col justify-between hover:border-indigo-300 transition-colors"
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
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>{t.rules.examNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* BRANCHES SECTION (Chișinău — Lumina & Durlești) */}
      <section id="branches" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold uppercase tracking-wider mb-3">
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
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="rounded-3xl p-5 sm:p-7 border-2 border-slate-200 hover:border-indigo-500 transition-all bg-gradient-to-br from-slate-50/80 to-white shadow-sm hover:shadow-md flex flex-col sm:flex-row items-start gap-4 sm:gap-5"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-lumina-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {getBranchName(branch)}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-start sm:items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
                    <span>{branch.address}</span>
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                      {branch.city}
                    </span>
                    <Link
                      href="/register"
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800"
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
