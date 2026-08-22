import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { CATALOGO_TAG } from '@/lib/api';

/**
 * El panel de Laravel llama aquí después de cada cambio para purgar la caché
 * del catálogo. Se protege con un secreto compartido por cabecera.
 */
export async function POST(request: Request) {
  const esperado = process.env.REVALIDATE_SECRET;

  if (!esperado) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET no configurado' }, { status: 500 });
  }

  if (request.headers.get('x-revalidate-secret') !== esperado) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // revalidateTag purga las cachés de datos (Next 16 exige el perfil de cacheLife
  // como segundo argumento); revalidatePath purga además la HTML prerenderizada
  // de la ruta, que es una entrada distinta. Hacen falta las dos.
  revalidateTag(CATALOGO_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/imprimir');
  // Patrón de ruta + 'page': purga las páginas de todas las secciones de golpe,
  // sin que el backend tenga que decir cuáles son. Cada una se regenera en su
  // primera visita.
  revalidatePath('/seccion/[slug]', 'page');

  // revalidateTag es stale-while-revalidate: la primera visita después de purgar
  // recibe la versión anterior y sólo entonces empieza la regeneración. Pedimos
  // la portada nosotros para absorber esa primera visita, de modo que quien
  // acaba de guardar en el panel ya vea su cambio. Las demás secciones se
  // regeneran cuando alguien entre en ellas.
  let calentado = false;
  try {
    const respuesta = await fetch(new URL('/', request.url), { cache: 'no-store' });
    calentado = respuesta.ok;
  } catch {
    // Si falla, el catálogo se regenera igual en la siguiente visita.
  }

  return NextResponse.json({ revalidado: CATALOGO_TAG, calentado });
}
