'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES } from '@/lib/i18n';
import { useLanguage } from '@/context/LanguageContext';
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between py-3 sm:py-3.5 gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-700 via-lumina-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <span className="font-black text-lg sm:text-xl tracking-tight">∑</span>
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900">
                Lumina<span className="text-indigo-600">Math</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-sm">
                .MD
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              {t.nav.subtitle}
            </p>
          </div>
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
                  className="ml-1.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-lumina-600 text-white hover:from-indigo-700 hover:to-lumina-700 shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
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
                  className="ml-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-100/70'
                }`}
              >
                <Icon className="w-4 h-4 opacity-75" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher + Mobile Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => setLocale(loc.code)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all flex items-center gap-1 ${
                  locale === loc.code
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-sm font-extrabold transition-all ${
                  item.highlight
                    ? 'bg-gradient-to-r from-indigo-600 to-lumina-600 text-white shadow-sm'
                    : item.highlightSecondary
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 justify-start'
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
