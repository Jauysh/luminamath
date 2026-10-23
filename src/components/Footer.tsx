'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LuminaMathLogo } from '@/components/LuminaBrand';
import { Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  const { t, settings } = useLanguage();

  return (
    <footer className="bg-[#FFFDF9] text-slate-700 border-t-4 border-[#EB5A24] print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 */}
          <div className="space-y-3">
            <div className="inline-block">
              <LuminaMathLogo className="h-11 w-auto" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-[#EB5A24] text-white text-[11px] font-black uppercase tracking-wider">
              Liceul Teoretic „Orizont” Moldova
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t.hero.subtitle}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1B56A5] mb-4">
              LuminaMath • {settings.edition}
            </h3>
            <ul className="space-y-2 text-sm font-bold">
              <li>
                <Link href="/#calendar" className="hover:text-[#EB5A24] transition-colors">
                  {t.nav.calendar}
                </Link>
              </li>
              <li>
                <Link href="/#rules" className="hover:text-[#EB5A24] transition-colors">
                  {t.nav.rules}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#EB5A24] transition-colors">
                  {t.nav.register}
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-[#EB5A24] transition-colors">
                  {t.nav.results}
                </Link>
              </li>
              <li>
                <Link href="/poster" className="text-[#EB5A24] hover:underline transition-colors">
                  Afiș Oficial / Poster (CLASELE II–VIII)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1B56A5] mb-4">
              {t.footer.contact}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-700 font-semibold">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#EB5A24] shrink-0 mt-0.5" />
                <span>Chișinău (Ciocana, Buiucani) • Bălți • Ceadîr-Lunga, Moldova</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#EB5A24] shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#EB5A24] shrink-0" />
                <span>{settings.contact_phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-orange-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-semibold gap-4">
          <p>
            © {settings.edition} LuminaMath Moldova (luminamath.md). {t.footer.rights}
          </p>
          <p className="text-[#1B56A5] font-bold">{t.footer.omrTagline}</p>
        </div>
      </div>
    </footer>
  );
}
