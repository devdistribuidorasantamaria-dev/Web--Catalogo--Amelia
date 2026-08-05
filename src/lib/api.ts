import { cacheLife, cacheTag } from 'next/cache';

import type { Catalogo } from '@/types/catalogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

/** Etiqueta que el backend purga vía /api/revalidate tras cada cambio en el panel. */
export const CATALOGO_TAG = 'catalogo';

const CATALOGO_VACIO: Catalogo = {
  subtitulo: 'Colección · Santo Domingo, Ecuador',
  logo_url: null,
  logo_ancho: null,
  logo_alto: null,
  whatsapp_url: null,
  whatsapp_numero: null,
  total_prendas: 0,
  bloques: [],
};

export async function getCatalogo(): Promise<Catalogo> {
  'use cache';
  cacheTag(CATALOGO_TAG);
  // Respaldo por tiempo: si el aviso de revalidación no llega, el catálogo
  // se refresca solo dentro de la hora.
  cacheLife('hours');

  try {
    const respuesta = await fetch(`${API_URL}/catalogo`, {
      headers: { Accept: 'application/json' },
    });

    if (!respuesta.ok) {
      throw new Error(`La API respondió ${respuesta.status}`);
    }

    return (await respuesta.json()) as Catalogo;
  } catch (error) {
    // Mejor una página vacía que un 500: la boutique sigue mostrando el masthead.
    console.error('No se pudo cargar el catálogo:', error);
    return CATALOGO_VACIO;
  }
}
