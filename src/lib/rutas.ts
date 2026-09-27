import type { Bloque } from '@/types/catalogo';

import { PRENDAS_POR_PAGINA } from './paginacion';

/**
 * Navegación del catálogo: una página por sección.
 *
 * Vive en un módulo sin `'use client'` porque lo usan la barra, las páginas de
 * sección y la vista de impresión, servidor y cliente por igual.
 */

/** Slug de la página de las prendas sin sección. */
const SLUG_SUELTAS = 'otras-prendas';

/** Encabezado de esas prendas, que en la API llegan con `seccion: null`. */
export const NOMBRE_SUELTAS = 'Otras prendas';

export type EntradaSeccion = {
  /** Slug de la ruta; nunca vacío, ni para el bloque sin sección. */
  slug: string;
  nombre: string;
  /** `/` para la primera sección, `/seccion/<slug>` para las demás. */
  href: string;
  prendas: number;
  /**
   * Correlativo (base 1) de la primera prenda de la sección: la numeración
   * «N.º 01, 02…» sigue siendo continua en todo el catálogo, aunque cada
   * sección viva en su propia página.
   */
  desde: number;
  /** Índice del bloque en `catalogo.bloques`, que la API ordena a su manera. */
  indiceBloque: number;
};

/**
 * Una entrada por bloque con prendas, en el orden en que se navegan. Los
 * bloques vacíos no llegan de la API, así que aquí no hay que filtrarlos.
 */
export function navegacion(bloques: Bloque[]): EntradaSeccion[] {
  // El bloque sin sección también necesita slug para tener página propia. Si
  // alguna sección real ya usa ese slug, se desambigua igual que en el backend.
  const usados = new Set(bloques.flatMap((b) => (b.seccion ? [b.seccion.slug] : [])));
  let slugSueltas = SLUG_SUELTAS;
  for (let n = 2; usados.has(slugSueltas); n += 1) {
    slugSueltas = `${SLUG_SUELTAS}-${n}`;
  }

  // La API manda el bloque sin sección primero (así iba en el maquetado de una
  // sola página, sin encabezado). Con una página por sección se va al final: es
  // un cajón de sastre y no puede ser la portada del catálogo.
  const orden = bloques
    .map((_, i) => i)
    .sort((a, b) => (bloques[a].seccion ? 0 : 1) - (bloques[b].seccion ? 0 : 1) || a - b);

  let correlativo = 1;

  return orden.map((indiceBloque, i) => {
    const bloque = bloques[indiceBloque];
    const slug = bloque.seccion?.slug ?? slugSueltas;
    const desde = correlativo;
    correlativo += bloque.prendas.length;

    return {
      slug,
      nombre: bloque.seccion?.nombre ?? NOMBRE_SUELTAS,
      // La primera sección es la portada: vive en la raíz, no en /seccion/…
      href: i === 0 ? '/' : `/seccion/${slug}`,
      prendas: bloque.prendas.length,
      desde,
      indiceBloque,
    };
  });
}

/**
 * URL de una página concreta de la sección. La primera no lleva `?pagina=`, y
 * `consulta` (los filtros, sin `?`) se conserva en todas: cambiar de página no
 * puede perder el filtro puesto.
 */
export const urlPagina = (href: string, pagina: number, consulta = '') => {
  const query = [consulta, pagina <= 1 ? '' : `pagina=${pagina}`].filter(Boolean).join('&');

  return query ? `${href}?${query}` : href;
};

/** Correlativo (base 1) de la primera prenda de la página. */
export const primeraDeLaPagina = (pagina: number) => (pagina - 1) * PRENDAS_POR_PAGINA;
