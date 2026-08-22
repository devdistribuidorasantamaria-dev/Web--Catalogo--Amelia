import { cacheLife, cacheTag } from 'next/cache';
import type { Metadata } from 'next';

import BarraImpresion from '@/components/BarraImpresion';
import EncabezadoSeccion from '@/components/EncabezadoSeccion';
import Footer from '@/components/Footer';
import Masthead from '@/components/Masthead';
import ProductCard from '@/components/ProductCard';
import { CATALOGO_TAG, getCatalogo } from '@/lib/api';
import { navegacion } from '@/lib/rutas';

export const metadata: Metadata = {
  title: 'Amelia Boutique — Catálogo completo',
  // No tiene nada que hacer en un buscador: es la versión imprimible.
  robots: { index: false, follow: false },
};

/**
 * Catálogo entero en una sola página, para el PDF.
 *
 * Las secciones del catálogo público van paginadas y cada una en su ruta, así
 * que el PDF no puede salir de ellas: aquí se arman todas seguidas y sin cortar,
 * con la misma numeración «N.º» continua. No lleva paginación ni analítica.
 */
export default async function ImprimirPage() {
  'use cache';
  cacheTag(CATALOGO_TAG);
  cacheLife('hours');

  const catalogo = await getCatalogo();
  const entradas = navegacion(catalogo.bloques);

  return (
    <>
      <BarraImpresion />

      <Masthead
        subtitulo={catalogo.subtitulo}
        logoUrl={catalogo.logo_url}
        logoAncho={catalogo.logo_ancho}
        logoAlto={catalogo.logo_alto}
      />

      <main className="wrap">
        {entradas.length === 0 ? (
          <div className="my-3.5 mb-20 border border-line px-6 pb-[110px] pt-[90px] text-center">
            <h2 className="m-0 mb-2 font-serif text-[28px] font-normal italic">
              Aún no hay prendas
            </h2>
          </div>
        ) : (
          entradas.map((entrada, i) => (
            <section key={entrada.slug} className="mt-2">
              <EncabezadoSeccion nombre={entrada.nombre} />

              <div className="catalog-grid">
                {catalogo.bloques[entrada.indiceBloque].prendas.map((prenda, j) => (
                  <ProductCard
                    key={prenda.id}
                    prenda={prenda}
                    numero={String(entrada.desde + j).padStart(2, '0')}
                    whatsappNumero={catalogo.whatsapp_numero}
                    prioridad={i === 0 && j < 3}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <Footer />
    </>
  );
}
