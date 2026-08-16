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
    Toolbar.tsx             barra fija: logotipo, secciones, tema, Imprimir/PDF
    BotonTema.tsx           conmuta negro / blanco y lo recuerda
    Masthead.tsx            logotipo y subtítulo
    Chapter.tsx             una sección con su encabezado y su rejilla
    ProductCard.tsx         tarjeta: carrusel, tallas, «Agregar» y «Consultar»
    CartPanel.tsx           botón «Mi lista» + panel lateral con la consulta
    FloatingActions.tsx     columna fija: carrito sobre el contacto general
    WhatsAppButton.tsx      botón flotante de contacto
    RegistroVisita.tsx      dispara el evento de visita; no pinta nada
    Footer.tsx
  lib/api.ts                fetch del catálogo con caché
  lib/anclas.ts             ids de las secciones (los usan barra y capítulos)
  lib/tema.ts               clave, tema por defecto y script anti-destello
  lib/carrito.tsx           store del carrito sobre localStorage
  lib/whatsapp.ts           armado de enlaces y mensajes wa.me
  lib/analitica.ts          envío de los eventos anónimos al backend
  types/catalogo.ts
```

## Detalles de maquetación

- **Filetes de la rejilla**: cada tarjeta lleva su `outline: 1px` y entre ellas hay un hueco
  de 14px, así que cada prenda se lee como una ficha suelta. (El mockup original pintaba el
  fondo de la rejilla y dejaba que asomara por los huecos, pero eso deja bloques grises
  cuando la última fila está incompleta.) Al imprimir el hueco pasa a 0 para no desperdiciar
  papel.
- **Numeración** «N.º 01, 02…» es continua a través de las secciones.
- **Barra superior**: va de filo a filo (no usa `wrap`, a diferencia del catálogo, que sigue
  centrado en 1120px), con el logotipo pegado al borde izquierdo y los botones al derecho.
  Lleva un enlace por sección con prendas, que salta a su `id` (`seccion-<slug>`, armado en
  `src/lib/anclas.ts`). El salto es suave salvo con `prefers-reduced-motion`, y
  `.seccion-anclada` deja el hueco de la barra fija: 80px, 116px bajo 640px, donde la barra
  pasa a dos líneas para que las secciones no queden recortadas.
- `anclaSeccion()` vive en `lib/`, no en `Toolbar.tsx`: `Chapter` es un componente de
  servidor y llamar a una función exportada desde un módulo `'use client'` revienta en
  ejecución («Attempted to call anclaSeccion() from the server»). No lo ve ni tsc ni eslint.
- **Imágenes locales**: Next 16 bloquea optimizar imágenes de hosts locales.
  `next.config.ts` activa `dangerouslyAllowLocalIP` sólo cuando el host de la API es local.

## Tema (negro / blanco)

El botón «Claro / Oscuro» de la barra escribe `data-tema` en `<html>` y guarda la elección
en `localStorage` (`amelia_tema_v1`). Sin atributo manda el tema oscuro, el del maquetado
original; el claro sólo reescribe las variables de color en `globals.css`, así que cualquier
componente nuevo que use los tokens (`bg-paper`, `text-ink`, `border-line`…) funciona en los
dos sin tocarlo.

Tres detalles que costaron una iteración cada uno:

- **Sin destello al recargar**: el tema se aplica con un script en línea bloqueante
  (`SCRIPT_TEMA` en `src/lib/tema.ts`), antes del primer pintado. Vive en un módulo sin
  `'use client'` porque `layout.tsx` es un componente de servidor: importar la constante
  desde el componente cliente mete una referencia al cliente en el `<script>`, no la cadena.
- **`data-tema` no se declara en el JSX de `<html>`**: si React lo renderiza lo considera
  suyo y al hidratar lo devuelve al valor del servidor, borrando el tema guardado.
- **El logotipo se invierte** en el tema claro (`.logo-marca`, `filter: invert(1)`): al ser
  monocromo, el trazo claro sobre negro se vuelve trazo oscuro sobre blanco y no hace falta
  un segundo archivo. Va con `unoptimized` para que el negro llegue exacto y el recuadro
  desaparezca contra la página.

`BotonTema` lee el DOM con `useSyncExternalStore` (igual que el carrito lee localStorage) y
escucha el evento `storage`, así que cambiar el tema en una pestaña pone al día las demás.

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
- Cada línea guarda una **miniatura** (`imagen`): la foto que estaba a la vista al agregar,
  no la portada, para que se reconozca lo que se eligió. Los carritos guardados antes de
  este campo se leen igual — `leerGuardado()` los normaliza a `imagen: null` y la línea
  muestra la marca de agua.
- **Total de referencia**: sólo se muestra y se envía si *todas* las prendas tienen precio
  exacto. Con un rango (25 – 30) cualquier suma sería inventada, así que se omite y el
  mensaje pide que la boutique confirme el valor.

## Logotipo

Se sube desde el panel del backend, en **Ajustes → Logotipo de la cabecera**. La API lo
devuelve en `logo_url` con sus dimensiones (`logo_ancho`, `logo_alto`), que `Masthead.tsx`
pasa a `next/image` para reservar el espacio sin salto de maquetado.

- El archivo se guarda como PNG con transparencia en el disco `public` de Laravel
  (`/storage/marca/…`), así que lo cubre el `remotePatterns` de `next.config.ts`.
- Sin logotipo subido (`logo_url: null`), `Masthead.tsx` escribe «Amelia · Boutique» en
  Cormorant como respaldo.

## Analítica

Tres eventos anónimos hacia `POST /api/eventos` del backend: `visita` al cargar el
catálogo (`RegistroVisita.tsx`, un `useEffect` con guarda de ref para que StrictMode no
cuente dos), y `agregar` / `consultar` en los botones de cada tarjeta.

Todo pasa por `registrarEvento()` en `src/lib/analitica.ts`, que dispara y se olvida:

- Usa `navigator.sendBeacon`, que sobrevive a que la pestaña se descargue — «Consultar»
  se va a WhatsApp y en móvil eso puede matar una petición normal a mitad de camino.
  `fetch` con `keepalive` es el respaldo.
- El cuerpo va en `application/x-www-form-urlencoded`, no JSON: es un tipo «simple» para
  CORS y así el navegador no manda un `OPTIONS` de preflight antes de cada evento.
- Nunca lanza ni bloquea. Si la API está caída, el catálogo se comporta igual.

Los botones **no cambian de comportamiento**: «Agregar» sigue metiendo la prenda en la
lista y mostrando «Agregado ✓», y «Consultar» abre `wa.me` sin `preventDefault`.

El tablero con los datos vive en el panel del backend, en **Analítica**.

## Imprimir

El botón «Imprimir / PDF» usa `window.print()`. Las reglas `@media print` de `globals.css`
esconden la barra y los controles del carrusel (`.no-print`), pasan la rejilla a 2 columnas
y evitan que las tarjetas se corten entre páginas. Los fondos negros se conservan
(`print-color-adjust: exact`).
