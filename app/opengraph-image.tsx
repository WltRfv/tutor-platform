import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Репетитор | Математика и Информатика';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
          fontFamily: 'system-ui',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
            padding: '16px 32px',
            borderRadius: '999px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            color: '#e9d5ff',
            fontSize: '24px',
          }}
        >
          ✨ Индивидуальные занятия онлайн
        </div>

        <div
          style={{
            fontSize: '88px',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Математика и</span>
          <span
            style={{
              background: 'linear-gradient(90deg, #c084fc 0%, #60a5fa 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Информатика
          </span>
        </div>

        <div
          style={{
            fontSize: '32px',
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.3,
          }}
        >
          Подготовка к ОГЭ, ВПР и школьная программа 5–9 класс
        </div>

        <div
          style={{
            marginTop: '48px',
            fontSize: '28px',
            color: '#10b981',
            fontWeight: 600,
          }}
        >
          🎁 Первое занятие — бесплатно
        </div>
      </div>
    ),
    { ...size }
  );
}