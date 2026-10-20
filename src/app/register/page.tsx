'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { GRADES } from '@/lib/i18n';
import { OmrIdPreview } from '@/components/OmrIdPreview';
import {
  Building2,
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
  const [grade, setGrade] = useState<number>(2);
  const [school, setSchool] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [examLanguage, setExamLanguage] = useState<'RO' | 'RU' | 'EN'>('RO');
  const [branchId, setBranchId] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<RegisteredStudent | null>(null);

  useEffect(() => {
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

  const selectedBranch = branches.find((b) => b.id === Number(branchId));
  const previewPrefix = selectedBranch
    ? `${selectedBranch.code}${String(grade).padStart(2, '0')}XXX`
    : `1${String(grade).padStart(2, '0')}XXX`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          grade,
          school,
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
    setSchool('');
    setTeacherName('');
    setEmail('');
    setPhone('');
  };

  if (registered) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl overflow-hidden">
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
            {/* 6-Digit ID Highlight Box + OMR Bubble Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-indigo-50/60 border-2 border-dashed border-indigo-400 rounded-2xl p-6 mb-8">
              <div className="md:col-span-7 text-center md:text-left space-y-3">
                <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-700 text-white">
                  {t.register.yourIdLabel}
                </span>
                <div className="text-5xl sm:text-6xl font-mono font-black tracking-widest text-slate-950">
                  {registered.student_code}
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

              <div className="md:col-span-5 flex justify-center">
                <OmrIdPreview studentCode={registered.student_code} />
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
                  href={`/results?id=${registered.student_code}`}
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
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
              <UserPlus className="w-4 h-4" />
              LuminaMath Moldova • {settings.edition}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {t.register.title}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              {t.register.subtitle}
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 text-center shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
              {t.register.idFormatLabel}
            </div>
            <div className="font-mono text-xl font-extrabold tracking-widest text-white">
              {previewPrefix}
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
                    [{b.code}] {getBranchName(b)}
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
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {t.register.gradeLabel} {g} ({t.register.codeWord}: 0{g})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: School & Math Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t.register.school} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder={t.register.schoolPlaceholder}
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none text-base sm:text-sm"
                />
              </div>
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
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-lumina-600 hover:from-indigo-700 hover:to-lumina-700 disabled:opacity-60 text-white font-extrabold text-base shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
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
