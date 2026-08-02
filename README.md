# Amelia Boutique — Frontend

Catálogo público. Next.js 16 (App Router) + TypeScript + Tailwind CSS 4.
Lee la API de sólo lectura de [`../amelia-backend`](../amelia-backend); no habla con Postgres.

## Arrancar

```bash
cp .env.example .env.local   # ajusta NEXT_PUBLIC_API_URL y REVALIDATE_SECRET
npm install
npm run dev                  # http://localhost:3000
```

El backend debe estar corriendo en `http://localhost:8000` (o donde apunte `NEXT_PUBLIC_API_URL`).

## Variables

| Variable              | Para qué                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base de la API Laravel. De aquí se derivan los `remotePatterns` de imágenes en `next.config.ts`.                            |
| `REVALIDATE_SECRET`   | Secreto compartido con el backend para purgar la caché. Debe coincidir con `NEXT_REVALIDATE_SECRET` del `.env` de Laravel.   |

## Caché

Cache Components está habilitado (`cacheComponents: true`).
`getCatalogo()` usa `'use cache'` + `cacheTag('catalogo')` + `cacheLife('hours')`:

- El panel de Laravel hace `POST /api/revalidate` con la cabecera `X-Revalidate-Secret`
  después de cada cambio.
- Ese endpoint necesita **las dos** purgas: `revalidateTag('catalogo', 'max')` limpia las
  cachés de datos y `revalidatePath('/')` limpia la HTML prerenderizada de la ruta, que es
  una entrada de caché distinta. Con sólo la etiqueta la página seguía sirviéndose vieja
  hasta cumplir su hora.
- Después de purgar, el endpoint pide `/` una vez para absorber la primera visita
  (stale-while-revalidate), de modo que quien acaba de guardar ya vea su cambio.
- Si el aviso falla, el catálogo se refresca solo dentro de la hora.

Si la API está caída, `getCatalogo()` devuelve un catálogo vacío en lugar de tirar un 500:
la página sigue mostrando el masthead y el estado «Aún no hay prendas».

## Estructura

```
src/
  app/
    layout.tsx              fuentes Cormorant + Jost (self-hosted), metadata
    page.tsx                catálogo completo (server component)
    globals.css             paleta, filetes de la rejilla, reglas @media print
    api/revalidate/route.ts purga de caché que llama el backend
  components/
    Toolbar.tsx             barra fija + Imprimir/PDF
    Masthead.tsx            logotipo y subtítulo
    Chapter.tsx             una sección con su encabezado y su rejilla
    ProductCard.tsx         tarjeta: carrusel, tallas, «Agregar» y «Consultar»
    CartPanel.tsx           botón «Mi lista» + panel lateral con la consulta
    FloatingActions.tsx     columna fija: carrito sobre el contacto general
    WhatsAppButton.tsx      botón flotante de contacto
    Footer.tsx
  lib/api.ts                fetch del catálogo con caché
  lib/carrito.tsx           store del carrito sobre localStorage
  lib/whatsapp.ts           armado de enlaces y mensajes wa.me
  types/catalogo.ts
```

## Detalles de maquetación

- **Filetes de la rejilla**: cada tarjeta lleva `outline: 1px`; como el hueco entre celdas
  también es de 1px, los outlines vecinos coinciden y se ven como una línea sola.
  (El mockup original pintaba el fondo de la rejilla y dejaba que asomara por los huecos,
  pero eso deja bloques grises cuando la última fila está incompleta.)
- **Numeración** «N.º 01, 02…» es continua a través de las secciones.
- **Imágenes locales**: Next 16 bloquea optimizar imágenes de hosts locales.
  `next.config.ts` activa `dangerouslyAllowLocalIP` sólo cuando el host de la API es local.

## Contacto y lista de consulta

Tres puntos de contacto, todos hacia el mismo WhatsApp configurado en el panel
(**Ajustes → Botón de contacto**). Sin número configurado la API devuelve `null` y no se
renderiza ninguno.

| Dónde | Mensaje |
| ----- | ------- |
| Botón flotante «Escríbenos» | El mensaje general del panel (`whatsapp_url`, lo arma el backend). |
| «Consultar» en cada tarjeta | Nombre de la prenda, talla elegida y precio. |
| «Consultar precio» del carrito | La lista completa con cantidades, tallas y precios. |

Los dos últimos se arman en `src/lib/whatsapp.ts` a partir de `whatsapp_numero`.

### Carrito

No hay pasarela de pago: es una **lista de consulta**. Vive sólo en el navegador
(`localStorage`, clave `amelia_carrito_v1`) y se lee con `useSyncExternalStore` en
`src/lib/carrito.tsx` — así la hidratación arranca desde la lista vacía, igual que la HTML
estática, sin desajustes.

- Una misma prenda en dos tallas son dos líneas distintas.
- La talla se elige pulsando los chips de la tarjeta; volver a pulsarla la deselecciona.
- **Total de referencia**: sólo se muestra y se envía si *todas* las prendas tienen precio
  exacto. Con un rango (25 – 30) cualquier suma sería inventada, así que se omite y el
  mensaje pide que la boutique confirme el valor.

## Logotipo

`Masthead.tsx` muestra el nombre compuesto en Cormorant. Para usar el logotipo real:

1. Guarda el archivo en `public/logo.png` (o `.jpg` / `.svg`).
2. En `src/components/Masthead.tsx` cambia `const LOGO_SRC = null` por `'/logo.png'`
   y ajusta `LOGO_ANCHO` / `LOGO_ALTO` a sus dimensiones reales.

## Imprimir

El botón «Imprimir / PDF» usa `window.print()`. Las reglas `@media print` de `globals.css`
esconden la barra y los controles del carrusel (`.no-print`), pasan la rejilla a 2 columnas
y evitan que las tarjetas se corten entre páginas. Los fondos negros se conservan
(`print-color-adjust: exact`).
