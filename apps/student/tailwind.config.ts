import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        quran: ['KingFahdQuran', 'KFGQPC HAFS Uthmanic Script', 'KFGQPC Uthmanic Script', 'var(--font-quran)', 'Amiri Quran', 'Scheherazade New', 'Noto Naskh Arabic', 'serif'],
        nastaliq: ['Noto Nastaliq Urdu', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1A4E8A',
          800: '#0D3460',
          900: '#0A2540',
        },
        accent: {
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        hot: {
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
        },
        gold: {
          100: '#FEF3C7',
          500: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
};

export default config;
