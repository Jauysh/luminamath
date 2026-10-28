import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt =
  'LuminaMath Moldova — Concursul Național de Matematică (Clasele III – VIII) • IPLT Orizont';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1E296B 0%, #2C3987 55%, #172052 100%)',
          color: '#ffffff',
          padding: '56px 68px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Row: Organizer & Free Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
              borderRadius: '999px',
              padding: '10px 26px',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            IPLT „ORIZONT” • REPUBLICA MOLDOVA
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#10B981',
              color: '#052E16',
              borderRadius: '999px',
              padding: '10px 28px',
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            100% GRATUIT • CLASELE III – VIII
          </div>
        </div>

        {/* Center Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              fontSize: 74,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <span>LuminaMath</span>
            <span style={{ color: '#F59122' }}>Moldova</span>
          </div>

          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: '#FDE68A',
              lineHeight: 1.25,
            }}
          >
            Concursul Național de Matematică • Национальная Олимпиада
          </div>

          <div
            style={{
              fontSize: 24,
              color: '#E0E7FF',
              lineHeight: 1.4,
              maxWidth: '980px',
            }}
          >
            Chișinău (Ciocana, Buiucani) • Bălți • Ceadîr-Lunga | Limba: RO • RU • EN
          </div>
        </div>

        {/* Bottom Schedule Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '2px solid rgba(245, 145, 34, 0.55)',
            borderRadius: '24px',
            padding: '22px 32px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#94A3B8', fontWeight: 700 }}>
              ÎNSCRIERE ONLINE / РЕГИСТРАЦИЯ
            </span>
            <span style={{ fontSize: 26, color: '#FFFFFF', fontWeight: 800 }}>
              05 – 25 Noiembrie 2026
            </span>
          </div>

          <div
            style={{
              width: '2px',
              height: '48px',
              background: 'rgba(255,255,255,0.2)',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#94A3B8', fontWeight: 700 }}>
              EXAMEN SCRIS / ЭКЗАМЕН
            </span>
            <span style={{ fontSize: 26, color: '#F59122', fontWeight: 800 }}>
              28 Noiembrie 2026 (10:00)
            </span>
          </div>

          <div
            style={{
              width: '2px',
              height: '48px',
              background: 'rgba(255,255,255,0.2)',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#94A3B8', fontWeight: 700 }}>
              PORTAL OFICIAL
            </span>
            <span style={{ fontSize: 26, color: '#38BDF8', fontWeight: 800 }}>
              luminamath.orizont.md
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
