import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Înregistrare Online (Clasele III – VIII) | Регистрация на олимпиаду LuminaMath Moldova',
  description:
    'Formularul oficial de înregistrare gratuită la Concursul Național de Matematică LuminaMath Moldova (05 – 25 Noiembrie 2026). Obțineți instant ID-ul din 6 cifre și Permisul PDF cu QR. Бесплатная онлайн-регистрация учеников 3–8 классов (Лицей Orizont).',
  keywords: [
    'LuminaMath înregistrare',
    'inscriere LuminaMath Moldova',
    'регистрация LuminaMath Молдова',
    'олимпиада по математике Молдова регистрация',
    'LuminaMath Orizont register',
    'concurs matematica clasele 3-8 inscriere',
  ],
  alternates: {
    canonical: 'https://luminamath.orizont.md/register',
  },
  openGraph: {
    title: 'Înregistrare Online Gratuită — LuminaMath Moldova (Clasele III – VIII)',
    description:
      'Înscrie-te gratuit între 05 – 25 Noiembrie 2026 la Concursul Național de Matematică LuminaMath Moldova organizat de IPLT „Orizont”. Examen: 28 Noiembrie 2026.',
    url: 'https://luminamath.orizont.md/register',
    type: 'website',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
