'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES } from '@/lib/i18n';
import { useLanguage } from '@/context/LanguageContext';
import { LuminaMathLogo } from '@/components/LuminaBrand';
import {
  Award,
  Calendar,
  FileSearch,
  GraduationCap,
  Menu,
  UserPlus,
  X,
} from 'lucide-react';

export function Navbar() {
  const { locale, setLocale, t } = useLanguage();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/', label: t.nav.home, icon: GraduationCap },
    { href: '/#calendar', label: t.nav.calendar, icon: Calendar },
    { href: '/#rules', label: t.nav.rules, icon: Award },
    { href: '/register', label: t.nav.register, icon: UserPlus, highlight: true },
    { href: '/results', label: t.nav.results, icon: FileSearch, highlightSecondary: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FFFDF9]/95 backdrop-blur-xl border-b-2 border-orange-200/80 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between py-2.5 sm:py-3 gap-2">
        {/* Official LuminaMath Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <LuminaMathLogo className="h-9 sm:h-11 w-auto group-hover:scale-[1.02] transition-transform" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ml-1.5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#EB5A24] to-[#F58220] text-white hover:from-[#d94e1b] hover:to-[#e07114] shadow-md shadow-orange-500/25 transition-all hover:-translate-y-0.5"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            }

            if (item.highlightSecondary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ml-1 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-[#1B56A5] text-white hover:bg-[#144484] shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                >
                  <Icon className="w-4 h-4 text-[#F5B316]" />
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                  isActive
                    ? 'bg-orange-100/80 text-[#EB5A24]'
                    : 'text-slate-700 hover:text-[#1B56A5] hover:bg-orange-50/70'
                }`}
              >
                <Icon className="w-4 h-4 opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher + Mobile Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center bg-orange-50/90 p-0.5 sm:p-1 rounded-xl border border-orange-200">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => setLocale(loc.code)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 ${
                  locale === loc.code
                    ? 'bg-[#EB5A24] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title={loc.nativeName}
              >
                <span className="hidden sm:inline">{loc.flag}</span>
                <span>{loc.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-orange-100/60 active:scale-95 transition-transform"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-orange-200 bg-[#FFFDF9] px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                  item.highlight
                    ? 'bg-gradient-to-r from-[#EB5A24] to-[#F58220] text-white shadow-sm'
                    : item.highlightSecondary
                    ? 'bg-[#1B56A5] text-white shadow-sm'
                    : 'text-slate-800 hover:bg-orange-50 justify-start'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
