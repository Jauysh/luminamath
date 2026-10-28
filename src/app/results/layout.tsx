import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Rezultate Oficiale PDF & Certificate | Проверка результатов LuminaMath Moldova',
  description:
    'Verificați și descărcați rezultatul personal PDF (fișa optică OMR / Karne), Permisul de Acces și Certificatul de Participare la Concursul Național de Matematică LuminaMath Moldova folosind ID-ul din 6 cifre și Codul PIN.',
  keywords: [
    'LuminaMath rezultate',
    'rezultate LuminaMath Moldova 2026',
    'результаты LuminaMath Молдова',
    'результаты олимпиады по математике Orizont',
    'LuminaMath results PDF',
    'verificare rezultate LuminaMath',
  ],
  alternates: {
    canonical: 'https://luminamath.orizont.md/results',
  },
  openGraph: {
    title: 'Rezultate Oficiale PDF & Certificate — LuminaMath Moldova',
    description:
      'Portalul oficial de verificare a rezultatelor PDF și descărcare a certificatelor pentru Concursul Național de Matematică LuminaMath Moldova (IPLT „Orizont”).',
    url: 'https://luminamath.orizont.md/results',
    type: 'website',
  },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
