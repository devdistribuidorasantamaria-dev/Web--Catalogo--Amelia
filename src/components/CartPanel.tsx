'use client';

import { useEffect, useState } from 'react';

import {
  cambiarCantidad,
  quitarDelCarrito,
  useCarrito,
  vaciarCarrito,
} from '@/lib/carrito';
import { enlaceWhatsapp, mensajeCarrito, totalReferencial } from '@/lib/whatsapp';

/**
 * Botón flotante con el número de prendas + panel lateral con la lista.
 *
 * No hay pasarela de pago: la lista se convierte en un mensaje de WhatsApp con
 * el botón «Consultar precio».
 */
export default function CartPanel({ whatsappNumero }: { whatsappNumero: string | null }) {
  const { items, unidades } = useCarrito();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const cerrarConEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };

    document.addEventListener('keydown', cerrarConEsc);
    return () => document.removeEventListener('keydown', cerrarConEsc);
  }, [abierto]);

  const total = totalReferencial(items);
  const consultar = enlaceWhatsapp(whatsappNumero, mensajeCarrito(items));

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Abrir lista de consulta (${unidades} ${unidades === 1 ? 'prenda' : 'prendas'})`}
        className="no-print flex items-center gap-2.5 border border-ink bg-paper px-4 py-3 text-[11px]
                   uppercase tracking-label text-ink transition-colors hover:bg-ink hover:text-paper
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px] shrink-0">
          <path d="M3 5h2l2.2 10.2A2 2 0 0 0 9.16 17h8.68a2 2 0 0 0 1.96-1.6L21.5 8H6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        Mi lista
        {unidades > 0 ? (
          <span className="ml-0.5 min-w-5 border border-current px-1 py-px text-center text-[10px] leading-tight">
            {unidades}
          </span>
        ) : null}
      </button>

      {abierto ? (
        <div className="no-print fixed inset-0 z-60 flex justify-end">
          {/* Fondo: cierra al pulsar fuera. */}
          <button
            type="button"
            aria-label="Cerrar la lista"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 cursor-default bg-black/70"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Lista de consulta"
            className="relative flex h-full w-full max-w-[420px] flex-col border-l border-line bg-paper"
          >
            <header className="flex items-baseline justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <span className="block text-[10px] uppercase tracking-chapter text-muted">
                  Lista de consulta
                </span>
                <h2 className="mt-1.5 font-serif text-2xl leading-none">
                  {unidades === 0
                    ? 'Vacía'
                    : `${unidades} ${unidades === 1 ? 'prenda' : 'prendas'}`}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="cursor-pointer text-xl leading-none text-muted transition-colors hover:text-ink"
              >
                ✕
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <p className="m-0 font-serif text-2xl italic">Todavía no hay prendas</p>
                <p className="mt-2 text-[13px] text-muted">
                  Agrega piezas del catálogo y pide el precio de todas juntas por WhatsApp.
                </p>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-line overflow-y-auto">
                {items.map((item) => (
                  <li key={`${item.prendaId}|${item.talla ?? ''}`} className="px-6 py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="m-0 font-serif text-lg leading-tight">{item.nombre}</h3>
                      <span className="whitespace-nowrap font-serif text-lg">
                        {item.precioTexto}
                      </span>
                    </div>

                    {item.talla ? (
                      <p className="mt-1.5 text-[10px] uppercase tracking-label text-muted">
                        Talla {item.talla}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Quitar una unidad de ${item.nombre}`}
                        onClick={() => cambiarCantidad(item.prendaId, item.talla, item.cantidad - 1)}
                        className="h-7 w-7 cursor-pointer border border-line text-ink transition-colors hover:border-ink hover:bg-panel"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-[12px]">{item.cantidad}</span>
                      <button
                        type="button"
                        aria-label={`Agregar una unidad de ${item.nombre}`}
                        onClick={() => cambiarCantidad(item.prendaId, item.talla, item.cantidad + 1)}
                        className="h-7 w-7 cursor-pointer border border-line text-ink transition-colors hover:border-ink hover:bg-panel"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => quitarDelCarrito(item.prendaId, item.talla)}
                        className="ml-auto cursor-pointer text-[10px] uppercase tracking-label text-muted transition-colors hover:text-ink"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {items.length > 0 ? (
              <footer className="border-t border-line px-6 py-5">
                {total !== null ? (
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-muted">
                      Total de referencia
                    </span>
                    <span className="font-serif text-2xl font-medium">${total.toFixed(2)}</span>
                  </div>
                ) : (
                  <p className="mb-4 m-0 text-[11px] leading-snug text-muted">
                    Alguna prenda tiene precio por rango, así que el total lo confirma la
                    boutique.
                  </p>
                )}

                {consultar ? (
                  <a href={consultar} target="_blank" rel="noopener noreferrer" className="btn w-full">
                    Consultar precio
                  </a>
                ) : (
                  <p className="m-0 border border-line bg-panel px-4 py-3 text-[11px] leading-snug text-muted">
                    Falta configurar el número de WhatsApp en el panel para poder enviar la
                    consulta.
                  </p>
                )}

                <button
                  type="button"
                  onClick={vaciarCarrito}
                  className="mt-3 w-full cursor-pointer text-[10px] uppercase tracking-label text-muted transition-colors hover:text-ink"
                >
                  Vaciar la lista
                </button>
              </footer>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
