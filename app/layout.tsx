import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tutor-platform-khaki.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Репетитор | Математика и Информатика',
    template: '%s | Репетитор',
  },
  description:
    'Индивидуальные онлайн-занятия по математике и информатике. Подготовка к ОГЭ, ВПР и школьная программа 5–9 класс. Первое занятие — бесплатно.',
  keywords: [
    'репетитор',
    'математика',
    'информатика',
    'ОГЭ',
    'ВПР',
    'онлайн-занятия',
    'подготовка к экзаменам',
    '5-9 класс',
  ],
  authors: [{ name: 'Снежана' }],
  creator: 'Снежана',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: baseUrl,
    title: 'Репетитор | Математика и Информатика',
    description:
      'Индивидуальные онлайн-занятия по математике и информатике. Подготовка к ОГЭ, ВПР. Первое занятие — бесплатно.',
    siteName: 'Репетитор',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Репетитор | Математика и Информатика',
    description:
      'Индивидуальные онлайн-занятия. Подготовка к ОГЭ, ВПР. Первое занятие — бесплатно.',
  },
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}