@AGENTS.md

# Amelia Boutique — Frontend

Catálogo público en Next.js 16 + TS + Tailwind 4. Consume la API de sólo lectura de
`../amelia-backend`. **No hay acceso a base de datos desde aquí.**

Lee `README.md` para el arranque, las variables y los detalles de maquetación.

## Reglas del proyecto

- **Español** en textos de interfaz, comentarios y nombres de dominio (`prenda`, `seccion`,
  `talla`, `precio`). El código y las APIs de framework quedan en inglés.
- La escritura (crear/editar/borrar prendas) vive **sólo** en el panel Blade del backend.
  No agregues formularios de edición aquí.
- El diseño es monocromo a propósito: sólo negro o blanco, nunca color. La paleta vive en
  `@theme` de `src/app/globals.css` (`paper`, `ink`, `line`, `muted`, `panel`, `hairline`,
  `marca-agua`) — usa esos tokens, no hexadecimales sueltos, o el tema claro te queda roto.
- El tema lo elige el visitante con el botón de la barra (`BotonTema.tsx`): escribe
  `data-tema="claro"` en `<html>` y `globals.css` reescribe ahí las variables. Sin atributo
  = tema oscuro. No hay `prefers-color-scheme`: la marca abre en negro a propósito.
  Excepción a los tokens: los controles que van **encima de una foto** (`N.º`, flechas,
  puntos) siguen en blanco/negro fijos, porque no dependen del fondo de la página.
- Todo lo que no debe imprimirse lleva la clase `.no-print`.
- **Una página por sección**: `/` es la primera, `/seccion/<slug>` las demás, y dentro de
  cada una se pagina con `?pagina=N` (12 por página, en una rejilla de 2 ó 3 columnas
  — `.catalog-grid--panel` — porque el panel de filtros ocupa la columna izquierda).
  El reparto de rutas, nombres y numeración lo decide `navegacion()` en
  `src/lib/rutas.ts` — si agregas una vista que liste secciones, sácala de ahí y no
  vuelvas a recorrer `catalogo.bloques` a mano, o el orden y los «N.º» se te van a
  separar de la navegación.
- **Filtros de sección** (precio y talla, nada más): viven en la URL
  (`?precio_min=&precio_max=&tallas=S,M`) junto al `?pagina=`, se leen y validan en el
  servidor con `src/lib/filtros.ts` y se aplican **antes** de paginar, para que la cuenta de
  páginas sea la de las prendas que quedan. `PanelFiltros.tsx` es sólo la interfaz: no
  guarda el filtro, sólo el precio mientras se arrastra el deslizador, y navega. Si agregas
  otro criterio, añádelo a `Filtros`/`consultaFiltros()` y no leas `searchParams` sueltos.
- El PDF del catálogo completo vive en `/imprimir`, aparte: las páginas de sección están
  paginadas y no sirven para imprimir. Si cambias la rejilla o la tarjeta, comprueba las
  dos vistas.
- `?pagina=` es dato de petición: se lee **fuera** de `'use cache'` y se pasa como prop
  (ver `VistaSeccion` → `RejillaSeccion`), con la rejilla dentro de un `<Suspense>` para que
  el resto de la página se siga prerenderizando.
- Los iconos de `src/app/` (`favicon.ico`, `icon.png`, `apple-icon.png`) se generan, no se
  editan a mano: `php scripts/generar-iconos.php <logotipo.png>`. Salen de la «A» del
  logotipo, no del wordmark entero, que a 16 px es ilegible.
- Datos del catálogo: siempre por `getCatalogo()` en `src/lib/api.ts` (cachea con
  `'use cache'` + `cacheTag('catalogo')`). Si agregas otro fetch cacheado, etiquétalo con
  `CATALOGO_TAG` para que el backend también lo purgue.
- Redes sociales del pie: la dirección viene de la API (`catalogo.redes`, sólo las que el
  panel tiene cargadas) y el **logotipo vive aquí**, en `IconoRed.tsx`, como trazo SVG
  monocromo con `fill-current`. Nada de logos en color ni de SVG traídos de fuera. Si el
  backend agrega una red, agrega su trazo o el pie la ignora (`tieneLogotipo()`).
- Analítica: los eventos salen por `registrarEvento()` de `src/lib/analitica.ts`, nunca con
  un `fetch` suelto. Dispara y se olvida — nada de `await`, de estado ni de `preventDefault`
  en los botones que ya hacían algo. Si agregas un punto de contacto nuevo, añade su tipo
  también a `App\Enums\TipoEvento` del backend.
- La invalidación necesita `revalidateTag(CATALOGO_TAG, 'max')` **y** `revalidatePath(...)`:
  la etiqueta sola no purga la HTML prerenderizada de la ruta. Si agregas rutas cacheadas
  que muestren el catálogo, añádelas a `src/app/api/revalidate/route.ts`.
