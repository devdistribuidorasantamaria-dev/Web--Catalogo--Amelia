import Image from 'next/image';
import Link from 'next/link';

import BotonTema from '@/components/BotonTema';
import type { EntradaSeccion } from '@/lib/rutas';

type Props = {
  logoUrl: string | null;
  logoAncho: number | null;
  logoAlto: number | null;
  /** Una entrada por sección con prendas, en el orden del catálogo. */
  entradas: EntradaSeccion[];
  /** Slug de la sección abierta; null en el catálogo vacío. */
  activo: string | null;
};

/**
 * Barra superior del catálogo público: logotipo a la izquierda, una entrada por
 * sección y, a la derecha, tema e impresión. Cada sección es una página, así
 * que son enlaces de navegación y la abierta va marcada. La edición vive en el
 * panel de Laravel, así que aquí no hay nada de escritura.
 */
export default function Toolbar({ logoUrl, logoAncho, logoAlto, entradas, activo }: Props) {
  return (
    <div className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-[8px]">
      {/*
        En pantallas angostas las secciones no entran junto al logotipo y los
        botones: la barra envuelve y las manda a una segunda línea completa, en
        vez de dejarlas recortadas a dos letras.
      */}
      {/*
        La barra no usa `wrap`: va de filo a filo, con el logotipo pegado al
        borde izquierdo y los botones al derecho, aunque el catálogo de abajo
        siga centrado en 1120px.
      */}
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-1 px-8 py-2 max-[480px]:px-5 sm:h-[68px] sm:flex-nowrap sm:py-0">
        <Link
          href="/"
          aria-label="Amelia Boutique — volver al inicio"
          className="order-1 flex shrink-0 items-center"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Amelia Boutique"
              width={logoAncho ?? 472}
              height={logoAlto ?? 247}
              // Igual que en la cabecera: sin optimizar para que el negro llegue
              // exacto, y .logo-marca lo invierte en el tema claro.
              unoptimized
              className="logo-marca h-[46px] w-auto"
            />
          ) : (
            <span className="font-serif text-lg tracking-wide">
              Amelia <span className="text-muted">·</span>{' '}
              <span className="text-[11px] uppercase tracking-label text-muted">Catálogo</span>
            </span>
          )}
        </Link>

        {/* Con muchas secciones la lista se desplaza de lado, sin barra a la vista. */}
        {entradas.length > 0 ? (
          <nav
            aria-label="Secciones del catálogo"
            className="order-3 w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1"
          >
            <ul className="barra-secciones flex items-center gap-5 overflow-x-auto">
              {entradas.map((entrada) => {
                const abierta = entrada.slug === activo;

                return (
                  <li key={entrada.slug} className="shrink-0">
                    <Link
                      href={entrada.href}
                      aria-current={abierta ? 'page' : undefined}
                      // La sección abierta se marca con el filete de abajo, el
                      // mismo recurso que la línea bajo su nombre.
                      className={`block whitespace-nowrap border-b py-2 text-[12px] uppercase tracking-label
                                  transition-colors hover:text-ink
                                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                                    abierta
                                      ? 'border-b-ink text-ink'
                                      : 'border-b-transparent text-muted'
                                  }`}
                    >
                      {entrada.nombre}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : (
          <div className="order-3 sm:order-2 sm:flex-1" />
        )}

        <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3 sm:ml-0">
          <BotonTema />

          {/*
            El PDF es del catálogo entero, no de la sección abierta: vive en
            /imprimir, que arma todas las secciones seguidas y abre el diálogo.
          */}
          <Link href="/imprimir" className="btn">
            Imprimir / PDF
          </Link>
        </div>
      </div>
    </div>
  );
}
