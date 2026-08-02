'use client';

import { useSyncExternalStore } from 'react';

import type { ItemCarrito } from '@/types/catalogo';

const CLAVE = 'amelia_carrito_v1';

/** Una prenda en dos tallas distintas son dos líneas separadas. */
const claveItem = (prendaId: number, talla: string | null) => `${prendaId}|${talla ?? ''}`;

/**
 * Store externo mínimo sobre localStorage, leído con `useSyncExternalStore`.
 *
 * Se usa este patrón en vez de useState + useEffect porque el carrito es estado
 * de fuera de React: así la hidratación arranca desde la lista vacía (igual que
 * la HTML estática) y React vuelve a leer el valor real al suscribirse, sin
 * desajustes ni setState dentro de un efecto.
 */
const VACIO: ItemCarrito[] = [];

let items: ItemCarrito[] = VACIO;
let hidratado = false;
const oyentes = new Set<() => void>();

function leerGuardado(): ItemCarrito[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) {
      return VACIO;
    }

    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) {
      return VACIO;
    }

    // Se filtra por si quedó guardado algo con un formato anterior.
    return datos.filter(
      (item): item is ItemCarrito =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as ItemCarrito).prendaId === 'number' &&
        typeof (item as ItemCarrito).nombre === 'string' &&
        typeof (item as ItemCarrito).cantidad === 'number',
    );
  } catch {
    return VACIO;
  }
}

function guardar(nuevos: ItemCarrito[]) {
  items = nuevos;

  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(nuevos));
  } catch {
    // Modo privado o cuota llena: el carrito sigue funcionando en memoria.
  }

  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void): () => void {
  // React vuelve a leer el snapshot justo después de suscribirse, así que basta
  // con dejar `items` al día aquí.
  if (!hidratado) {
    items = leerGuardado();
    hidratado = true;
  }

  oyentes.add(avisar);

  // Mantiene sincronizadas dos pestañas abiertas del catálogo.
  const alCambiarStorage = (evento: StorageEvent) => {
    if (evento.key === CLAVE) {
      items = leerGuardado();
      oyentes.forEach((f) => f());
    }
  };

  window.addEventListener('storage', alCambiarStorage);

  return () => {
    oyentes.delete(avisar);
    window.removeEventListener('storage', alCambiarStorage);
  };
}

const snapshot = () => items;
const snapshotServidor = () => VACIO;

export function agregarAlCarrito(nuevo: Omit<ItemCarrito, 'cantidad'>): void {
  const clave = claveItem(nuevo.prendaId, nuevo.talla);
  const existente = items.find((i) => claveItem(i.prendaId, i.talla) === clave);

  guardar(
    existente
      ? items.map((i) =>
          claveItem(i.prendaId, i.talla) === clave ? { ...i, cantidad: i.cantidad + 1 } : i,
        )
      : [...items, { ...nuevo, cantidad: 1 }],
  );
}

export function cambiarCantidad(prendaId: number, talla: string | null, cantidad: number): void {
  const clave = claveItem(prendaId, talla);

  guardar(
    cantidad < 1
      ? items.filter((i) => claveItem(i.prendaId, i.talla) !== clave)
      : items.map((i) =>
          claveItem(i.prendaId, i.talla) === clave
            ? { ...i, cantidad: Math.min(cantidad, 99) }
            : i,
        ),
  );
}

export function quitarDelCarrito(prendaId: number, talla: string | null): void {
  const clave = claveItem(prendaId, talla);
  guardar(items.filter((i) => claveItem(i.prendaId, i.talla) !== clave));
}

export function vaciarCarrito(): void {
  guardar([]);
}

export function useCarrito(): { items: ItemCarrito[]; unidades: number } {
  const actuales = useSyncExternalStore(suscribir, snapshot, snapshotServidor);

  return {
    items: actuales,
    unidades: actuales.reduce((n, i) => n + i.cantidad, 0),
  };
}
