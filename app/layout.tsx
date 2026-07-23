import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '3Way Lite · You × Gemini × Grok',
  description:
    'A user-paced three-way chat room with you, Gemini, and Grok sharing one transcript.',
  manifest: '/manifest.json',
  applicationName: '3Way Lite',
  themeColor: '#0f172a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '3Way Lite',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.ico', sizes: 'any' },
    ],
    apple: '/icon-192.png',
    shortcut: '/icon.ico',
  },
  openGraph: {
    title: '3Way Lite · You × Gemini × Grok',
    description:
      'A user-paced three-way chat room with you, Gemini, and Grok sharing one transcript.',
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: '3Way Lite' }],
  },
};

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
          content="width=device-width, initial-scale=1"
        />
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
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
