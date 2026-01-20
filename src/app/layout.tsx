/**
 * Root Layout
 * Next.js App Router root layout
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OnlineAccess',
  description: 'MoveConnect OnlineAccess Application',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
