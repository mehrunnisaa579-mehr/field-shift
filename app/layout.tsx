import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import './globals.css';

const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['opsz'] });

export const metadata: Metadata = {
  title: 'Field Shift | Adapting Farms with Iowa\'s 99 Counties',
  description:
    'Compare crop rotation scenarios across every Iowa county using NASA climate data and Spatial Intelligence scores.',
};

export const viewport: Viewport = { themeColor: '#0a100c', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
