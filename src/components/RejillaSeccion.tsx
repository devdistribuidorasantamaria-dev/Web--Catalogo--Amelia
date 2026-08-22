import { cacheLife, cacheTag } from 'next/cache';

import Paginacion from '@/components/Paginacion';
import ProductCard from '@/components/ProductCard';
import { CATALOGO_TAG, getCatalogo } from '@/lib/api';
import { PRENDAS_POR_PAGINA, totalPaginas } from '@/lib/paginacion';
import { navegacion, primeraDeLaPagina } from '@/lib/rutas';

type Props = {
  /** Slug de la sección, ya validado por la página. */
  slug: string;
  pagina: number;
};

/**
 * Rejilla de una página de la sección.
 *
 * Se cachea con la etiqueta del catálogo, así que la HTML de cada
 * sección + página se guarda una vez y el panel la purga al guardar. El número
 * de página llega como prop, ya leído del `?pagina=`: dentro de `use cache` no
 * se puede tocar `searchParams`.
 */
export default async function RejillaSeccion({ slug, pagina }: Props) {
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
  const prendas = catalogo.bloques[entrada.indiceBloque].prendas;
  const paginas = totalPaginas(prendas.length);
  const primera = primeraDeLaPagina(pagina);
  const aLaVista = prendas.slice(primera, primera + PRENDAS_POR_PAGINA);

  return (
    <>
      <div className="catalog-grid">
        {aLaVista.map((prenda, i) => (
          <ProductCard
            key={prenda.id}
            prenda={prenda}
            // El correlativo no se reinicia por página ni por sección.
            numero={String(entrada.desde + primera + i).padStart(2, '0')}
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
          nombreSeccion={entrada.nombre}
        />
      ) : null}
    </>
  );
}
