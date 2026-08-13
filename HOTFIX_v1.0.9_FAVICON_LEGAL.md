# Lex Academia v1.0.9 — Favicon e icono legal

## Cambio principal
Se reemplaza el icono por defecto de Vite (rayo) por un favicon jurídico propio
de **Lex Academia**.

## Qué se actualizó
- `index.html` ahora usa:
  - `%BASE_URL%legal-favicon.svg`
- se agregó:
  - `public/legal-favicon.svg`
- el título del navegador queda:
  - `Lex Academia`

## Resultado esperado
En la pestaña del navegador y en GitHub Pages ya no debe aparecer el rayo de Vite.
Ahora debe verse un icono legal con balanza y estética azul-dorado.

## Base de datos
No hay cambios en Supabase.
No ejecutar `supabase db push`.
