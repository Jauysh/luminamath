'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { GRADES, SCHOOL_OPTIONS, SchoolOption } from '@/lib/i18n';
import { LuminaLogo } from '@/components/LuminaLogo';
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  FileSearch,
  GraduationCap,
  Mail,
  Phone,
  Printer,
  School,
  User,
  UserCheck,
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

interface RegisteredStudent {
  student_code: string;
  access_pin: string;
  first_name: string;
  last_name: string;
  grade: number;
  school: string;
  teacher_name: string;
  exam_language: 'RO' | 'RU' | 'EN';
  branch_code: number;
  branch_name_ro?: string;
  branch_name_ru?: string;
  branch_name_en?: string;
  branch_address?: string;
  email: string;
  phone: string;
}

export default function RegisterPage() {
  const { locale, t, settings } = useLanguage();
  const [branches, setBranches] = useState<BranchItem[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState<number>(3);
  const [schoolCode, setSchoolCode] = useState<number>(1);
  const [customSchool, setCustomSchool] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [examLanguage, setExamLanguage] = useState<'RO' | 'RU' | 'EN'>('RO');
  const [branchId, setBranchId] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<RegisteredStudent | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const gParam = Number(params.get('grade'));
      if (gParam >= 3 && gParam <= 8) {
        setGrade(gParam);
      }
    }
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data) => {
        if (data.branches && data.branches.length > 0) {
          setBranches(data.branches);
          setBranchId(data.branches[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const getBranchName = (b: BranchItem) => {
    if (locale === 'RU') return b.name_ru;
    if (locale === 'EN') return b.name_en;
    return b.name_ro;
  };

  const getRegisteredBranchName = (s: RegisteredStudent) => {
    if (locale === 'RU') return s.branch_name_ru || s.branch_name_ro;
    if (locale === 'EN') return s.branch_name_en || s.branch_name_ro;
    return s.branch_name_ro;
  };

  const examDateForLocale =
    locale === 'RU'
      ? `${settings.stage2_date_ru}, ${settings.exam_time}`
      : locale === 'EN'
      ? `${settings.stage2_date_en}, ${settings.exam_time}`
      : `${settings.stage2_date_ro}, ${settings.exam_time}`;

  const getSchoolOptionLabel = (opt: SchoolOption) => {
    const label =
      locale === 'RU' ? opt.name_ru : locale === 'EN' ? opt.name_en : opt.name_ro;
    return `[${opt.codeStr}] ${label}`;
  };

  const selectedSchoolOption =
    SCHOOL_OPTIONS.find((s) => s.code === Number(schoolCode)) || SCHOOL_OPTIONS[0];
  const availableGrades = selectedSchoolOption.maxGrade
    ? GRADES.filter((g) => g <= selectedSchoolOption.maxGrade!)
    : GRADES;

  const handleSchoolCodeChange = (newCode: number) => {
    setSchoolCode(newCode);
    const opt = SCHOOL_OPTIONS.find((s) => s.code === newCode);
    if (opt?.maxGrade && grade > opt.maxGrade) {
      setGrade(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const resolvedSchoolName = selectedSchoolOption.isOther
      ? customSchool.trim()
      : selectedSchoolOption.name_ro;

    if (!resolvedSchoolName) {
      setError(t.register.otherSchoolLabel);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          grade,
          school: resolvedSchoolName,
          schoolCode: selectedSchoolOption.code,
          teacherName,
          examLanguage,
          branchId,
          email,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration error');
      } else {
        setRegistered(data.student);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError((err as Error).message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRegistered(null);
    setFirstName('');
    setLastName('');
    setSchoolCode(1);
    setCustomSchool('');
    setTeacherName('');
    setEmail('');
    setPhone('');
  };

  if (registered) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl overflow-hidden">
          {/* Official Logo Header for Printed Admission Slip */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
            <LuminaLogo className="h-9 sm:h-10 w-auto" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#2C3987] bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              Clasele III – VIII • {settings.edition}
            </span>
          </div>

          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {t.register.successTitle}
            </h1>
            <p className="mt-2 text-emerald-50 text-sm sm:text-base max-w-2xl mx-auto">
              {t.register.successSubtitle}
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {/* 6-Digit ID Highlight Box + Secret PIN + Official Exam Pass Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-indigo-50/60 border-2 border-dashed border-indigo-400 rounded-2xl p-6 mb-8">
              <div className="md:col-span-7 text-center md:text-left space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border-2 border-indigo-300 shadow-sm">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-700 text-white mb-1">
                      {t.register.yourIdLabel}
                    </span>
                    <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-slate-950">
                      {registered.student_code}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 shadow-sm">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-700 text-white mb-1">
                      {locale === 'RU'
                        ? 'ПАРОЛЬ / PIN-КОД'
                        : locale === 'EN'
                        ? 'PASSWORD / ACCESS PIN'
                        : 'PAROLA / COD PIN REZULTATE'}
                    </span>
                    <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-950">
                      {registered.access_pin}
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  {t.register.idStructureHint}
                </p>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {t.register.emailSentNotice} <strong>{registered.email}</strong>
                  </span>
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="rounded-2xl bg-slate-950 text-white p-5 border border-indigo-500/30 shadow-lg space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      <Award className="w-4 h-4" />
                      LuminaMath {settings.edition}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-white/10 text-indigo-200">
                      {t.register.gradeLabel} {registered.grade} • {registered.exam_language}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-400 uppercase font-semibold">
                      {t.register.examDateLabel}
                    </div>
                    <div className="font-extrabold text-amber-300 text-sm">
                      {examDateForLocale}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs pt-1">
                    <div className="text-slate-400 uppercase font-semibold">
                      {t.register.branch}
                    </div>
                    <div className="font-bold text-white">
                      {getRegisteredBranchName(registered)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Details Summary Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-6 border border-slate-200 text-sm mb-8">
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">
                  {t.register.firstName} & {t.register.lastName}
                </span>
                <span className="font-extrabold text-slate-900 text-base">
                  {registered.first_name} {registered.last_name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">
                  {t.register.grade} & {t.register.examLanguage}
                </span>
                <span className="font-extrabold text-slate-900 text-base">
                  {t.register.gradeLabel} {registered.grade} • {registered.exam_language}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">
                  {t.register.school}
                </span>
                <span className="font-bold text-slate-800">{registered.school}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">
                  {t.register.teacherName}
                </span>
                <span className="font-bold text-slate-800">{registered.teacher_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">
                  {t.register.branch}
                </span>
                <span className="font-bold text-indigo-800">
                  {getRegisteredBranchName(registered)} ({registered.branch_address})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase font-semibold">
                  {t.register.examDateLabel}
                </span>
                <span className="font-extrabold text-emerald-700">
                  {examDateForLocale}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  {t.register.printSlipBtn}
                </button>

                <Link
                  href={`/results?id=${registered.student_code}&pin=${registered.access_pin}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-sm transition-all"
                >
                  <FileSearch className="w-4 h-4" />
                  {t.register.checkResultsNowBtn}
                </Link>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 underline text-center sm:text-right py-2"
              >
                {t.register.registerAnotherBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-[#2C3987] via-[#233075] to-indigo-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
              <UserPlus className="w-4 h-4 text-[#F59122]" />
              LuminaMath Moldova • {settings.edition} • Clasele III – VIII
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {t.register.title}
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              {t.register.subtitle}
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 text-center shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              {t.register.examDateLabel}
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
              {examDateForLocale}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
              {error}
            </div>
          )}

          {/* Row 1: First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t.register.firstName} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t.register.firstNamePlaceholder}
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t.register.lastName} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t.register.lastNamePlaceholder}
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Branch (Filiala) & Grade (Clasa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                <Building2 className="w-4 h-4 inline mr-1 text-indigo-700" />
                {t.register.branch} <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(Number(e.target.value))}
                className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm font-semibold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {getBranchName(b)} — {b.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                <GraduationCap className="w-4 h-4 inline mr-1 text-indigo-700" />
                {t.register.grade} <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm font-semibold"
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>
                    {t.register.gradeLabel} {g}
                  </option>
                ))}
              </select>
              {selectedSchoolOption.maxGrade && (
                <p className="mt-1.5 text-xs font-semibold text-amber-800">
                  {t.register.kindergartenGradeHint}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: School Selection (7 Orizont Branches + Other School) & Math Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-2.5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  <School className="w-4 h-4 inline mr-1 text-indigo-700" />
                  {t.register.school} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={schoolCode}
                  onChange={(e) => handleSchoolCodeChange(Number(e.target.value))}
                  className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm font-semibold"
                >
                  {SCHOOL_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {getSchoolOptionLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSchoolOption.isOther && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-1.5">
                  <label className="block text-xs font-extrabold text-amber-950">
                    {t.register.otherSchoolLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                      placeholder={t.register.otherSchoolPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t.register.teacherName} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder={t.register.teacherPlaceholder}
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Exam Language */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {t.register.examLanguage} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {[
                { code: 'RO', label: '🇲🇩 Română (RO)' },
                { code: 'RU', label: '🇷🇺 Русский (RU)' },
                { code: 'EN', label: '🇬🇧 English (EN)' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setExamLanguage(lang.code as 'RO' | 'RU' | 'EN')}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                    examLanguage === lang.code
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t.register.email} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.register.emailPlaceholder}
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t.register.phone} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.register.phonePlaceholder}
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#F59122] to-[#ED5526] hover:from-[#e48113] hover:to-[#d94618] disabled:opacity-60 text-white font-extrabold text-base shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {submitting ? t.register.submitting : t.register.submitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
