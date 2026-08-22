import { redirect } from 'next/navigation';

import VistaSeccion from '@/components/VistaSeccion';
import { getCatalogo } from '@/lib/api';
import { navegacion } from '@/lib/rutas';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
};

/**
 * Las secciones conocidas se prerenderizan; una que se cree después se resuelve
 * en la primera visita (`dynamicParams`, el valor por omisión).
 */
export async function generateStaticParams() {
  const catalogo = await getCatalogo();

  // La primera sección vive en la raíz, no aquí: no se prerenderiza dos veces.
  return navegacion(catalogo.bloques)
    .slice(1)
    .map((entrada) => ({ slug: entrada.slug }));
}

export default async function SeccionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const catalogo = await getCatalogo();
  const entradas = navegacion(catalogo.bloques);

  // La primera sección tiene una sola URL, la raíz: si se pide por /seccion/…
  // se manda allí en vez de servir el mismo catálogo en dos direcciones.
  if (entradas.length > 0 && entradas[0].slug === slug) {
    redirect('/');
  }

  return <VistaSeccion slug={slug} searchParams={searchParams} />;
}
