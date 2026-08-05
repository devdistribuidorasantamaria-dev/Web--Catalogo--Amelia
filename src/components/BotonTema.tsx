'use client';

import { useSyncExternalStore } from 'react';

import { CLAVE_TEMA, TEMA_POR_DEFECTO, type Tema } from '@/lib/tema';

/**
 * El tema vive en `data-tema` de <html> (lo escribe el script de `layout.tsx`
 * antes del primer pintado), no en el estado de React: la fuente de verdad es el
 * DOM, así que se lee con `useSyncExternalStore` igual que el carrito lee
 * localStorage.
 */
const suscriptores = new Set<() => void>();

function suscribir(avisar: () => void): () => void {
  suscriptores.add(avisar);

  // Si se cambia el tema en otra pestaña, esta se pone al día.
  const alCambiarAlmacenamiento = (evento: StorageEvent) => {
    if (evento.key === CLAVE_TEMA && (evento.newValue === 'claro' || evento.newValue === 'oscuro')) {
      document.documentElement.dataset.tema = evento.newValue;
      suscriptores.forEach((s) => s());
    }
  };

  window.addEventListener('storage', alCambiarAlmacenamiento);

  return () => {
    suscriptores.delete(avisar);
    window.removeEventListener('storage', alCambiarAlmacenamiento);
  };
}

function leerTema(): Tema {
  return document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro';
}

function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema;

  try {
    window.localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Modo privado o almacenamiento lleno: el tema vale para esta visita.
  }

  suscriptores.forEach((avisar) => avisar());
}

/** Conmuta el catálogo entre negro y blanco; los colores salen de `globals.css`. */
export default function BotonTema() {
  // En el servidor no hay DOM: se renderiza el tema por defecto y se corrige al hidratar.
  const tema = useSyncExternalStore(suscribir, leerTema, () => TEMA_POR_DEFECTO);
  const claro = tema === 'claro';

  return (
    <button
      type="button"
      className="btn"
      onClick={() => aplicarTema(claro ? 'oscuro' : 'claro')}
      aria-label={claro ? 'Cambiar al tema oscuro' : 'Cambiar al tema claro'}
      title={claro ? 'Cambiar al tema oscuro' : 'Cambiar al tema claro'}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">
        {claro ? '☾' : '☀'}
      </span>
      <span className="hidden sm:inline">{claro ? 'Oscuro' : 'Claro'}</span>
    </button>
  );
}
