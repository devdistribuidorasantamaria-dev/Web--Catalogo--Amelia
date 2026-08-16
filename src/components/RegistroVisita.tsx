'use client';

import { useEffect, useRef } from 'react';

import { registrarEvento } from '@/lib/analitica';

/**
 * Registra una visita al catálogo. No pinta nada ni ocupa sitio: existe sólo
 * porque la página es un componente de servidor cacheado y el evento tiene que
 * dispararse en el navegador.
 */
export default function RegistroVisita() {
  const registrada = useRef(false);

  useEffect(() => {
    // En desarrollo StrictMode monta el efecto dos veces; el ref sobrevive a esa
    // segunda pasada, así que la recarga no cuenta como dos visitas.
    if (registrada.current) {
      return;
    }

    registrada.current = true;
    registrarEvento('visita');
  }, []);

  return null;
}
