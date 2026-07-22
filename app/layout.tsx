import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BranchChat · Gemini × Grok 3-Way Chat',
  description:
    'A user-moderated, branching 3-way chat interface between you and two AI agents — Gemini and Grok.',
  manifest: '/manifest.json',
  applicationName: 'BranchChat',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BranchChat',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'BranchChat · Gemini × Grok 3-Way Chat',
    description:
      'A user-moderated, branching 3-way chat interface between you and two AI agents.',
    type: 'website',
  },
};

export const themeColor = '#0f172a';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.className} bg-slate-900 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
