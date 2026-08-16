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
- Los iconos de `src/app/` (`favicon.ico`, `icon.png`, `apple-icon.png`) se generan, no se
  editan a mano: `php scripts/generar-iconos.php <logotipo.png>`. Salen de la «A» del
  logotipo, no del wordmark entero, que a 16 px es ilegible.
- Datos del catálogo: siempre por `getCatalogo()` en `src/lib/api.ts` (cachea con
  `'use cache'` + `cacheTag('catalogo')`). Si agregas otro fetch cacheado, etiquétalo con
  `CATALOGO_TAG` para que el backend también lo purgue.
- Analítica: los eventos salen por `registrarEvento()` de `src/lib/analitica.ts`, nunca con
  un `fetch` suelto. Dispara y se olvida — nada de `await`, de estado ni de `preventDefault`
  en los botones que ya hacían algo. Si agregas un punto de contacto nuevo, añade su tipo
  también a `App\Enums\TipoEvento` del backend.
- La invalidación necesita `revalidateTag(CATALOGO_TAG, 'max')` **y** `revalidatePath(...)`:
  la etiqueta sola no purga la HTML prerenderizada de la ruta. Si agregas rutas cacheadas
  que muestren el catálogo, añádelas a `src/app/api/revalidate/route.ts`.
