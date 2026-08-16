/**
 * Envío de los eventos anónimos del catálogo al backend.
 *
 * Dispara y se olvida: nada de await, nada de estado, nada que pueda cambiar lo
 * que ve el visitante. Si la API está caída o el navegador bloquea la petición,
 * el catálogo se comporta exactamente igual.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export type TipoEvento = 'visita' | 'agregar' | 'consultar';

export function registrarEvento(tipo: TipoEvento, prendaId?: number): void {
  // Sólo tiene sentido en el navegador: la página se prerenderiza en el servidor.
  if (typeof window === 'undefined') {
    return;
  }

  const url = `${API_URL}/eventos`;

  // urlencoded en vez de JSON a propósito: es uno de los tipos que el navegador
  // considera «simples», así que la petición sale sin preflight OPTIONS. Laravel
  // lo lee igual que un JSON en $request->input().
  const cuerpo = new URLSearchParams({ tipo });
  if (prendaId !== undefined) {
    cuerpo.set('prenda_id', String(prendaId));
  }

  try {
    // sendBeacon sobrevive a que la pestaña se descargue: «Consultar» se va a
    // WhatsApp, y en móvil eso puede matar la petición a mitad de camino.
    if (navigator.sendBeacon?.(url, cuerpo)) {
      return;
    }
  } catch {
    // Navegador con sendBeacon capado; se intenta con fetch.
  }

  // Respaldo: keepalive cumple el mismo papel que el beacon.
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: cuerpo,
    keepalive: true,
  }).catch(() => {
    // La analítica nunca debe romper el catálogo.
  });
}
