# Derecho Estudio

Plataforma web de apoyo académico para estudiantes de Derecho.

## Stack
- React 19
- Vite 8
- Supabase / PostgreSQL / Auth / RLS
- GitHub + GitHub Pages
- Google Drive para compendios PDF

## Estado actual — v0.5
- Autenticación y roles.
- Panel del estudiante.
- Administración académica.
- Semestres, materias, 20 unidades y temas/subtemas.
- Contenido académico.
- Normativa y artículos.
- Lecturas recomendadas.
- Documentos / Google Drive / visor PDF.
- Banco administrativo de preguntas.
- Opciones A/B/C/D y respuesta correcta protegida.
- Feedback individual por alternativa.
- Importación masiva CSV/XLSX/XLS.
- Configuración de simuladores: 30 preguntas por unidad y 100 por materia.

## Regla de evaluación
Cada unidad dispone de un simulador de 30 preguntas exclusivamente de esa unidad. Cada materia dispone de un simulador final de 100 preguntas que integra sus cuatro unidades.

## Desarrollo local
```powershell
npm install
npm run dev
```

## Verificación
```powershell
npm run build
npm run lint
```

## Migraciones
```powershell
npx supabase migration list
npx supabase db push
```

Consulta `ACTUALIZACION_v0.5.md` para las instrucciones de esta versión.
