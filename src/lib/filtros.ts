import type { Prenda } from '@/types/catalogo';

/**
 * Filtros del catálogo: precio y talla, nada más.
 *
 * Viven en la URL igual que el `?pagina=` (`?precio_min=&precio_max=&tallas=`),
 * así que el filtro se puede compartir, marcar y volver atrás, y el servidor
 * puede recortar la sección **antes** de paginarla: la cuenta de páginas es la
 * de las prendas que quedan, no la de la sección entera.
 */

export type Filtros = {
  precioMin: number | null;
  precioMax: number | null;
  /** Tallas elegidas, tal como vienen del catálogo. Vacío = todas. */
  tallas: string[];
};

export const SIN_FILTROS: Filtros = { precioMin: null, precioMax: null, tallas: [] };

/** Cotas de la sección: lo que el panel necesita para dibujarse. */
export type Facetas = {
  /** Tallas que aparecen en la sección, ordenadas de XS a XXL. */
  tallas: string[];
  /** Precio más bajo y más alto de la sección, redondeados a entero. */
  precioMin: number | null;
  precioMax: number | null;
};

const CLAVE_MIN = 'precio_min';
const CLAVE_MAX = 'precio_max';
const CLAVE_TALLAS = 'tallas';

type Valor = string | string[] | undefined;

const primero = (valor: Valor) => (Array.isArray(valor) ? valor[0] : valor) ?? '';

/** Número positivo de la URL, o null si no es un número utilizable. */
function numero(valor: Valor): number | null {
  const n = Number.parseFloat(primero(valor));

  if (!Number.isFinite(n) || n < 0) {
    return null;
  }

  return n;
}

/**
 * Rango de precio de una prenda: `[desde, hasta]`. null si no tiene precio —
 * esas prendas no entran cuando se filtra por precio, porque no hay forma de
 * saber si caen dentro.
 */
export function rangoPrecio(prenda: Prenda): [number, number] | null {
  if (prenda.precio_desde === null) {
    return null;
  }

  const desde = Number(prenda.precio_desde);
  if (Number.isNaN(desde)) {
    return null;
  }

  const hasta = prenda.precio_hasta === null ? desde : Number(prenda.precio_hasta);

  return [desde, Number.isNaN(hasta) ? desde : Math.max(desde, hasta)];
}

/**
 * Filtros a partir de la query. Cualquier cosa rara (letras, negativos, una
 * talla que no existe) se descarta: la URL la escribe quien sea y no puede
 * dejar la sección vacía por accidente.
 */
export function leerFiltros(
  params: { [clave: string]: Valor },
  tallasValidas?: string[],
): Filtros {
  const min = numero(params[CLAVE_MIN]);
  const max = numero(params[CLAVE_MAX]);

  const permitidas =
    tallasValidas === undefined
      ? null
      : new Map(tallasValidas.map((t) => [t.toUpperCase(), t]));

  const tallas = primero(params[CLAVE_TALLAS])
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => permitidas?.get(t.toUpperCase()) ?? t)
    .filter((t) => permitidas === null || permitidas.has(t.toUpperCase()));

  return {
    // Un mínimo mayor que el máximo se ignora en vez de no devolver nada.
    precioMin: min !== null && max !== null && min > max ? null : min,
    precioMax: max,
    tallas: [...new Set(tallas)],
  };
}

export const hayFiltros = (filtros: Filtros) =>
  filtros.precioMin !== null || filtros.precioMax !== null || filtros.tallas.length > 0;

/** Cuántos filtros hay puestos: el precio cuenta como uno, con una cota o dos. */
export const contarFiltros = (filtros: Filtros) =>
  (filtros.precioMin !== null || filtros.precioMax !== null ? 1 : 0) +
  (filtros.tallas.length > 0 ? 1 : 0);

