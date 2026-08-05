import { cacheLife, cacheTag } from 'next/cache';

import Chapter from '@/components/Chapter';
import FloatingActions from '@/components/FloatingActions';
import Footer from '@/components/Footer';
import Masthead from '@/components/Masthead';
import Toolbar from '@/components/Toolbar';
import { CATALOGO_TAG, getCatalogo } from '@/lib/api';

export default async function CatalogoPage() {
  // La página se cachea con la misma etiqueta que los datos. Sin esto, la HTML
  // prerenderizada es una entrada de caché aparte sin etiquetar y seguiría
  // sirviéndose vieja aunque se purgue `catalogo`.
  'use cache';
  cacheTag(CATALOGO_TAG);
  cacheLife('hours');

  const catalogo = await getCatalogo();

  // La numeración "N.º 01, 02…" es continua a través de las secciones,
  // como en el maquetado original.
  let correlativo = 1;

  return (
    <>
      <Toolbar />
      <Masthead
        subtitulo={catalogo.subtitulo}
        logoUrl={catalogo.logo_url}
        logoAncho={catalogo.logo_ancho}
        logoAlto={catalogo.logo_alto}
      />

      <main className="wrap">
        {catalogo.bloques.length === 0 ? (
          <div className="my-3.5 mb-20 border border-line px-6 pb-[110px] pt-[90px] text-center">
            <h2 className="m-0 mb-2 font-serif text-[28px] font-normal italic">
              Aún no hay prendas
            </h2>
            <p className="m-0 text-[13px] text-muted">
              El catálogo se está preparando. Vuelve pronto.
            </p>
          </div>
        ) : (
          catalogo.bloques.map((bloque, i) => {
            const desde = correlativo;
            correlativo += bloque.prendas.length;

            return (
              <Chapter
                key={bloque.seccion?.id ?? 'sin-seccion'}
                bloque={bloque}
                desde={desde}
                whatsappNumero={catalogo.whatsapp_numero}
                primero={i === 0}
              />
            );
          })
        )}
      </main>

      <Footer />

      <FloatingActions
        whatsappUrl={catalogo.whatsapp_url}
        whatsappNumero={catalogo.whatsapp_numero}
      />
    </>
  );
}
