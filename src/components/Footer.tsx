'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  const { t, settings } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black">
                ∑
              </div>
              <span className="font-black text-xl text-white">
                LuminaMath <span className="text-amber-400">Moldova</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t.hero.subtitle}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4">
              LuminaMath • {settings.edition}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#calendar" className="hover:text-white transition-colors">
                  {t.nav.calendar}
                </Link>
              </li>
              <li>
                <Link href="/#rules" className="hover:text-white transition-colors">
                  {t.nav.rules}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  {t.nav.register}
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-white transition-colors">
                  {t.nav.results}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4">
              {t.footer.contact}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Chișinău (Ciocana, Buiucani) • Bălți • Ceadîr-Lunga, Moldova</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings.contact_phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            © {settings.edition} LuminaMath Moldova (luminamath.md). {t.footer.rights}
          </p>
          <p>{t.footer.omrTagline}</p>
        </div>
      </div>
    </footer>
  );
}
