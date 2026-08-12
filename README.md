# Derecho Estudio

Plataforma académica de apoyo para estudiantes de Derecho.

## Versión actual

**v0.4.0 — Contenido jurídico y área de estudio**

Funciones disponibles:

- React + Vite con carga diferida de rutas
- Supabase PostgreSQL + Auth + RLS
- GitHub Pages
- Registro, inicio y cierre de sesión
- Roles `student`, `admin` y `superadmin`
- Dashboard del estudiante
- CRUD administrativo de semestres, materias, unidades, temas y subtemas
- CRUD de documentos/compendios mediante enlaces de Google Drive
- Biblioteca y visor PDF integrado
- CRUD de bloques de contenido académico
- CRUD de fuentes legales y artículos
- Relación de artículos con temas
- CRUD de lecturas recomendadas y relación con temas
- Página de estudio por materia
- Página de estudio por unidad
- 20 unidades iniciales de cuarto semestre
- Configuración base de simuladores: 30 preguntas por unidad y 100 por materia

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

## Migraciones

Después de aplicar una versión que incluya migraciones:

```powershell
npx supabase migration list
npx supabase db push
npx supabase migration list
```

## Próxima versión

La v0.5 incorporará el banco de preguntas, importación masiva y la base del motor de simuladores.
