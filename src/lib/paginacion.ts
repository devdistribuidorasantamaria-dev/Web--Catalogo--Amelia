/**
 * Paginación de una sección del catálogo.
 *
 * Cada sección tiene su propia página (`/` la primera, `/seccion/<slug>` el
 * resto) y, dentro de ella, su propia paginación por `?pagina=N`. El catálogo
 * llega completo en una sola respuesta cacheada (`getCatalogo()`), así que el
 * corte se hace al renderizar y no hace falta un endpoint paginado.
 */

/** Prendas por página: cuatro filas de la rejilla de escritorio. */
export const PRENDAS_POR_PAGINA = 12;

export const totalPaginas = (prendas: number) =>
  Math.max(1, Math.ceil(prendas / PRENDAS_POR_PAGINA));

/**
 * Número de página a partir del `?pagina=` de la URL. Cualquier cosa que no sea
 * un número dentro del rango cae en la primera página: la URL la escribe quien
 * sea, así que no puede reventar la sección ni dejarla vacía.
 */
export function paginaValida(valor: string | string[] | undefined, paginas: number): number {
  const crudo = Array.isArray(valor) ? valor[0] : valor;
  const n = Number.parseInt(crudo ?? '', 10);

  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }

  return Math.min(n, paginas);
}
