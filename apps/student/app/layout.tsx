import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import '../styles/quran-text.css';
import { AccountNav } from '@/components/AccountNav';
import { getUser } from '@studyvault/lib/auth/server';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const quranFont = localFont({
  src: '../public/fonts/quran/UthmanicHafs1Ver18.woff2',
  variable: '--font-quran',
  display: 'block',
  preload: true,
  fallback: ['serif'],
});

export const metadata: Metadata = {
  title: { default: 'StudyVault PK', template: '%s | StudyVault PK' },
  description: "Pakistan's smartest board exam prep platform",
};

import { Providers } from '@/components/Providers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const fontsLoaded = true; // In Next.js 16, font loading is automatic
  const initialUser = await getUser();
  
  return (
    <html lang="en" dir="ltr" className={`${playfair.variable} ${dmSans.variable} ${quranFont.variable}`} suppressHydrationWarning>
      <body className="font-body bg-white text-gray-900 antialiased">
        <Providers>
          <AccountNav initialUser={initialUser ? {
            name: initialUser.name,
            email: initialUser.email,
          } : null} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
