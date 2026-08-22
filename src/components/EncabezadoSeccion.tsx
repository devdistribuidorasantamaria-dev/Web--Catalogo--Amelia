/**
 * Encabezado de una sección: la misma pieza en la página de la sección y en la
 * vista de impresión, que las lleva todas seguidas.
 */
export default function EncabezadoSeccion({ nombre }: { nombre: string }) {
  return (
    <div className="chapter-head pb-6 pt-[46px] text-center">
      <span className="mb-3 block text-[10px] uppercase tracking-chapter text-muted">Sección</span>
      <h2 className="m-0 font-serif text-[clamp(28px,4.6vw,44px)] font-normal leading-none tracking-[0.02em]">
        {nombre}
      </h2>
      <div className="mx-auto mt-[18px] h-px w-[44px] bg-ink opacity-50" />
    </div>
  );
}
