export type Prenda = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  tallas: string[];
  precio_desde: string | null;
  precio_hasta: string | null;
  /** Ya formateado por el backend: "$25.00", "$25.00 – $30.00" o "—". */
  precio_texto: string;
  imagenes: string[];
};

export type Seccion = {
  id: number;
  nombre: string;
  slug: string;
};

export type Bloque = {
  /** null = prendas sin sección; se renderizan sin encabezado. */
  seccion: Seccion | null;
  prendas: Prenda[];
};

export type Catalogo = {
  subtitulo: string;
  /** Enlace wa.me armado por el backend; null si no hay número configurado. */
  whatsapp_url: string | null;
  /** Número en dígitos, para armar mensajes propios (prenda, carrito). */
  whatsapp_numero: string | null;
  total_prendas: number;
  bloques: Bloque[];
};

export type ItemCarrito = {
  prendaId: number;
  nombre: string;
  /** Talla elegida en la tarjeta; null si la prenda no tiene tallas. */
  talla: string | null;
  precioTexto: string;
  /** Se usa para el total de referencia: sólo si no es un rango. */
  precioExacto: number | null;
  cantidad: number;
};
