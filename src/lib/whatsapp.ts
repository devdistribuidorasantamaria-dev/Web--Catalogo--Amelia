import type { ItemCarrito, Prenda } from '@/types/catalogo';

/** Arma un enlace wa.me. Devuelve null si no hay número configurado en el panel. */
export function enlaceWhatsapp(numero: string | null, mensaje: string): string | null {
  if (!numero) {
    return null;
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensaje del botón «Consultar» de una tarjeta. */
export function mensajePrenda(prenda: Prenda, talla: string | null): string {
  const detalle = talla ? `${prenda.nombre} (talla ${talla})` : prenda.nombre;

  return `Hola Amelia Boutique, quisiera consultar por: ${detalle} — ${prenda.precio_texto}.`;
}

/**
 * Mensaje del botón «Consultar precio» del carrito.
 *
 * El total sólo se incluye cuando **todas** las prendas tienen precio exacto: con un
 * rango (25 – 30) cualquier suma sería inventada, y quien consulta espera que la
 * boutique le confirme el valor.
 */
export function mensajeCarrito(items: ItemCarrito[]): string {
  const lineas = items.map((item, i) => {
    const detalle = item.talla ? `${item.nombre} (talla ${item.talla})` : item.nombre;
    const cantidad = item.cantidad > 1 ? ` x${item.cantidad}` : '';

    return `${i + 1}. ${detalle}${cantidad} — ${item.precioTexto}`;
  });

  const partes = [
    'Hola Amelia Boutique, quisiera consultar el precio de estas prendas:',
    '',
    ...lineas,
  ];

  const total = totalReferencial(items);
  if (total !== null) {
    partes.push('', `Total de referencia: $${total.toFixed(2)}`);
  }

  partes.push('', '¿Me confirman disponibilidad y el valor final?');

  return partes.join('\n');
}

/** Suma de referencia, o null si alguna prenda tiene precio en rango o sin precio. */
export function totalReferencial(items: ItemCarrito[]): number | null {
  if (items.length === 0 || items.some((item) => item.precioExacto === null)) {
    return null;
  }

  return items.reduce((suma, item) => suma + (item.precioExacto ?? 0) * item.cantidad, 0);
}

/** Precio exacto de una prenda, o null si es un rango o no tiene precio. */
export function precioExacto(prenda: Prenda): number | null {
  if (prenda.precio_desde === null) {
    return null;
  }

  const desde = Number(prenda.precio_desde);
  const hasta = prenda.precio_hasta === null ? null : Number(prenda.precio_hasta);

  if (Number.isNaN(desde)) {
    return null;
  }

  // Rango real: no hay un precio único que sumar.
  if (hasta !== null && !Number.isNaN(hasta) && hasta > desde) {
    return null;
  }

  return desde;
}
