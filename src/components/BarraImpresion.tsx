'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

/**
 * Barra de la vista de impresión: al llegar abre el diálogo del navegador, y
 * deja a mano volver al catálogo o pedirlo otra vez si se cerró sin imprimir.
 */
export default function BarraImpresion() {
  const abierto = useRef(false);

  useEffect(() => {
    // StrictMode monta el efecto dos veces en desarrollo; el ref evita que el
    // diálogo se pida dos veces.
    if (abierto.current) {
      return;
    }

    abierto.current = true;

    // Un margen para que las fuentes y las primeras fotos estén listas: lo que
    // no ha pintado no sale en el PDF.
    const espera = setTimeout(() => window.print(), 600);

    return () => clearTimeout(espera);
  }, []);

  return (
    <div className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-[8px]">
      <div className="wrap flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="m-0 text-[10px] uppercase tracking-label text-muted">
          Catálogo completo · listo para imprimir
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" className="btn">
            Volver al catálogo
          </Link>

          <button type="button" className="btn" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
