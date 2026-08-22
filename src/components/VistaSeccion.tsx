import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import EncabezadoSeccion from '@/components/EncabezadoSeccion';
import FloatingActions from '@/components/FloatingActions';
import Footer from '@/components/Footer';
import Masthead from '@/components/Masthead';
import RegistroVisita from '@/components/RegistroVisita';
import RejillaCargando from '@/components/RejillaCargando';
import RejillaSeccion from '@/components/RejillaSeccion';
import Toolbar from '@/components/Toolbar';
import { getCatalogo } from '@/lib/api';
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

            <Suspense fallback={<RejillaCargando />}>
              <RejillaDeLaPagina
                slug={actual.slug}
                prendas={actual.prendas}
                searchParams={searchParams}
              />
            </Suspense>
          </section>
        )}
      </main>

      <Footer />

      <FloatingActions
        whatsappUrl={catalogo.whatsapp_url}
        whatsappNumero={catalogo.whatsapp_numero}
      />
    </>
  );
}

/**
 * Lee el `?pagina=` y se lo pasa ya resuelto a la rejilla cacheada: dentro de
 * `use cache` no se puede tocar `searchParams`.
 */
async function RejillaDeLaPagina({
  slug,
  prendas,
  searchParams,
}: {
  slug: string;
  prendas: number;
  searchParams: Busqueda;
}) {
  const { pagina } = await searchParams;

  return <RejillaSeccion slug={slug} pagina={paginaValida(pagina, totalPaginas(prendas))} />;
}
