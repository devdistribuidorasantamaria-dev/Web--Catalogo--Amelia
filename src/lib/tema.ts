export type Tema = 'oscuro' | 'claro';

/** Clave de localStorage donde se recuerda el tema elegido. */
export const CLAVE_TEMA = 'amelia_tema_v1';

/** Sin nada guardado el catálogo abre en negro, como el maquetado original. */
export const TEMA_POR_DEFECTO: Tema = 'oscuro';

/**
 * Aplica el tema guardado antes del primer pintado. Se inyecta como script
 * bloqueante en `layout.tsx`: hecho desde React, la página se vería un instante
 * en negro antes de pasar a blanco en cada recarga.
 *
 * Vive en este módulo (sin `'use client'`) porque el layout es un componente de
 * servidor: importar la clave desde el componente cliente daría una referencia
 * al cliente en vez de la cadena, y el script saldría roto.
 */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem('${CLAVE_TEMA}');if(t==='claro'||t==='oscuro'){document.documentElement.dataset.tema=t}}catch(e){}`;
