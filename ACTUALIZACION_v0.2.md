# Derecho Estudio v0.2 — Administración académica

## Alcance

Esta versión incorpora CRUD administrativo completo para:

- Semestres
- Materias
- Unidades
- Temas y subtemas

El módulo utiliza las tablas y políticas RLS que ya existen en Supabase. No incluye una nueva migración SQL.

## Requisitos previos

La versión v0.1 debe estar funcionando con:

- `.env.local` configurado localmente
- Git conectado al repositorio
- Cuenta con rol `admin` o `superadmin`
- Migración `20260812213808_initial_schema.sql` aplicada en Supabase

## Instalación sobre el proyecto actual

1. Haz una copia de seguridad de la carpeta actual.
2. Extrae este ZIP en una carpeta temporal.
3. Copia todo el contenido sobre `D:\DERECHO\derecho-estudio`, reemplazando los archivos existentes.
4. No elimines ni reemplaces tu archivo local `.env.local`.
5. No reemplaces la carpeta `.git` de tu proyecto.

Después ejecuta:

```powershell
Set-Location D:\DERECHO\derecho-estudio
npm install
npm run build
npm run lint
git status
```

## Pruebas funcionales

Inicia la aplicación:

```powershell
npm run dev
```

Inicia sesión como superadministrador y prueba:

- `/#/admin`
- `/#/admin/semestres`
- `/#/admin/materias`
- `/#/admin/unidades`
- `/#/admin/temas`

Prueba crear, editar y eliminar un registro temporal en cada módulo.

## Git

Cuando todo funcione:

```powershell
git add .
git commit -m "feat: implementar CRUD academico administrativo v0.2"
git push
git status
```

## Supabase

Esta versión no agrega migraciones nuevas, por lo que `npx supabase db push` debería indicar que la base remota está actualizada.

## Seguridad

Las operaciones administrativas siguen dependiendo de RLS. El frontend oculta las rutas a estudiantes, pero la protección efectiva continúa en Supabase mediante las políticas ya instaladas.