/** Prendas que pasan el filtro, en el orden del catálogo. */
export function filtrarPrendas(prendas: Prenda[], filtros: Filtros): Prenda[] {
  if (!hayFiltros(filtros)) {
    return prendas;
  }

  const buscadas = new Set(filtros.tallas.map((t) => t.toUpperCase()));

  return prendas.filter((prenda) => {
    if (filtros.precioMin !== null || filtros.precioMax !== null) {
      const rango = rangoPrecio(prenda);

      if (rango === null) {
        return false;
      }

      // Se compara contra el rango entero: una prenda de 25 – 40 entra en un
      // filtro «hasta 30», porque hay una talla suya que cuesta eso.
      if (filtros.precioMax !== null && rango[0] > filtros.precioMax) {
        return false;
      }
      if (filtros.precioMin !== null && rango[1] < filtros.precioMin) {
        return false;
      }
    }

    if (buscadas.size > 0) {
      return prenda.tallas.some((t) => buscadas.has(t.toUpperCase()));
    }

    return true;
  });
}

/** Orden de talla habitual; lo que no esté en la lista va después. */
const ORDEN_TALLAS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function comparaTallas(a: string, b: string): number {
  const ia = ORDEN_TALLAS.indexOf(a.toUpperCase());
  const ib = ORDEN_TALLAS.indexOf(b.toUpperCase());

  if (ia !== -1 || ib !== -1) {
    return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
  }

  // Tallas numéricas (36, 38, 40…) en orden de número, no de texto.
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) {
    return na - nb;
  }

  return a.localeCompare(b, 'es');
}

/** Tallas y cotas de precio de la sección, para dibujar el panel. */
export function facetas(prendas: Prenda[]): Facetas {
  const tallas = new Map<string, string>();
  let min: number | null = null;
  let max: number | null = null;

  for (const prenda of prendas) {
    for (const talla of prenda.tallas) {
      // Se guarda la primera grafía que aparece; «s» y «S» son la misma talla.
      if (!tallas.has(talla.toUpperCase())) {
        tallas.set(talla.toUpperCase(), talla);
      }
    }

    const rango = rangoPrecio(prenda);
    if (rango !== null) {
      min = min === null ? rango[0] : Math.min(min, rango[0]);
      max = max === null ? rango[1] : Math.max(max, rango[1]);
    }
  }

  return {
    tallas: [...tallas.values()].sort(comparaTallas),
    precioMin: min === null ? null : Math.floor(min),
    // Si todas las prendas valen lo mismo, el deslizador necesita recorrido.
    precioMax: max === null ? null : Math.max(Math.ceil(max), Math.floor(min ?? 0) + 1),
  };
}

/** Redondeos «bonitos» para los atajos de precio. */
const PASOS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

/**
 * Dos o tres atajos «Hasta $X» repartidos por el rango de la sección. Son
 * cortes redondos, no cuartiles exactos: se leen de un vistazo.
 */
export function atajosPrecio(min: number, max: number): number[] {
  const bruto = (max - min) / 4;
  const paso = PASOS.find((p) => p >= bruto) ?? PASOS[PASOS.length - 1];

  const cortes = [1, 2, 3]
    .map((i) => Math.round((min + bruto * i) / paso) * paso)
    .filter((corte) => corte > min && corte < max);

  return [...new Set(cortes)].sort((a, b) => a - b);
}

/**
 * Query de los filtros, sin `?` y sin el `pagina`: filtrar siempre devuelve a
 * la primera página, así que el número no se arrastra.
 */
export function consultaFiltros(filtros: Filtros): string {
  const query = new URLSearchParams();

  if (filtros.precioMin !== null) {
    query.set(CLAVE_MIN, String(filtros.precioMin));
  }
  if (filtros.precioMax !== null) {
    query.set(CLAVE_MAX, String(filtros.precioMax));
  }
  if (filtros.tallas.length > 0) {
    query.set(CLAVE_TALLAS, filtros.tallas.join(','));
  }

  return query.toString();
}

/** Precio tal como se escribe en el panel: entero, sin centavos. */
export const precioCorto = (valor: number) => `$${Math.round(valor).toLocaleString('es-EC')}`;
