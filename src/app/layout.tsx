import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://luminamath.orizont.md'),
  title: {
    default: 'LuminaMath Moldova — Concursul Național de Matematică',
    template: '%s | LuminaMath Moldova',
  },
  description:
    'Concursul Național de Matematică LuminaMath Moldova pentru elevii claselor III – VIII (IPLT „Orizont” • Chișinău, Bălți, Ceadîr-Lunga). Înregistrare online gratuită și rezultate oficiale PDF.',
  applicationName: 'LuminaMath Moldova',
  keywords: [
    'LuminaMath',
    'LuminaMath Moldova',
    'Concursul Național de Matematică',
    'Olimpiada de Matematică Moldova',
    'IPLT Orizont',
    'Liceul Teoretic Orizont',
    'luminamath.orizont.md',
    'luminamath.md',
    'Clasele III-VIII',
  ],
  authors: [{ name: 'IPLT „Orizont” — LuminaMath Moldova' }],
  creator: 'IPLT „Orizont”',
  publisher: 'LuminaMath Moldova',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logos/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'ro_MD',
    alternateLocale: ['ru_MD', 'en_US'],
    url: 'https://luminamath.orizont.md',
    siteName: 'LuminaMath Moldova',
    title: 'LuminaMath Moldova — Concursul Național de Matematică (Clasele III – VIII)',
    description:
      'Platforma oficială de înregistrare și rezultate PDF pentru Concursul Național de Matematică LuminaMath Moldova organizat de IPLT „Orizont”.',
    images: [
      {
        url: '/logos/LuminaMath-Logo.svg',
        width: 600,
        height: 120,
        alt: 'LuminaMath Moldova — Concursul Național de Matematică',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LuminaMath Moldova — Concursul Național de Matematică',
    description:
      'Concursul Național de Matematică LuminaMath Moldova pentru clasele III – VIII (IPLT „Orizont”). Înregistrare gratuită și rezultate PDF.',
    images: ['/logos/LuminaMath-Logo.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
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
