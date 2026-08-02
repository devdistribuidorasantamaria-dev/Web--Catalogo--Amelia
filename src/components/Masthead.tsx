import Image from 'next/image';

/**
 * Cabecera del catálogo.
 *
 * Para usar el logotipo real de la boutique, guarda el archivo en
 * `public/logo.png` (o .jpg/.svg) y apunta LOGO_SRC ahí. Mientras sea `null`
 * se muestra el nombre compuesto en Cormorant, con el mismo peso visual.
 */
const LOGO_SRC: string | null = null;
const LOGO_ANCHO = 360;
const LOGO_ALTO = 120;

export default function Masthead({ subtitulo }: { subtitulo: string }) {
  return (
    <header className="pb-[30px] pt-14 text-center">
      <div className="wrap">
        {LOGO_SRC ? (
          <Image
            src={LOGO_SRC}
            alt="Amelia Boutique"
            width={LOGO_ANCHO}
            height={LOGO_ALTO}
            priority
            className="mx-auto h-auto w-[62%] max-w-[360px]"
          />
        ) : (
          <div className="mx-auto max-w-[360px]">
            <p className="font-serif text-[clamp(44px,11vw,76px)] font-light leading-[0.9] tracking-[0.02em]">
              Amelia
            </p>
            <p className="mt-3 text-[10px] uppercase tracking-chapter text-muted">Boutique</p>
          </div>
        )}

        <div className="mx-auto mb-[18px] mt-[26px] h-px w-[52px] bg-ink opacity-50" />

        {subtitulo ? (
          <p className="inline-block px-1.5 text-[11px] uppercase tracking-eyebrow text-muted">
            {subtitulo}
          </p>
        ) : null}
      </div>
    </header>
  );
}
