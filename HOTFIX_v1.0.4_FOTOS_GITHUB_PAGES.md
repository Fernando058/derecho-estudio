# Derecho Estudio v1.0.4 — Hotfix fotos en GitHub Pages

## Problema detectado
Las fotografías sí estaban incluidas correctamente en:

- `public/collaborators/jose-xavier-santos.png`
- `public/collaborators/francisco-fernando-cardenas.jpg`

El problema estaba en las rutas usadas por `AboutPage.jsx`.

Se estaban cargando como rutas absolutas:

```js
/collaborators/...
```

Eso funciona desde la raíz de un dominio, pero el proyecto está publicado en GitHub Pages bajo:

`/derecho-estudio/`

Por eso el navegador intentaba buscar las imágenes fuera de la carpeta del proyecto.

## Corrección
Ahora se usa:

```js
import.meta.env.BASE_URL
```

por lo que las imágenes se resuelven correctamente tanto en desarrollo local como en GitHub Pages:

`/derecho-estudio/collaborators/...`

## Base de datos
No hay cambios de Supabase, migraciones ni SQL.

## Verificación
Ejecutar:

```powershell
npm run build
npm run lint
npm run dev
```

Después abrir:

`/#/acerca`

y confirmar que aparecen ambas fotografías.
