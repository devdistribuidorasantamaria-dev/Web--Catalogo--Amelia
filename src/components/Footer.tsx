import IconoRed, { tieneLogotipo } from '@/components/IconoRed';
import type { RedSocial } from '@/types/catalogo';

type Props = {
  /** Redes con dirección guardada en el panel; vacío = no se pinta la fila. */
  redes?: RedSocial[];
};

/**
 * Pie del catálogo. Las redes salen del panel (Ajustes → Redes sociales): sólo
 * se muestran las que tienen dirección, y el logotipo lo pone el catálogo.
 */
export default function Footer({ redes = [] }: Props) {
  const conLogotipo = redes.filter((red) => tieneLogotipo(red.red));

  return (
    <footer className="mt-auto border-t border-line pb-[60px] pt-[34px] text-center">
      <div className="wrap">
        {conLogotipo.length > 0 ? (
          <nav aria-label="Redes sociales" className="mb-5 flex justify-center gap-2">
            {conLogotipo.map((red) => (
              <a
                key={red.red}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={red.nombre}
                title={red.nombre}
                className="flex h-10 w-10 items-center justify-center border border-transparent text-muted
                           transition-colors hover:border-hairline hover:text-ink
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <IconoRed red={red.red} />
              </a>
            ))}
          </nav>
        ) : null}

        <p className="text-[10px] uppercase tracking-eyebrow text-muted">
          Amelia Boutique · Catálogo
        </p>
      </div>
    </footer>
  );
}
