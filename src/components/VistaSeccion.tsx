import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import EncabezadoSeccion from '@/components/EncabezadoSeccion';
import FloatingActions from '@/components/FloatingActions';
import Footer from '@/components/Footer';
import Masthead from '@/components/Masthead';
import RegistroVisita from '@/components/RegistroVisita';
import PanelFiltros from '@/components/PanelFiltros';
import RejillaCargando from '@/components/RejillaCargando';
import RejillaSeccion from '@/components/RejillaSeccion';
import Toolbar from '@/components/Toolbar';
import { getCatalogo } from '@/lib/api';
import { facetas, filtrarPrendas, leerFiltros } from '@/lib/filtros';
import { paginaValida, totalPaginas } from '@/lib/paginacion';
import { navegacion } from '@/lib/rutas';

type Busqueda = Promise<{ [clave: string]: string | string[] | undefined }>;

type Props = {
  /** null = la primera sección del catálogo, la que vive en la raíz. */
  slug: string | null;
  searchParams: Busqueda;
};

/**
 * Página de una sección: barra, cabecera, encabezado de la sección y su rejilla
 * paginada. La usan la raíz (primera sección) y `/seccion/<slug>`.
 *
 * Todo lo que no depende del `?pagina=` se renderiza aquí, con los datos
 * cacheados del catálogo, para que se prerenderice; sólo la rejilla espera a la
 * URL, dentro de un `<Suspense>`. Sin esa frontera, leer `searchParams` obliga a
 * toda la ruta a resolverse en cada petición (ver `blocking-route` de Next 16).
 */
export default async function VistaSeccion({ slug, searchParams }: Props) {
  const catalogo = await getCatalogo();
  const entradas = navegacion(catalogo.bloques);

  const actual = slug === null ? entradas[0] : entradas.find((entrada) => entrada.slug === slug);

  // Sección que no existe (o slug de una que se borró): 404 de verdad, no una
  // página vacía que parezca un catálogo sin prendas.
  if (slug !== null && !actual) {
    notFound();
  }

  return (
    <>
      <Toolbar
        logoUrl={catalogo.logo_url}
        logoAncho={catalogo.logo_ancho}
        logoAlto={catalogo.logo_alto}
        entradas={entradas}
        activo={actual?.slug ?? null}
      />

      {/* No pinta nada: registra la visita desde el navegador. */}
      <RegistroVisita />

      <Masthead
        subtitulo={catalogo.subtitulo}
        logoUrl={catalogo.logo_url}
        logoAncho={catalogo.logo_ancho}
        logoAlto={catalogo.logo_alto}
      />

      <main className="wrap">
        {!actual ? (
          <div className="my-3.5 mb-20 border border-line px-6 pb-[110px] pt-[90px] text-center">
            <h2 className="m-0 mb-2 font-serif text-[28px] font-normal italic">
              Aún no hay prendas
            </h2>
            <p className="m-0 text-[13px] text-muted">
              El catálogo se está preparando. Vuelve pronto.
            </p>
          </div>
        ) : (
          <section className="mt-2">
            <EncabezadoSeccion nombre={actual.nombre} />

            <Suspense fallback={<CuerpoCargando />}>
              <CuerpoSeccion slug={actual.slug} searchParams={searchParams} />
            </Suspense>
          </section>
        )}
      </main>

      <Footer redes={catalogo.redes} />

      <FloatingActions
        whatsappUrl={catalogo.whatsapp_url}
        whatsappNumero={catalogo.whatsapp_numero}
      />
    </>
  );
}

/**
 * Cuerpo de la sección: panel de filtros a la izquierda y rejilla a la derecha.
 *
 * Aquí se leen `?pagina=` y los filtros y se pasan ya resueltos a la rejilla
 * cacheada: dentro de `use cache` no se puede tocar `searchParams`. La cuenta
 * de páginas sale de las prendas **filtradas**, no de la sección entera, o la
 * paginación ofrecería páginas vacías.
 */
async function CuerpoSeccion({ slug, searchParams }: { slug: string; searchParams: Busqueda }) {
  const params = await searchParams;
  const catalogo = await getCatalogo();
  const entradas = navegacion(catalogo.bloques);
  const entrada = entradas.find((e) => e.slug === slug);

  if (!entrada) {
    return null;
  }

  const prendas = catalogo.bloques[entrada.indiceBloque].prendas;
  const cotas = facetas(prendas);
  // Las tallas de la URL se validan contra las de la sección: una que no exista
  // se descarta en vez de dejar la rejilla vacía.
  const filtros = leerFiltros(params, cotas.tallas);
  const filtradas = filtrarPrendas(prendas, filtros);

  return (
    <div className="disposicion-filtros">
      <PanelFiltros
        href={entrada.href}
        filtros={filtros}
        facetas={cotas}
        resultados={filtradas.length}
        total={prendas.length}
      />

      <div className="min-w-0">
        <RejillaSeccion
          slug={slug}
          pagina={paginaValida(params.pagina, totalPaginas(filtradas.length))}
          filtros={filtros}
        />
      </div>
    </div>
  );
}

/** Hueco del cuerpo mientras se resuelve la query: panel y rejilla. */
function CuerpoCargando() {
  return (
    <div className="disposicion-filtros" aria-hidden>
      <div className="panel-filtros h-[260px] animate-pulse border border-line bg-paper" />
      <div className="min-w-0">
        <RejillaCargando />
      </div>
    </div>
  );
}
