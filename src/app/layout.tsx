import type { Metadata } from 'next';
import { Cormorant, Jost } from 'next/font/google';

import { SCRIPT_TEMA } from '@/lib/tema';

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
    // `data-tema` no se declara aquí a propósito: si React lo renderiza, lo
    // considera suyo y al hidratar lo devuelve al valor del servidor, borrando el
    // tema que acaba de aplicar el script. Sin atributo, la hoja de estilos usa
    // el tema oscuro; el script sólo lo escribe si hay uno guardado.
    <html
      lang="es"
      className={`${cormorant.variable} ${jost.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
