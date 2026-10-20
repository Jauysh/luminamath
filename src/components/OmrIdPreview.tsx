'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface OmrIdPreviewProps {
  studentCode: string;
  compact?: boolean;
}

export function OmrIdPreview({ studentCode, compact = false }: OmrIdPreviewProps) {
  const { t } = useLanguage();
  const digits = studentCode
    .padEnd(6, '0')
    .slice(0, 6)
    .split('')
    .map((d) => Number(d) || 0);

  const labels = ['B', 'G1', 'G2', 'S1', 'S2', 'S3'];

  return (
    <div className="inline-block max-w-full bg-white border-2 border-indigo-100 rounded-2xl p-3 sm:p-4 shadow-md text-slate-900">
      <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 mb-2.5 text-center">
        {t.omr.gridTitle} • {studentCode}
      </div>

      {/* Breakdown legend */}
      <div className="grid grid-cols-6 gap-1 sm:gap-1.5 mb-2.5 text-center">
        {digits.map((digit, colIdx) => {
          const groupColor =
            colIdx === 0
              ? 'bg-amber-50 border-amber-400 text-amber-900'
              : colIdx <= 2
              ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
              : 'bg-emerald-50 border-emerald-400 text-emerald-900';

          return (
            <div key={colIdx} className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 mb-0.5">
                {labels[colIdx]}
              </span>
              <div
                className={`w-7 h-8 sm:w-8 sm:h-9 rounded-lg border-2 flex items-center justify-center font-mono text-base sm:text-lg font-black ${groupColor}`}
              >
                {digit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optical bubbles 0-9 */}
      {!compact && (
        <div className="grid grid-cols-6 gap-1.5 pt-2.5 border-t border-slate-100">
          {digits.map((activeDigit, colIdx) => (
            <div key={colIdx} className="flex flex-col items-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isFilled = num === activeDigit;
                return (
                  <div
                    key={num}
                    className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center border transition-all ${
                      isFilled
                        ? 'bg-indigo-950 border-indigo-950 text-white font-bold scale-110 shadow-sm'
                        : 'bg-rose-50/50 border-rose-200 text-rose-500'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 text-[10px] text-slate-600 font-semibold">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
          {t.omr.branchLegend} ({digits[0]})
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
          {t.omr.gradeLegend} ({digits[1]}
          {digits[2]})
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
          {t.omr.seqLegend} ({digits[3]}
          {digits[4]}
          {digits[5]})
        </span>
      </div>
    </div>
  );
}
