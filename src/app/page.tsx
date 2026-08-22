import VistaSeccion from '@/components/VistaSeccion';

/**
 * Portada: la primera sección del catálogo, la que el panel deja arriba. Las
 * demás viven en `/seccion/<slug>`.
 *
 * `searchParams` se pasa sin await a propósito: `VistaSeccion` lo resuelve ya
 * dentro del `<Suspense>` de la rejilla, para que el resto se prerenderice.
 */
export default function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  return <VistaSeccion slug={null} searchParams={searchParams} />;
}
