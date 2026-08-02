'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { agregarAlCarrito } from '@/lib/carrito';
import { enlaceWhatsapp, mensajePrenda, precioExacto } from '@/lib/whatsapp';
import type { Prenda } from '@/types/catalogo';

type Props = {
  prenda: Prenda;
  /** Número correlativo en todo el catálogo, ya con cero delante ("01"). */
  numero: string;
  /** Número de WhatsApp del panel; sin él no se muestra «Consultar». */
  whatsappNumero: string | null;
  /** La primera fila carga sin lazy para que el LCP no espere. */
  prioridad?: boolean;
};

export default function ProductCard({
  prenda,
  numero,
  whatsappNumero,
  prioridad = false,
}: Props) {
  const [indice, setIndice] = useState(0);
  const [talla, setTalla] = useState<string | null>(null);
  const [agregado, setAgregado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fotos = prenda.imagenes;
  const varias = fotos.length > 1;
  const necesitaTalla = prenda.tallas.length > 0;

  useEffect(() => () => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }
  }, []);

  const mover = (paso: number) =>
    setIndice((actual) => (actual + paso + fotos.length) % fotos.length);

  const consultar = enlaceWhatsapp(whatsappNumero, mensajePrenda(prenda, talla));

  const alAgregar = () => {
    agregarAlCarrito({
      prendaId: prenda.id,
      nombre: prenda.nombre,
      talla,
      precioTexto: prenda.precio_texto,
      precioExacto: precioExacto(prenda),
    });

    setAgregado(true);
    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }
    temporizador.current = setTimeout(() => setAgregado(false), 1600);
  };

  return (
    <article className="catalog-card relative flex flex-col bg-paper">
      <div className="group relative aspect-3/4 overflow-hidden bg-panel">
        {fotos.length > 0 ? (
          <>
            {/* Se montan todas y se conmuta la opacidad: al pasar de foto no hay
                parpadeo en blanco mientras el navegador descarga la siguiente. */}
            {fotos.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={prenda.nombre}
                fill
                sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 360px"
                priority={prioridad && i === 0}
                className={`object-cover transition-opacity duration-200 ${
                  i === indice ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            <span className="absolute left-[13px] top-3 z-2 font-serif text-[15px] italic text-white mix-blend-difference">
              N.º {numero}
            </span>

            {varias ? (
              <>
                <span className="no-print absolute right-[13px] top-3 z-2 bg-black/45 px-[7px] py-[3px] text-[10px] tracking-[0.08em] text-white">
                  {indice + 1}/{fotos.length}
                </span>

                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={() => mover(-1)}
                  className="no-print absolute left-2 top-1/2 z-2 flex h-[34px] w-[34px] -translate-y-1/2 cursor-pointer items-center justify-center bg-black/45 text-xl leading-none text-white opacity-0 transition-opacity duration-150 hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Foto siguiente"
                  onClick={() => mover(1)}
                  className="no-print absolute right-2 top-1/2 z-2 flex h-[34px] w-[34px] -translate-y-1/2 cursor-pointer items-center justify-center bg-black/45 text-xl leading-none text-white opacity-0 transition-opacity duration-150 hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  ›
                </button>

                <div className="no-print absolute inset-x-0 bottom-2.5 z-2 flex justify-center gap-1.5">
                  {fotos.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      aria-label={`Ver foto ${i + 1}`}
                      aria-current={i === indice}
                      onClick={() => setIndice(i)}
                      className={`h-1.5 w-1.5 cursor-pointer rounded-full border-0 p-0 ${
                        i === indice ? 'bg-white' : 'bg-white/45'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className="figure-empty flex h-full w-full items-center justify-center">
            <span className="absolute left-[13px] top-3 z-2 font-serif text-[15px] italic text-white mix-blend-difference">
              N.º {numero}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-[18px] pb-[22px] pt-[18px]">
        <h3 className="m-0 font-serif text-[22px] font-medium leading-[1.12] tracking-[0.01em]">
          {prenda.nombre}
        </h3>

        {prenda.descripcion ? (
          <p className="m-0 text-[12.5px] font-light leading-[1.55] text-muted">
            {prenda.descripcion}
          </p>
        ) : null}

        {necesitaTalla ? (
          <fieldset className="mt-0.5 border-0 p-0">
            <legend className="sr-only">Talla de {prenda.nombre}</legend>
            <div className="flex flex-wrap gap-1.5">
              {prenda.tallas.map((t) => {
                const elegida = t === talla;

                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={elegida}
                    // Volver a pulsar la talla elegida la deselecciona.
                    onClick={() => setTalla(elegida ? null : t)}
                    className={`cursor-pointer border px-[9px] py-1 text-[10px] uppercase leading-none tracking-[0.14em] transition-colors ${
                      elegida
                        ? 'border-ink bg-ink text-paper'
                        : 'border-hairline text-ink hover:border-ink'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-auto flex items-baseline justify-between gap-2.5 border-t border-line pt-3.5">
          <span className="text-[9px] uppercase tracking-[0.3em] text-muted">Precio</span>
          <span className="font-serif text-2xl font-medium">{prenda.precio_texto}</span>
        </div>

        <div className="no-print flex gap-1.5">
          <button
            type="button"
            onClick={alAgregar}
            aria-live="polite"
            className="btn flex-1 !px-2 !py-2.5 !text-[10px]"
          >
            {agregado ? 'Agregado ✓' : 'Agregar'}
          </button>

          {consultar ? (
            <a
              href={consultar}
              target="_blank"
              rel="noopener noreferrer"
              className="btn flex-1 !px-2 !py-2.5 !text-[10px]"
            >
              Consultar
            </a>
          ) : null}
        </div>

        {necesitaTalla && talla === null ? (
          <p className="no-print m-0 text-[10px] leading-snug text-muted">
            Elige una talla para incluirla en la consulta.
          </p>
        ) : null}
      </div>
    </article>
  );
}
