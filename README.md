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
  cachés de datos y `revalidatePath(...)` limpia la HTML prerenderizada de la ruta, que es
  una entrada de caché distinta. Con sólo la etiqueta la página seguía sirviéndose vieja
  hasta cumplir su hora. Se purgan `/`, `/imprimir` y —con el patrón de ruta más
  `'page'`— `/seccion/[slug]`, que cubre las páginas de todas las secciones sin que el
  backend tenga que enumerarlas.
- Después de purgar, el endpoint pide `/` una vez para absorber la primera visita
  (stale-while-revalidate), de modo que quien acaba de guardar ya vea su cambio. Las demás
  secciones se regeneran cuando alguien entra en ellas.
- Si el aviso falla, el catálogo se refresca solo dentro de la hora.

Si la API está caída, `getCatalogo()` devuelve un catálogo vacío en lugar de tirar un 500:
la página sigue mostrando el masthead y el estado «Aún no hay prendas».

## Estructura

```
src/
  app/
    layout.tsx              fuentes Cormorant + Jost (self-hosted), metadata
    page.tsx                portada: la primera sección del catálogo
    seccion/[slug]/page.tsx las demás secciones, una página cada una
    imprimir/page.tsx       catálogo entero en una sola página, para el PDF
    not-found.tsx           404 con la piel del catálogo
    globals.css             paleta, filetes de la rejilla, reglas @media print
    favicon.ico             la «A» del logotipo, 16/32/48
    icon.png                512, para pestañas y marcadores
    apple-icon.png          180, para la pantalla de inicio de iOS
    api/revalidate/route.ts purga de caché que llama el backend
  components/
    VistaSeccion.tsx        la página de una sección: barra, cabecera, rejilla
    Toolbar.tsx             barra fija: logotipo, secciones, tema, Imprimir/PDF
    BotonTema.tsx           conmuta negro / blanco y lo recuerda
    Masthead.tsx            logotipo y subtítulo
    EncabezadoSeccion.tsx   «SECCIÓN / Nombre» con su filete
    RejillaSeccion.tsx      una página de prendas de la sección (cacheada)
    RejillaCargando.tsx     hueco de la rejilla mientras se resuelve ?pagina=
    Paginacion.tsx          enlaces de página (‹ Anterior · 01 02 03 · Siguiente ›)
    ProductCard.tsx         tarjeta: carrusel, tallas, «Agregar» y «Consultar»
    CartPanel.tsx           botón «Mi lista» + panel lateral con la consulta
    FloatingActions.tsx     columna fija: carrito sobre el contacto general
    WhatsAppButton.tsx      botón flotante de contacto
    BarraImpresion.tsx      barra de /imprimir; abre el diálogo al llegar
    RegistroVisita.tsx      dispara el evento de visita; no pinta nada
    Footer.tsx
  lib/api.ts                fetch del catálogo con caché
  lib/rutas.ts              navegación: una entrada (y una página) por sección
  lib/paginacion.ts         prendas por página, cuenta de páginas y ?pagina=
  lib/tema.ts               clave, tema por defecto y script anti-destello
  lib/carrito.tsx           store del carrito sobre localStorage
  lib/whatsapp.ts           armado de enlaces y mensajes wa.me
  lib/analitica.ts          envío de los eventos anónimos al backend
  types/catalogo.ts
scripts/generar-iconos.php  recorta la «A» del logotipo y escribe los iconos
```

## Rutas

Una página por sección. Antes el catálogo era una sola página con todas las secciones
apiladas, y con unas pocas prendas por sección ya se volvía un scroll interminable.

| Ruta                    | Qué es                                                                    |
| ----------------------- | ------------------------------------------------------------------------- |
| `/`                     | La **primera** sección del catálogo, la que el panel deja arriba.          |
| `/seccion/<slug>`       | Las demás secciones. La primera redirige (307) a `/`, para no tener dos URLs con lo mismo. |
| `/seccion/otras-prendas`| Las prendas sin sección, si hay alguna.                                   |
| `/imprimir`             | El catálogo entero en una página, sin paginar, y abre el diálogo de impresión. |
| `?pagina=N`             | Página dentro de la sección. La 1 no lleva parámetro.                      |

- La barra superior es la navegación: un enlace por sección y la abierta marcada con
  `aria-current="page"` y el filete de abajo. Ya no son anclas (`#seccion-…`) a una página
  larga, así que no queda nada de `scroll-margin` ni de saltos suaves.
- **El bloque sin sección va al final.** La API lo manda primero (así iba en el maquetado
  de una sola página, sin encabezado), pero con una página por sección un cajón de sastre
  no puede ser la portada del catálogo. El reordenamiento vive en `navegacion()`
  (`src/lib/rutas.ts`), que es también quien reparte los `href` y la numeración.
- Las secciones que existen al construir se prerenderizan (`generateStaticParams`); una
  creada después se resuelve en su primera visita.

## Paginación

Cada sección pagina por su cuenta, de **12 en 12** (`PRENDAS_POR_PAGINA` en
`src/lib/paginacion.ts`, cuatro filas de la rejilla de escritorio). Una sección de 12
prendas o menos no muestra controles.

