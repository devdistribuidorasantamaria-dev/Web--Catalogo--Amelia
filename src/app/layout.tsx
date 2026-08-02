import type { Metadata } from 'next';
import { Cormorant, Jost } from 'next/font/google';

import './globals.css';

const cormorant = Cormorant({
  variable: '--font-cormorant',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Amelia Boutique — Catálogo',
  description: 'Catálogo de prendas de Amelia Boutique · Santo Domingo, Ecuador.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${jost.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
