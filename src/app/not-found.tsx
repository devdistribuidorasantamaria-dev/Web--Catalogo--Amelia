import Link from 'next/link';

/** 404 con la misma piel del catálogo: sección borrada, enlace viejo, URL a mano. */
export default function NoEncontrado() {
  return (
    <main className="wrap flex flex-1 flex-col items-center justify-center py-32 text-center">
      <span className="mb-3 block text-[10px] uppercase tracking-chapter text-muted">
        No encontrado
      </span>

      <h1 className="m-0 font-serif text-[clamp(28px,4.6vw,44px)] font-normal leading-none">
        Esta página no existe
      </h1>

      <div className="mx-auto mb-7 mt-[18px] h-px w-[44px] bg-ink opacity-50" />

      <p className="m-0 mb-8 text-[13px] text-muted">
        Puede que la sección se haya renombrado o ya no esté en el catálogo.
      </p>

      <Link href="/" className="btn">
        Ir al catálogo
      </Link>
    </main>
  );
}
