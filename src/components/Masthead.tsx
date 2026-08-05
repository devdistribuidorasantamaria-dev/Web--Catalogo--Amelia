import Image from 'next/image';

type Props = {
  subtitulo: string;
  /** URL del logotipo subido en el panel (Ajustes); null = respaldo en texto. */
  logoUrl: string | null;
  logoAncho: number | null;
  logoAlto: number | null;
};

/** Ancho al que se muestra el logotipo cuando no cabe el 62% de la columna. */
const LOGO_ANCHO_MAX = 360;

/**
 * Cabecera del catálogo.
 *
 * El logotipo se administra desde el panel del backend (Ajustes → Logotipo de la
 * cabecera). Mientras no haya archivo subido se escribe el nombre compuesto en
 * Cormorant, con el mismo peso visual.
 */
export default function Masthead({ subtitulo, logoUrl, logoAncho, logoAlto }: Props) {
  return (
    <header className="pb-[30px] pt-14 text-center">
      <div className="wrap">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Amelia Boutique"
            width={logoAncho ?? LOGO_ANCHO_MAX}
            height={logoAlto ?? 120}
            priority
            // Sin optimizar: pesa pocos KB y así el negro del fondo llega exacto,
            // que es lo que hace que el recuadro desaparezca contra la página en
            // los dos temas (en el claro se invierte a blanco puro).
            unoptimized
            // .logo-marca lo invierte en el tema claro (ver globals.css).
            className="logo-marca mx-auto h-auto w-[62%] max-w-[360px]"
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
