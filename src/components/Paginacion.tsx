import Link from 'next/link';

import { urlPagina } from '@/lib/rutas';

type Props = {
  /** Página a la vista, base 1. */
  pagina: number;
  paginas: number;
  /** Número correlativo (base 1) de la primera y la última prenda a la vista. */
  desde: number;
  hasta: number;
  total: number;
  /** Ruta de la sección: `/` o `/seccion/<slug>`. */
  href: string;
  nombreSeccion: string;
};

/**
 * Números a la vista: la primera, la última, la actual y sus vecinas. Los
 * huecos se marcan con `null` y se pintan como «…», para que una sección con
 * muchas páginas no desborde la fila.
 */
function ventana(pagina: number, paginas: number): (number | null)[] {
  if (paginas <= 7) {
    return Array.from({ length: paginas }, (_, i) => i + 1);
  }

  const cerca = new Set([1, paginas, pagina - 1, pagina, pagina + 1]);

  // En los extremos no hay vecinas de un lado: se rellena por el otro para que
  // la fila no cambie de ancho al pasar de página.
  if (pagina <= 3) {
    [2, 3, 4].forEach((n) => cerca.add(n));
  }
  if (pagina >= paginas - 2) {
    [paginas - 3, paginas - 2, paginas - 1].forEach((n) => cerca.add(n));
  }

  const numeros = [...cerca].filter((n) => n >= 1 && n <= paginas).sort((a, b) => a - b);

  return numeros.flatMap((n, i) => (i > 0 && n - numeros[i - 1] > 1 ? [null, n] : [n]));
}

const dosDigitos = (n: number) => String(n).padStart(2, '0');

const FLECHA =
  'px-2 py-2 text-[10px] uppercase tracking-label transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * Paginación de una sección. Son enlaces de verdad, no botones: la página vive
 * en la URL (`?pagina=2`), así que se puede compartir, marcar y volver atrás.
 */
export default function Paginacion({
  pagina,
  paginas,
  desde,
  hasta,
  total,
  href,
  nombreSeccion,
}: Props) {
  return (
    <nav
      aria-label={`Páginas de ${nombreSeccion}`}
      className="no-print mb-14 flex flex-col items-center gap-3.5"
    >
      {/* En móvil, con muchas páginas, la fila envuelve en vez de desbordarse. */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {pagina > 1 ? (
          <Link href={urlPagina(href, pagina - 1)} rel="prev" className={`${FLECHA} text-muted hover:text-ink`}>
            ‹ Anterior
          </Link>
        ) : (
          <span aria-hidden className={`${FLECHA} text-muted opacity-30`}>
            ‹ Anterior
          </span>
        )}

        {ventana(pagina, paginas).map((n, i) =>
          n === null ? (
            <span key={`hueco-${i}`} aria-hidden className="px-1 text-[13px] text-muted">
              …
            </span>
          ) : n === pagina ? (
            // La página abierta no es enlace: se marca con el filete de abajo,
            // el mismo recurso que la línea bajo el nombre de la sección.
            <span
              key={n}
              aria-current="page"
              className="flex h-9 min-w-9 items-center justify-center border-b border-b-ink px-2 font-serif text-[17px] italic leading-none text-ink"
            >
              {dosDigitos(n)}
            </span>
          ) : (
            <Link
              key={n}
              href={urlPagina(href, n)}
              aria-label={`Página ${n}`}
              className="flex h-9 min-w-9 items-center justify-center border-b border-b-transparent px-2
                         font-serif text-[17px] italic leading-none text-muted transition-colors hover:text-ink
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {dosDigitos(n)}
            </Link>
          ),
        )}

        {pagina < paginas ? (
          <Link href={urlPagina(href, pagina + 1)} rel="next" className={`${FLECHA} text-muted hover:text-ink`}>
            Siguiente ›
          </Link>
        ) : (
          <span aria-hidden className={`${FLECHA} text-muted opacity-30`}>
            Siguiente ›
          </span>
        )}
      </div>

      <p className="m-0 text-[10px] uppercase tracking-label text-muted">
        {dosDigitos(desde)} – {dosDigitos(hasta)} de {dosDigitos(total)}
      </p>
    </nav>
  );
}
