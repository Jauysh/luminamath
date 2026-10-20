import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'LuminaMath Moldova (luminamath.md) — Concursul Național de Matematică',
  description:
    'Platforma oficială de înregistrare și rezultate PDF pentru concursul de matematică LuminaMath Moldova (Clasele II – VIII, Chișinău: Lumina & Durlești).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
