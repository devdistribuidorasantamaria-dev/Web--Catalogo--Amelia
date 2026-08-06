/**
 * Id de la sección en el DOM: destino de los enlaces de la barra superior.
 *
 * Vive en un módulo sin `'use client'` porque lo usan los dos lados: `Toolbar`
 * (cliente) para armar el `href` y `Chapter` (servidor) para poner el `id`. Si
 * se exportara desde el componente cliente, llamarlo desde el servidor revienta
 * en tiempo de ejecución («Attempted to call anclaSeccion() from the server»).
 */
export const anclaSeccion = (slug: string) => `seccion-${slug}`;

/** Ancla del inicio del catálogo, a la que vuelve el logotipo de la barra. */
export const ANCLA_INICIO = 'top';
