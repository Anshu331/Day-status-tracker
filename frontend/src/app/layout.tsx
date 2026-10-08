import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Day Status Tracker', template: '%s · Day Status Tracker' },
  description: 'Record how each day went and browse any day on a public calendar.',
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
