import ProductCard from '@/components/ProductCard';
import type { Bloque } from '@/types/catalogo';

type Props = {
  bloque: Bloque;
  /** Número correlativo (base 1) de la primera prenda del bloque. */
  desde: number;
  whatsappNumero: string | null;
  /** Sólo el primer bloque carga sus fotos con prioridad. */
  primero?: boolean;
};

export default function Chapter({ bloque, desde, whatsappNumero, primero = false }: Props) {
  return (
    <section className="mt-2">
      {bloque.seccion ? (
        <div className="chapter-head pb-6 pt-[46px] text-center">
          <span className="mb-3 block text-[10px] uppercase tracking-chapter text-muted">
            Sección
          </span>
          <h2 className="m-0 font-serif text-[clamp(28px,4.6vw,44px)] font-normal leading-none tracking-[0.02em]">
            {bloque.seccion.nombre}
          </h2>
          <div className="mx-auto mt-[18px] h-px w-[44px] bg-ink opacity-50" />
        </div>
      ) : null}

      <div className="catalog-grid">
        {bloque.prendas.map((prenda, i) => (
          <ProductCard
            key={prenda.id}
            prenda={prenda}
            numero={String(desde + i).padStart(2, '0')}
            whatsappNumero={whatsappNumero}
            prioridad={primero && i < 3}
          />
        ))}
      </div>
    </section>
  );
}
