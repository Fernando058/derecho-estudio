# Derecho Estudio v0.7.1 — Hotfix de compilación en Windows

## Problema corregido

En v0.7 coexistían estos archivos:

- `src/context/AuthContext.jsx`
- `src/context/authContext.js`

Windows usa un sistema de archivos que normalmente no distingue mayúsculas/minúsculas.
El import sin extensión de `src/main.jsx`:

```js
from './context/AuthContext'
```

podía resolver `authContext.js` antes que `AuthContext.jsx`.

`authContext.js` exporta `AuthContext`, pero no `AuthProvider`, por lo que Vite reportaba:

`"AuthProvider" is not exported by "src/context/AuthContext.js"`.

## Corrección

`src/main.jsx` ahora usa la extensión explícita:

```js
from './context/AuthContext.jsx'
```

Esto elimina la ambigüedad sin modificar la arquitectura de autenticación.

## Base de datos

No hay migraciones nuevas en v0.7.1.

No es necesario ejecutar `supabase db push` si v0.7 ya fue aplicada.

## Verificación

Ejecutar:

```powershell
npm install
npm run build
npm run lint
```

Resultado esperado:

- Build: correcto.
- Lint: 0 warnings, 0 errors.
