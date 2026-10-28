import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://luminamath.orizont.md'),
  title: {
    default:
      'LuminaMath Moldova — Concursul Național de Matematică (Clasele III – VIII) | IPLT „Orizont”',
    template: '%s | LuminaMath Moldova',
  },
  description:
    'Concursul Național de Matematică LuminaMath Moldova (Ediția 2026–2027) pentru elevii claselor III – VIII, organizat de IPLT „Orizont” (Chișinău, Bălți, Ceadîr-Lunga). Înscriere online 100% gratuită (05 – 25 Noiembrie 2026), examen pe 28 Noiembrie 2026 și rezultate oficiale PDF. Национальная математическая олимпиада LuminaMath Молдова (3–8 классы).',
  applicationName: 'LuminaMath Moldova',
  category: 'education',
  keywords: [
    'LuminaMath',
    'LuminaMath Moldova',
    'LuminaMath Orizont',
    'luminamath.orizont.md',
    'luminamath.md',
    'Concursul Național de Matematică',
    'Concurs de matematica Moldova 2026',
    'Olimpiada de Matematică Moldova',
    'Olimpiada matematica clasele 3-8',
    'IPLT Orizont',
    'Liceul Teoretic Orizont concurs matematica',
    'Олимпиада по математике Молдова',
    'Национальная математическая олимпиада LuminaMath',
    'Математический конкурс Оризонт Молдова',
    'ЛуминаМат Молдова регистрация результаты',
    'LuminaMath National Mathematics Competition Moldova',
    'Orizont Lyceum math competition',
  ],
  authors: [{ name: 'IPLT „Orizont” — LuminaMath Moldova', url: 'https://luminamath.orizont.md' }],
  creator: 'Instituția Privată Liceul Teoretic „Orizont”',
  publisher: 'LuminaMath Moldova — IPLT „Orizont”',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://luminamath.orizont.md',
    languages: {
      'ro-MD': 'https://luminamath.orizont.md',
      'ru-MD': 'https://luminamath.orizont.md',
      'en-US': 'https://luminamath.orizont.md',
    },
  },
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
    title:
      'LuminaMath Moldova — Concursul Național de Matematică (Clasele III – VIII) • IPLT „Orizont”',
    description:
      'Înscriere online 100% gratuită (05 – 25 Noiembrie 2026) și rezultate PDF pentru Concursul Național de Matematică LuminaMath Moldova (Examen: 28 Noiembrie 2026). Национальная математическая олимпиада для 3–8 классов.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LuminaMath Moldova — Concursul Național de Matematică (Clasele III – VIII)',
    description:
      'Concursul Național de Matematică LuminaMath Moldova organizat de IPLT „Orizont”. Înscriere gratuită (05 – 25 Noiembrie 2026), examen pe 28 Noiembrie 2026 și rezultate PDF.',
  },
};

const jsonLdGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://luminamath.orizont.md/#organization',
      name: 'LuminaMath Moldova — IPLT „Orizont”',
      alternateName: [
        'Concursul Național de Matematică LuminaMath Moldova',
        'Национальная математическая олимпиада LuminaMath Молдова',
        'Instituția Privată Liceul Teoretic „Orizont”',
      ],
      url: 'https://luminamath.orizont.md',
      logo: 'https://luminamath.orizont.md/logos/LuminaMath-Logo.svg',
      email: 'luminamath@orizont.md',
      telephone: '+37379000073',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Str. Ion Pelivan 13/A',
        addressLocality: 'Chișinău',
        postalCode: 'MD-2064',
        addressCountry: 'MD',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://luminamath.orizont.md/#website',
      url: 'https://luminamath.orizont.md',
      name: 'LuminaMath Moldova',
      inLanguage: ['ro-MD', 'ru-MD', 'en-US'],
      publisher: {
        '@id': 'https://luminamath.orizont.md/#organization',
      },
    },
    {
      '@type': 'EducationEvent',
      '@id': 'https://luminamath.orizont.md/#event-2026',
      name: 'Concursul Național de Matematică LuminaMath Moldova (Clasele III – VIII)',
      alternateName:
        'Национальная математическая олимпиада LuminaMath Молдова (3 – 8 классы)',
      description:
        'Concurs național de matematică cu participare 100% gratuită pentru elevii claselor III – VIII din Republica Moldova, organizat de IPLT „Orizont” în Chișinău, Bălți și Ceadîr-Lunga.',
      startDate: '2026-11-28T10:00:00+02:00',
      endDate: '2026-11-28T12:00:00+02:00',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: true,
      inLanguage: ['ro', 'ru', 'en'],
      organizer: {
        '@id': 'https://luminamath.orizont.md/#organization',
      },
      offers: {
        '@type': 'Offer',
        url: 'https://luminamath.orizont.md/register',
        price: '0',
        priceCurrency: 'MDL',
        availability: 'https://schema.org/InStock',
        validFrom: '2026-11-05T00:00:00+02:00',
        validThrough: '2026-11-25T23:59:59+02:00',
      },
      location: [
        {
          '@type': 'Place',
          name: 'IPLT „Orizont” — Filiala Buiucani (Chișinău)',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Str. Ion Pelivan 13/A',
            addressLocality: 'Chișinău',
            postalCode: 'MD-2064',
            addressCountry: 'MD',
          },
        },
        {
          '@type': 'Place',
          name: 'IPLT „Orizont” — Filiala Ciocana Primary (Chișinău)',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Str. Mircea cel Bătrân 10/2',
            addressLocality: 'Chișinău',
            postalCode: 'MD-2044',
            addressCountry: 'MD',
          },
        },
        {
          '@type': 'Place',
          name: 'IPLT „Orizont” — Filiala Bălți',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Str. Chișinăului 28',
            addressLocality: 'Bălți',
            postalCode: 'MD-3310',
            addressCountry: 'MD',
          },
        },
        {
          '@type': 'Place',
          name: 'IPLT „Orizont” — Filiala Ceadîr-Lunga',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Str. Lenin 87',
            addressLocality: 'Ceadîr-Lunga',
            postalCode: 'MD-6104',
            addressCountry: 'MD',
          },
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://luminamath.orizont.md/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Când are loc Concursul Național de Matematică LuminaMath Moldova și cum mă înscriu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Înscrierea online este 100% gratuită și are loc în perioada 05 – 25 Noiembrie 2026 pe platforma oficială https://luminamath.orizont.md/register. Examenul scris se desfășoară pe 28 Noiembrie 2026 (ora 10:00 – 12:00), iar rezultatele oficiale PDF sunt afișate în decurs de 10 zile (până pe 08 Decembrie 2026).',
          },
        },
        {
          '@type': 'Question',
          name: 'Cine poate participa la concursul LuminaMath Moldova și în ce limbi se dau subiectele?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pot participa toți elevii din clasele a III-a, a IV-a, a V-a, a VI-a, a VII-a și a VIII-a din școlile publice și private din Republica Moldova. Subiectele sunt disponibile în 3 limbi, la alegerea elevului: Română (RO), Rusă (RU) și Engleză (EN).',
          },
        },
        {
          '@type': 'Question',
          name: 'Когда проходит олимпиада LuminaMath в Молдове и как зарегистрироваться?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Бесплатная онлайн-регистрация учеников 3 – 8 классов открыта с 05 по 25 Ноября 2026 года на сайте https://luminamath.orizont.md/register. Письменный экзамен состоится 28 Ноября 2026 года (10:00 – 12:00) в 4 филиалах лицея «Orizont» (Кишинёв Чеканы, Кишинёв Буюканы, Бельцы, Чадыр-Лунга). Результаты публикуются в течение 10 дней на https://luminamath.orizont.md/results.',
          },
        },
        {
          '@type': 'Question',
          name: 'Cum verific rezultatele și cum descarc fișa PDF (Karne) și Certificatul de Participare?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Accesați https://luminamath.orizont.md/results și introduceți ID-ul din 6 cifre și Codul PIN primit la înregistrare. Dacă ați uitat ID-ul sau PIN-ul, le puteți recupera instant pe email direct din pagina de rezultate.',
          },
        },
      ],
    },
  ],
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
        <link rel="help" type="text/plain" href="/llms.txt" title="LLM Knowledge Base" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          {/* Server-Rendered Trilingual SEO & AI Search Summary Block for Crawlers */}
          <section
            className="sr-only"
            aria-label="LuminaMath Moldova — Informații Oficiale (RO / RU / EN)"
          >
            <h2>
              LuminaMath Moldova — Concursul Național de Matematică (Clasele III – VIII) |
              Национальная математическая олимпиада LuminaMath Молдова (3 – 8 классы)
            </h2>
            <p>
              Organizator: Instituția Privată Liceul Teoretic „Orizont” (IPLT „Orizont”),
              Republica Moldova. Participare 100% gratuită pentru elevii claselor 3, 4, 5, 6, 7
              și 8. Limbile testului: Română (RO), Rusă (RU), Engleză (EN).
            </p>
            <ul>
              <li>
                Înscriere Online / Онлайн-регистрация / Online Registration (05 – 25 Noiembrie
                2026): https://luminamath.orizont.md/register
              </li>
              <li>
                Examen Scris / Письменный экзамен / Written Exam: 28 Noiembrie 2026, 10:00 –
                12:00 (Chișinău Ciocana Primary, Chișinău Buiucani, Bălți, Ceadîr-Lunga)
              </li>
              <li>
                Rezultate Oficiale PDF & Certificate / Проверка результатов / Results (până pe
                08 Decembrie 2026, în 10 zile): https://luminamath.orizont.md/results
              </li>
              <li>
                Contact Oficial: luminamath@orizont.md | Telefon: +373 (79) 000 073
              </li>
            </ul>
          </section>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
