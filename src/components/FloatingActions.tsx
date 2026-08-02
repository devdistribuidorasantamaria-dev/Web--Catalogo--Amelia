import CartPanel from '@/components/CartPanel';
import WhatsAppButton from '@/components/WhatsAppButton';

/** Columna fija abajo a la derecha: la lista de consulta sobre el contacto general. */
export default function FloatingActions({
  whatsappUrl,
  whatsappNumero,
}: {
  whatsappUrl: string | null;
  whatsappNumero: string | null;
}) {
  return (
    <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <CartPanel whatsappNumero={whatsappNumero} />
      <WhatsAppButton url={whatsappUrl} />
    </div>
  );
}
