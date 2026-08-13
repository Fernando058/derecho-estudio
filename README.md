# Derecho Estudio

Plataforma web de apoyo académico para estudiantes de Derecho.

## Stack
- React 19
- Vite 8
- Supabase / PostgreSQL / Auth / RLS
- GitHub + GitHub Pages
- Google Drive para compendios PDF

## Estado actual — v0.7
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
- Motor seguro de simuladores y corrección.
- Historial de intentos.
- Analítica personal por materia, unidad y tema.
- Práctica personalizada de errores.
- Analítica administrativa de rendimiento.
- Configuración administrativa de tiempos, aleatorización y distribución final.

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

Consulta `ACTUALIZACION_v0.7.md` para las instrucciones de esta versión.


## Estado actual

Versión técnica actual: **v0.8.0** — usuarios, perfil y recuperación segura.


## v0.9

Consolidación, auditoría de preparación para v1.0 y trazabilidad del dataset académico integral.
