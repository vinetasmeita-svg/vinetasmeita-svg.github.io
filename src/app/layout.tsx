import type { Metadata } from 'next';
import { Playfair_Display, DM_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/context';
import Header from '@/components/Header';
import { lv } from '@/lib/i18n/lv';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
});
const dmMono = DM_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: `${lv.app.name} — ${lv.app.tagline}`,
  description: lv.landing.about,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv" className={`${playfair.variable} ${dmMono.variable}`}>
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
