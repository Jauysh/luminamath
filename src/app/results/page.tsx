'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  KeyRound,
  Lock,
  Mail,
  Search,
  User,
} from 'lucide-react';

interface StudentLookupResult {
  student_code: string;
  access_pin: string;
  first_name: string;
  last_name: string;
  grade: number;
  school: string;
  teacher_name: string;
  exam_language: string;
  branch_code: number;
  branch_name_ro?: string;
  branch_name_ru?: string;
  branch_name_en?: string;
  branch_address?: string;
  has_result_pdf: boolean;
  result_uploaded_at: string | null;
}

function ResultsContent() {
  const { locale, t, settings } = useLanguage();
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const initialPin = searchParams.get('pin') || '';

  const [studentId, setStudentId] = useState(initialId);
  const [accessPin, setAccessPin] = useState(initialPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentLookupResult | null>(null);

  // Self-service ID / PIN email recovery state
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverMsg, setRecoverMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverEmail.trim()) return;
    setRecoverLoading(true);
    setRecoverMsg(null);
    try {
      const res = await fetch('/api/results/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoverEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecoverMsg({ type: 'err', text: data.error || 'Error' });
      } else {
        const okText =
          locale === 'RU'
            ? `ID и PIN-код успешно отправлены на ${recoverEmail.trim()}! Проверьте папку «Входящие» или «Спам».`
            : locale === 'EN'
            ? `Your 6-digit ID and PIN have been sent to ${recoverEmail.trim()}! Please check your Inbox or Spam folder.`
            : `ID-ul și Codul PIN au fost trimise pe ${recoverEmail.trim()}! Verificați căsuța Inbox sau Spam.`;
        setRecoverMsg({ type: 'ok', text: okText });
      }
    } catch {
      setRecoverMsg({ type: 'err', text: 'Network error' });
    } finally {
      setRecoverLoading(false);
    }
  };

  const performLookup = async (codeToSearch: string, pinToSearch: string) => {
    const cleanCode = codeToSearch.trim();
    const cleanPin = pinToSearch.trim();
    if (!cleanCode) return;

    setLoading(true);
    setError(null);
    setStudent(null);

    try {
      const res = await fetch(
        `/api/results/${encodeURIComponent(cleanCode)}?pin=${encodeURIComponent(cleanPin)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.results.notFound);
      } else {
        setStudent(data.student);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId && /^\d{6}$/.test(initialId.trim()) && initialPin.trim()) {
      performLookup(initialId.trim(), initialPin.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId, initialPin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(studentId, accessPin);
  };

  const getBranchName = (s: StudentLookupResult) => {
    if (locale === 'RU') return s.branch_name_ru || s.branch_name_ro;
    if (locale === 'EN') return s.branch_name_en || s.branch_name_ro;
    return s.branch_name_ro;
  };

  const resultsPublishDate =
    locale === 'RU'
      ? settings.stage3_date_ru
      : locale === 'EN'
      ? settings.stage3_date_en
      : settings.stage3_date_ro;

  const pinLabel =
    locale === 'RU'
      ? 'Пароль / PIN-код (6 цифр)'
      : locale === 'EN'
      ? 'Password / Access PIN (6 digits)'
      : 'Parola / Cod PIN (6 cifre)';

  const idLabel =
    locale === 'RU'
      ? 'ID участника (6 цифр)'
      : locale === 'EN'
      ? 'Student ID (6 digits)'
      : 'ID Participant (6 cifre)';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-[#2C3987] via-[#233075] to-indigo-800 text-white p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F59122]/20 border border-[#F59122]/40 flex items-center justify-center mx-auto mb-3 text-amber-300">
            <FileSearch className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {t.results.title}
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            {t.results.subtitle}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end"
          >
            <div className="sm:col-span-5">
              <label className="block text-xs font-extrabold uppercase text-slate-600 mb-1.5">
                {idLabel} *
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="010301"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-lg sm:text-xl font-extrabold tracking-widest text-slate-900"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-extrabold uppercase text-slate-600 mb-1.5">
                {pinLabel} *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={12}
                  required
                  value={accessPin}
                  onChange={(e) => setAccessPin(e.target.value.trim())}
                  placeholder="••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-lg sm:text-xl font-extrabold tracking-widest text-slate-900"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={loading || studentId.length !== 6 || !accessPin.trim()}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#F59122] to-[#ED5526] hover:from-[#e48113] hover:to-[#d94618] disabled:opacity-50 text-white font-extrabold text-sm sm:text-base shadow-md transition-all"
              >
                {loading ? t.results.searching : t.results.searchBtn}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 max-w-xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold text-center">
              {error}
            </div>
          )}

          {/* Self-Service Forgot ID / PIN Recovery Toggle */}
          <div className="mt-6 max-w-2xl mx-auto border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowRecover(!showRecover);
                setRecoverMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 hover:text-indigo-900 underline"
            >
              <KeyRound className="w-4 h-4" />
              {locale === 'RU'
                ? 'Забыли ID или PIN-код? Восстановить по Email'
                : locale === 'EN'
                ? 'Forgot your ID or PIN? Recover via Email'
                : 'Ați uitat ID-ul sau Codul PIN? Recuperați pe Email'}
            </button>

            {showRecover && (
              <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left">
                <p className="text-xs sm:text-sm text-slate-600 mb-3">
                  {locale === 'RU'
                    ? 'Введите адрес электронной почты, указанный при регистрации. Мы повторно отправим вам письмо с 6-значным ID и PIN-кодом.'
                    : locale === 'EN'
                    ? 'Enter the email address used during registration. We will resend your official registration pass with your 6-digit ID and PIN.'
                    : 'Introduceți adresa de email folosită la înregistrare. Vă vom retrimite pe email ID-ul din 6 cifre și Codul PIN.'}
                </p>
                <form
                  onSubmit={handleRecoverSubmit}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      placeholder="parent@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 outline-none text-sm text-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={recoverLoading || !recoverEmail.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shrink-0 transition-all"
                  >
                    {recoverLoading
                      ? '...'
                      : locale === 'RU'
                      ? 'Отправить ID и PIN на Email'
                      : locale === 'EN'
                      ? 'Send ID & PIN to Email'
                      : 'Trimite ID & PIN pe Email'}
                  </button>
                </form>

                {recoverMsg && (
                  <div
                    className={`mt-3 p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                      recoverMsg.type === 'ok'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {recoverMsg.type === 'ok' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{recoverMsg.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile + PDF Viewer */}
      {student && (
        <div className="space-y-8">
          {/* Student Details Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <User className="w-3.5 h-3.5" />
                  {t.results.studentCardTitle} • ID: {student.student_code}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {student.first_name} {student.last_name}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600 pt-1">
                  <div>
                    <span className="font-semibold text-slate-500">{t.results.gradeLabel}</span>{' '}
                    <strong className="text-slate-900">{student.grade}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">{t.results.langLabel}</span>{' '}
                    <strong className="text-slate-900">{student.exam_language}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">{t.results.schoolLabel}</span>{' '}
                    <strong className="text-slate-900">{student.school}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">{t.results.teacherLabel}</span>{' '}
                    <strong className="text-slate-900">{student.teacher_name}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-500">{t.results.branchLabel}</span>{' '}
                    <strong className="text-indigo-700">
                      {getBranchName(student)} ({student.branch_address})
                    </strong>
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-auto flex flex-col gap-2.5">
                <div className="rounded-2xl bg-slate-950 text-white px-6 py-5 border border-indigo-500/30 shadow-md text-center">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                    <Award className="w-3.5 h-3.5" />
                    LuminaMath {settings.edition}
                  </div>
                  <div className="text-3xl font-mono font-black tracking-widest text-white">
                    {student.student_code}
                  </div>
                  <div className="text-xs font-bold text-indigo-200 mt-1">
                    {t.results.gradeLabel} {student.grade} • {student.exam_language}
                  </div>
                </div>

                {/* Official PDF Pass & Certificate Download Buttons */}
                <div className="flex flex-col gap-2">
                  <a
                    href={`/api/results/${student.student_code}/ticket?pin=${encodeURIComponent(
                      student.access_pin || accessPin
                    )}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {locale === 'RU'
                      ? '🎫 Билет участника (PDF + QR)'
                      : locale === 'EN'
                      ? '🎫 Exam Pass (PDF + QR)'
                      : '🎫 Permis de Acces (PDF + QR)'}
                  </a>

                  <a
                    href={`/api/results/${student.student_code}/certificate?pin=${encodeURIComponent(
                      student.access_pin || accessPin
                    )}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-sm transition-all"
                  >
                    <Award className="w-3.5 h-3.5" />
                    {locale === 'RU'
                      ? '🏅 Сертификат участника (PDF)'
                      : locale === 'EN'
                      ? '🏅 Certificate of Participation (PDF)'
                      : '🏅 Certificat de Participare (PDF)'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* PDF Report Card Viewer */}
          {student.has_result_pdf ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-lg overflow-hidden">
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {t.results.pdfReadyTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t.results.fileLabel} {student.student_code}.pdf
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <a
                    href={`/api/results/${student.student_code}/pdf?pin=${encodeURIComponent(
                      student.access_pin || accessPin
                    )}&download=1`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    {t.results.downloadPdfBtn}
                  </a>

                  <a
                    href={`/api/results/${student.student_code}/pdf?pin=${encodeURIComponent(
                      student.access_pin || accessPin
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs sm:text-sm transition-all"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {t.results.openNewTabBtn}
                  </a>
                </div>
              </div>

              <div className="bg-slate-800 p-2 sm:p-4">
                <iframe
                  src={`/api/results/${student.student_code}/pdf?pin=${encodeURIComponent(
                    student.access_pin || accessPin
                  )}`}
                  title={`Result PDF ${student.student_code}`}
                  className="w-full h-[460px] sm:h-[680px] rounded-xl bg-white border-0"
                />
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-3xl border-2 border-amber-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-amber-950">
                {t.results.pdfPendingTitle}
              </h3>
              <p className="text-sm text-amber-900 max-w-xl mx-auto leading-relaxed">
                {t.results.pdfPendingDesc} <strong>{resultsPublishDate}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
