'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  atajosPrecio,
  consultaFiltros,
  contarFiltros,
  hayFiltros,
  precioCorto,
  type Facetas,
  type Filtros,
} from '@/lib/filtros';

type Props = {
  /** Ruta de la sección: `/` o `/seccion/<slug>`. */
  href: string;
  /** Filtros que trae la URL, ya validados en el servidor. */
  filtros: Filtros;
  /** Tallas y cotas de precio de esta sección. */
  facetas: Facetas;
  /** Prendas que quedan con el filtro puesto, y las que tiene la sección. */
  resultados: number;
  total: number;
};

/** Milisegundos que se espera antes de llevar el precio a la URL. */
const ESPERA = 350;

const TITULO = 'mb-3 block text-[10px] uppercase tracking-chapter text-muted';

/**
 * Panel de filtros de la sección: precio y talla, nada más.
 *
 * El estado vive en la URL, no aquí: cada cambio navega a la misma sección con
 * otra query y el servidor devuelve la rejilla ya filtrada y repaginada. Lo
 * único que guarda el componente es el precio mientras se arrastra el
 * deslizador, para no navegar en cada paso.
 */
export default function PanelFiltros({ href, filtros, facetas, resultados, total }: Props) {
  const router = useRouter();

  const cotaMin = facetas.precioMin ?? 0;
  const cotaMax = facetas.precioMax ?? 0;
  const conPrecio = facetas.precioMin !== null && facetas.precioMax !== null && cotaMax > cotaMin;

  const [abierto, setAbierto] = useState(false);

  const aplicada = consultaFiltros(filtros);

  /**
   * Precio mientras se mueve el deslizador. Se guarda junto a la query sobre la
   * que se empezó a mover: en cuanto la URL cambia, el borrador caduca solo y
   * los valores vuelven a salir de los filtros del servidor. Así no hace falta
   * ningún efecto que copie props a estado.
   */
  const [borrador, setBorrador] = useState<{
    consulta: string;
    min: number;
    max: number;
  } | null>(null);

  const vigente = borrador !== null && borrador.consulta === aplicada;
  const min = vigente ? borrador.min : (filtros.precioMin ?? cotaMin);
  const max = vigente ? borrador.max : (filtros.precioMax ?? cotaMax);

  const mover = (cambio: { min?: number; max?: number }) =>
    setBorrador({ consulta: aplicada, min, max, ...cambio });

  // Última query pedida, para no volver a navegar a donde ya se va. Se escribe
  // sólo desde manejadores y temporizadores, nunca durante el render.
  const ultima = useRef(aplicada);

  const navegar = useCallback(
    (consulta: string) => {
      ultima.current = consulta;
      // Sin scroll: filtrar no debe saltar al principio de la página.
      router.push(consulta ? `${href}?${consulta}` : href, { scroll: false });
    },
    [href, router],
  );

  // El precio se lleva a la URL cuando la mano suelta el deslizador, no en cada
  // paso: si no, cada arrastre serían veinte navegaciones.
  useEffect(() => {
    if (!vigente) {
      // Sin borrador a medias, lo que se ve es la URL: eso pasa a ser lo último
      // pedido, también cuando la cambia el botón de atrás.
      ultima.current = aplicada;

      return;
    }

    if (!conPrecio) {
      return;
    }

    const consulta = consultaFiltros({
      ...filtros,
      // En las cotas de la sección no hay filtro que poner: la query se queda
      // limpia en vez de arrastrar el rango completo.
      precioMin: min <= cotaMin ? null : min,
      precioMax: max >= cotaMax ? null : max,
    });

    if (consulta === ultima.current) {
      return;
    }

    const temporizador = setTimeout(() => navegar(consulta), ESPERA);

    return () => clearTimeout(temporizador);
  }, [vigente, min, max, cotaMin, cotaMax, conPrecio, filtros, aplicada, navegar]);

  const conTallas = facetas.tallas.length > 0;
  const puestos = contarFiltros(filtros);

  const cambiarTalla = (talla: string) => {
    setBorrador(null);
    const elegidas = filtros.tallas.some((t) => t.toUpperCase() === talla.toUpperCase())
      ? filtros.tallas.filter((t) => t.toUpperCase() !== talla.toUpperCase())
      : [...filtros.tallas, talla];

    navegar(consultaFiltros({ ...filtros, tallas: elegidas }));
  };

  const hastaPrecio = (corte: number) => {
    setBorrador(null);
    navegar(consultaFiltros({ ...filtros, precioMin: null, precioMax: corte }));
  };

  const limpiarPrecio = () => {
    setBorrador(null);
    navegar(consultaFiltros({ ...filtros, precioMin: null, precioMax: null }));
  };

  const limpiar = () => {
    setBorrador(null);
    navegar('');
  };

  // Nada que filtrar (sección sin precios ni tallas): el panel no se dibuja.
  if (!conPrecio && !conTallas) {
    return null;
  }

  const porcentaje = (valor: number) => ((valor - cotaMin) / (cotaMax - cotaMin)) * 100;

  return (
    <aside className="no-print panel-filtros border border-line bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="m-0 flex items-center gap-2 font-serif text-[19px] font-normal italic">
          Filtros
          {puestos > 0 ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 font-sans text-[10px] not-italic text-paper">
              {puestos}
            </span>
          ) : null}
        </h2>

        <div className="flex items-center gap-3">
          {hayFiltros(filtros) ? (
            <button
              type="button"
              onClick={limpiar}
              className="cursor-pointer text-[10px] uppercase tracking-label text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Limpiar
            </button>
          ) : null}

          {/* En pantallas angostas el panel se pliega; en escritorio queda fijo. */}
          <button
            type="button"
            onClick={() => setAbierto((estaba) => !estaba)}
            aria-expanded={abierto}
            aria-controls="cuerpo-filtros"
            className="panel-filtros__pliegue cursor-pointer items-center gap-1.5 border border-hairline px-2.5 py-1.5 text-[10px] uppercase tracking-label text-ink transition-colors hover:border-ink"
          >
            {abierto ? 'Ocultar' : 'Filtrar'}
          </button>
        </div>
      </div>

      <div id="cuerpo-filtros" className="panel-filtros__cuerpo" data-abierto={abierto}>
        {conPrecio ? (
          <div className="border-b border-line px-5 py-5">
            <span className={TITULO}>Precio</span>

            <div className="mb-4 flex items-center gap-2">
              <label className="flex-1">
                <span className="sr-only">Precio mínimo</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={cotaMin}
                  max={max}
                  value={min}
                  onChange={(e) => {
                    const valor = Number(e.target.value);
                    mover({ min: Number.isFinite(valor) ? Math.min(Math.max(valor, cotaMin), max) : cotaMin });
                  }}
                  placeholder="Mínimo"
                  className="w-full border border-hairline bg-transparent px-2.5 py-2 text-[12px] text-ink transition-colors focus:border-ink focus:outline-none"
                />
              </label>

              <span aria-hidden className="text-[11px] text-muted">
                –
              </span>

              <label className="flex-1">
                <span className="sr-only">Precio máximo</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={cotaMax}
                  value={max}
                  onChange={(e) => {
                    const valor = Number(e.target.value);
                    mover({ max: Number.isFinite(valor) ? Math.max(Math.min(valor, cotaMax), min) : cotaMax });
                  }}
                  placeholder="Máximo"
                  className="w-full border border-hairline bg-transparent px-2.5 py-2 text-[12px] text-ink transition-colors focus:border-ink focus:outline-none"
                />
              </label>
            </div>

            {/* Dos deslizadores encima del mismo filete: el tramo elegido se
                pinta entre los dos tiradores. */}
            <div className="filtro-rango">
              <span
                className="filtro-rango__activo"
                style={{ left: `${porcentaje(min)}%`, right: `${100 - porcentaje(max)}%` }}
              />
              <input
                type="range"
                aria-label="Precio mínimo"
                min={cotaMin}
                max={cotaMax}
                value={min}
                onChange={(e) => mover({ min: Math.min(Number(e.target.value), max) })}
              />
              <input
                type="range"
                aria-label="Precio máximo"
                min={cotaMin}
                max={cotaMax}
                value={max}
                onChange={(e) => mover({ max: Math.max(Number(e.target.value), min) })}
              />
            </div>

            <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-label text-muted">
              <span>{precioCorto(cotaMin)}</span>
              <span>{precioCorto(cotaMax)}</span>
            </div>

            {atajosPrecio(cotaMin, cotaMax).length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {atajosPrecio(cotaMin, cotaMax).map((corte) => {
                  const puesto = filtros.precioMin === null && filtros.precioMax === corte;

                  return (
                    <button
                      key={corte}
                      type="button"
                      aria-pressed={puesto}
                      onClick={() => (puesto ? limpiarPrecio() : hastaPrecio(corte))}
                      className={`cursor-pointer border px-[9px] py-1 text-[10px] uppercase leading-none tracking-[0.14em] transition-colors ${
                        puesto ? 'border-ink bg-ink text-paper' : 'border-hairline text-ink hover:border-ink'
                      }`}
                    >
                      Hasta {precioCorto(corte)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {conTallas ? (
          <div className="border-b border-line px-5 py-5">
            <span className={TITULO}>Talla</span>

            <div className="flex flex-wrap gap-1.5">
              {facetas.tallas.map((talla) => {
                const elegida = filtros.tallas.some((t) => t.toUpperCase() === talla.toUpperCase());

                return (
                  <button
                    key={talla}
                    type="button"
                    aria-pressed={elegida}
                    onClick={() => cambiarTalla(talla)}
                    // Mismo botón que la talla de la tarjeta: el catálogo ya
                    // enseña ahí qué significa que esté relleno.
                    className={`min-w-[38px] cursor-pointer border px-[9px] py-1.5 text-[10px] uppercase leading-none tracking-[0.14em] transition-colors ${
                      elegida
                        ? 'border-ink bg-ink text-paper'
                        : 'border-hairline text-ink hover:border-ink'
                    }`}
                  >
                    {talla}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="m-0 px-5 py-4 text-[10px] uppercase tracking-label text-muted" aria-live="polite">
          {hayFiltros(filtros)
            ? `${resultados} de ${total} prendas`
            : `${total} ${total === 1 ? 'prenda' : 'prendas'}`}
        </p>
      </div>
    </aside>
  );
}
