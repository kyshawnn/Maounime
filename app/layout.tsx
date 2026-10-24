import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Streaming Anime Subtitle Indonesia',
  description: 'Nonton streaming anime subtitle Indonesia update tercepat dan lengkap.',
  openGraph: {
    title: 'Streaming Anime Subtitle Indonesia',
    description: 'Nonton streaming anime subtitle Indonesia update tercepat dan lengkap.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Streaming Anime Subtitle Indonesia',
    description: 'Nonton streaming anime subtitle Indonesia update tercepat dan lengkap.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#0a0a0a] text-neutral-100 min-h-screen antialiased selection:bg-neutral-800 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
