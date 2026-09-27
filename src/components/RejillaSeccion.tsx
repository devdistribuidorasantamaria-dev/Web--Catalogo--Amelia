import Link from 'next/link';
import { cacheLife, cacheTag } from 'next/cache';

import Paginacion from '@/components/Paginacion';
import ProductCard from '@/components/ProductCard';
import { CATALOGO_TAG, getCatalogo } from '@/lib/api';
import { consultaFiltros, filtrarPrendas, hayFiltros, type Filtros } from '@/lib/filtros';
import { PRENDAS_POR_PAGINA, totalPaginas } from '@/lib/paginacion';
import { navegacion, primeraDeLaPagina } from '@/lib/rutas';

type Props = {
  /** Slug de la sección, ya validado por la página. */
  slug: string;
  pagina: number;
  /** Filtros de la URL, ya validados contra las tallas de la sección. */
  filtros: Filtros;
};

/**
 * Rejilla de una página de la sección, ya filtrada.
 *
 * Se cachea con la etiqueta del catálogo, así que la HTML de cada
 * sección + página + filtro se guarda una vez y el panel la purga al guardar.
 * La página y los filtros llegan como props, ya leídos de la query: dentro de
 * `use cache` no se puede tocar `searchParams`.
 */
export default async function RejillaSeccion({ slug, pagina, filtros }: Props) {
  'use cache';
  cacheTag(CATALOGO_TAG);
  cacheLife('hours');

  const catalogo = await getCatalogo();
  const entradas = navegacion(catalogo.bloques);
  const indice = entradas.findIndex((entrada) => entrada.slug === slug);

  // La página ya comprobó el slug; si la sección desapareció entre medias, se
  // deja el hueco vacío en vez de reventar la vista entera.
  if (indice === -1) {
    return null;
  }

  const entrada = entradas[indice];
  const todas = catalogo.bloques[entrada.indiceBloque].prendas;
  const prendas = filtrarPrendas(todas, filtros);

  if (prendas.length === 0) {
    return (
      <div className="my-3.5 mb-20 border border-line px-6 pb-[70px] pt-[60px] text-center">
        <h3 className="m-0 mb-2 font-serif text-[24px] font-normal italic">
          Ninguna prenda con esos filtros
        </h3>
        <p className="m-0 mb-5 text-[13px] text-muted">
          Prueba con otro rango de precio o con más tallas.
        </p>
        <Link href={entrada.href} className="btn no-print">
          Quitar filtros
        </Link>
      </div>
    );
  }

  const paginas = totalPaginas(prendas.length);
  const primera = primeraDeLaPagina(pagina);
  const aLaVista = prendas.slice(primera, primera + PRENDAS_POR_PAGINA);

  // El correlativo es el de la prenda en la sección entera, no el del recorte:
  // con un filtro puesto, el «N.º» de una prenda sigue siendo el suyo.
  const numeroDe = (prenda: (typeof prendas)[number]) =>
    String(entrada.desde + todas.indexOf(prenda)).padStart(2, '0');

  return (
    <>
      <div className="catalog-grid catalog-grid--panel">
        {aLaVista.map((prenda, i) => (
          <ProductCard
            key={prenda.id}
            prenda={prenda}
            numero={numeroDe(prenda)}
            whatsappNumero={catalogo.whatsapp_numero}
            prioridad={i < 3}
          />
        ))}
      </div>

      {paginas > 1 ? (
        <Paginacion
          pagina={pagina}
          paginas={paginas}
          desde={primera + 1}
          hasta={primera + aLaVista.length}
          total={prendas.length}
          href={entrada.href}
          // Cambiar de página no pierde el filtro puesto.
          consulta={hayFiltros(filtros) ? consultaFiltros(filtros) : ''}
          nombreSeccion={entrada.nombre}
        />
      ) : null}
    </>
  );
}
