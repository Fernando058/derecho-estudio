# Derecho Estudio

Plataforma académica de apoyo para estudiantes de Derecho.

## Versión actual

**v0.2.0 — Administración académica**

Funciones disponibles:

- React + Vite
- Supabase PostgreSQL + Auth + RLS
- GitHub Pages
- Registro, inicio y cierre de sesión
- Roles `student`, `admin` y `superadmin`
- Dashboard inicial
- Visor de PDF mediante enlaces de Google Drive
- CRUD administrativo de semestres
- CRUD administrativo de materias
- CRUD administrativo de unidades
- CRUD administrativo de temas y subtemas

## Desarrollo local

```powershell
npm install
npm run dev
```

## Validación

```powershell
npm run build
npm run lint
```

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

`.env.local` no debe subirse al repositorio.

## Próxima versión

La v0.3 incorporará administración de documentos/compendios mediante enlaces de Google Drive y su visor integrado dentro de la estructura académica.
