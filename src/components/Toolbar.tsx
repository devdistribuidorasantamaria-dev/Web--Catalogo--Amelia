'use client';

import BotonTema from '@/components/BotonTema';

/**
 * Barra superior del catálogo público. La edición vive en el panel de Laravel,
 * así que aquí sólo quedan el cambio de tema y la acción de imprimir / PDF.
 */
export default function Toolbar() {
  return (
    <div className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-[8px]">
      <div className="wrap flex h-[60px] items-center gap-3">
        <span className="font-serif text-lg tracking-wide">
          Amelia <span className="text-muted">·</span>{' '}
          <span className="text-[11px] uppercase tracking-label text-muted">Catálogo</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <BotonTema />

          <button type="button" className="btn" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