- La página vive en la URL (`?pagina=2`), así que se puede compartir, marcar y volver atrás
  con el botón del navegador. Los controles son **enlaces**, no botones con estado.
- `paginaValida()` acota lo que venga: `?pagina=99` cae en la última, y `abc` o `-3` en la
  primera. La URL la escribe cualquiera.
- La numeración «N.º 01, 02…» **no se reinicia** ni por página ni por sección: sigue siendo
  continua en todo el catálogo, y `/imprimir` usa la misma cuenta.
- El corte se hace al renderizar, sobre el catálogo completo que ya trae `getCatalogo()`.
  No hay endpoint paginado ni una petición por página.
- Cómo encaja con Cache Components: `?pagina=` es dato de petición, así que la rejilla vive
  dentro de un `<Suspense>` (`RejillaCargando` de relleno) y todo lo demás —barra, cabecera,
  encabezado de la sección— se prerenderiza. `RejillaSeccion` recibe el número ya resuelto
  como prop porque dentro de `'use cache'` no se puede tocar `searchParams`; así la HTML de
  cada sección + página se cachea con la etiqueta `catalogo` y el panel la purga igual.
  Sin esa frontera, leer `searchParams` obliga a toda la ruta a resolverse en cada visita
  (el aviso `blocking-route` de Next 16).

## Impresión

«Imprimir / PDF» de la barra no imprime la sección abierta: lleva a **`/imprimir`**, que
arma todas las secciones seguidas, sin paginar, y abre el diálogo del navegador al llegar
(con medio segundo de margen, para que las fuentes y las primeras fotos hayan pintado).
El cliente sigue teniendo un PDF único del catálogo completo, que es como lo reparte.

La barra de esa vista lleva `.no-print`, igual que todo lo que no debe salir en papel.

## Detalles de maquetación

- **Filetes de la rejilla**: cada tarjeta lleva su `outline: 1px` y entre ellas hay un hueco
  de 14px, así que cada prenda se lee como una ficha suelta. (El mockup original pintaba el
  fondo de la rejilla y dejaba que asomara por los huecos, pero eso deja bloques grises
  cuando la última fila está incompleta.) Al imprimir el hueco pasa a 0 para no desperdiciar
  papel.
- **Numeración** «N.º 01, 02…» es continua en todo el catálogo: no se reinicia por sección
  ni por página (ver «Paginación»).
- **Barra superior**: va de filo a filo (no usa `wrap`, a diferencia del catálogo, que sigue
  centrado en 1120px), con el logotipo pegado al borde izquierdo y los botones al derecho.
  Lleva un enlace por sección con prendas y marca la abierta. Bajo 640px pasa a dos líneas
  para que las secciones no queden recortadas.
- `Toolbar` es un componente de **servidor**: la sección abierta llega como prop, no de
  `usePathname()`, así que no manda nada de JavaScript al navegador. `BotonTema`, que sí es
  de cliente, se importa desde ahí sin problema.
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

## Icono del navegador

`src/app/` lleva los tres archivos que Next detecta por el nombre y convierte solo en
etiquetas `<link>`: `favicon.ico` (16/32/48), `icon.png` (512) y `apple-icon.png` (180).

Salen del logotipo de la marca, pero **no del logotipo entero**: es un wordmark apaisado
de 472×247 y encogido a 16 px sería una mancha. Se recorta la «A» manuscrita, centrada
sobre el cuadrado negro de la marca. Para regenerarlos si el cliente cambia el logotipo:

```bash
php scripts/generar-iconos.php ../amelia-backend/storage/app/public/marca/<archivo>.png /tmp/tira.png
```

El segundo argumento es opcional y dibuja una tira de control con el icono a 16, 24, 32,
48, 64 y 128 px sobre fondo claro y oscuro, para comprobar de un vistazo que la «A» se
sigue leyendo. Dos cosas que el script resuelve y conviene no deshacer:

- El trazo se **engrosa sólo a 16 px**. Es una letra manuscrita muy fina y a ese tamaño
  ocupa menos de un píxel; de 24 px en adelante engrosarla la vuelve tosca.
- Los PNG se guardan en **RGBA** aunque el icono sea opaco: Next rechaza los iconos que no
  traigan canal alfa con «The PNG is not in RGBA format!».

El script está en PHP porque el logotipo vive en el backend Laravel y GD ya es un
requisito de ese proyecto; el frontend no tiene ninguna dependencia de imágenes y no valía
la pena añadirle una para esto.

## Analítica

Tres eventos anónimos hacia `POST /api/eventos` del backend: `visita` al abrir el catálogo,
y `agregar` / `consultar` en los botones de cada tarjeta.

Una visita es **abrir el catálogo, no abrir una sección**: con una página por sección,
pasear por la barra dispararía una visita por clic e inflaría la cuenta. `RegistroVisita.tsx`
marca la visita en `sessionStorage` (`amelia_visita_v1`), así que sólo cuenta la primera de
la pestaña; eso cubre además las recargas y el doble montaje de StrictMode en desarrollo.

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
