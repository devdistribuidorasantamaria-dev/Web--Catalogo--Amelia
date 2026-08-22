'use client';

import { useEffect } from 'react';

import { registrarEvento } from '@/lib/analitica';

/** Marca de la visita ya registrada, mientras la pestaña siga abierta. */
const CLAVE = 'amelia_visita_v1';

/**
 * Registra una visita al catálogo. No pinta nada ni ocupa sitio: existe sólo
 * porque la página es un componente de servidor cacheado y el evento tiene que
 * dispararse en el navegador.
 *
 * Una visita es abrir el catálogo, no abrir una sección: cada sección es su
 * propia página, así que la marca vive en `sessionStorage` y pasear por las
 * secciones no cuenta como visitas nuevas. Eso también cubre el doble montaje
 * de StrictMode en desarrollo y las recargas de la misma pestaña.
 */
export default function RegistroVisita() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLAVE)) {
        return;
      }

      sessionStorage.setItem(CLAVE, '1');
    } catch {
      // Navegador con el almacenamiento capado: se registra y ya está. Antes
      // que perder la visita, contarla alguna vez de más.
    }

    registrarEvento('visita');
  }, []);

  return null;
}
