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
- El diseño es monocromo a propósito: no hay variante clara ni `prefers-color-scheme`.
  La paleta vive en `@theme` de `src/app/globals.css` (`paper`, `ink`, `line`, `muted`,
  `panel`, `hairline`) — usa esos tokens, no hexadecimales sueltos.
- Todo lo que no debe imprimirse lleva la clase `.no-print`.
- Datos del catálogo: siempre por `getCatalogo()` en `src/lib/api.ts` (cachea con
  `'use cache'` + `cacheTag('catalogo')`). Si agregas otro fetch cacheado, etiquétalo con
  `CATALOGO_TAG` para que el backend también lo purgue.
- La invalidación necesita `revalidateTag(CATALOGO_TAG, 'max')` **y** `revalidatePath(...)`:
  la etiqueta sola no purga la HTML prerenderizada de la ruta. Si agregas rutas cacheadas
  que muestren el catálogo, añádelas a `src/app/api/revalidate/route.ts`.
