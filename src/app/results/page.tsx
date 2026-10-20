'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { OmrIdPreview } from '@/components/OmrIdPreview';
import {
  Clock,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  Search,
  User,
} from 'lucide-react';

interface StudentLookupResult {
  student_code: string;
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

  const [studentId, setStudentId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentLookupResult | null>(null);

  const performLookup = async (codeToSearch: string) => {
    const clean = codeToSearch.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setStudent(null);

    try {
      const res = await fetch(`/api/results/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 404 ? t.results.notFound : data.error || t.results.notFound);
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
    if (initialId && /^\d{6}$/.test(initialId.trim())) {
      performLookup(initialId.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(studentId);
  };

  const getBranchName = (s: StudentLookupResult) => {
    if (locale === 'RU') return s.branch_name_ru || s.branch_name_ro;
    if (locale === 'EN') return s.branch_name_en || s.branch_name_ro;
    return s.branch_name_ro;
  };

  const resultsPublishDate =
    locale === 'RU'
      ? `${settings.stage3_date_ru} / ${settings.stage4_date_ru}`
      : locale === 'EN'
      ? `${settings.stage3_date_en} / ${settings.stage4_date_en}`
      : `${settings.stage3_date_ro} / ${settings.stage4_date_ro}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-3 text-amber-300">
            <FileSearch className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {t.results.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            {t.results.subtitle}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t.results.inputPlaceholder}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-xl font-extrabold tracking-widest text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading || studentId.length !== 6}
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-lumina-600 hover:from-indigo-700 hover:to-lumina-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base shadow-md transition-all shrink-0"
            >
              {loading ? t.results.searching : t.results.searchBtn}
            </button>
          </form>

          {/* Quick Demo IDs for testing */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>{t.results.demoHint}</span>
            {['201001', '105001'].map((demoId) => (
              <button
                key={demoId}
                type="button"
                onClick={() => {
                  setStudentId(demoId);
                  performLookup(demoId);
                }}
                className="font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                {demoId}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-6 max-w-xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold text-center">
              {error}
            </div>
          )}
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
                      [{student.branch_code}] {getBranchName(student)} ({student.branch_address})
                    </strong>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <OmrIdPreview studentCode={student.student_code} compact />
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
                    href={`/api/results/${student.student_code}/pdf?download=1`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    {t.results.downloadPdfBtn}
                  </a>

                  <a
                    href={`/api/results/${student.student_code}/pdf`}
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
                  src={`/api/results/${student.student_code}/pdf`}
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
