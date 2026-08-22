import { PRENDAS_POR_PAGINA } from '@/lib/paginacion';

/**
 * Hueco de la rejilla mientras se resuelve el `?pagina=` de la URL. Reserva una
 * fila con la misma forma que las tarjetas para que el encabezado de la sección
 * no salte cuando entra el contenido.
 */
export default function RejillaCargando() {
  return (
    <div className="catalog-grid" aria-hidden>
      {Array.from({ length: Math.min(3, PRENDAS_POR_PAGINA) }, (_, i) => (
        <div key={i} className="catalog-card flex animate-pulse flex-col bg-paper">
          <div className="aspect-3/4 bg-panel" />
          <div className="flex flex-col gap-2.5 px-[18px] pb-[22px] pt-[18px]">
            <div className="h-[22px] w-3/4 bg-panel" />
            <div className="h-3 w-full bg-panel" />
          </div>
        </div>
      ))}
    </div>
  );
}
