# Derecho Estudio — Actualización v0.4.0

## Objetivo

La v0.4 transforma la estructura académica ya creada en una verdadera área de estudio. Permite administrar análisis jurídicos, normativa y lecturas, y muestra esos contenidos al estudiante dentro de cada materia y unidad.

## Cambios principales

### Administración

Se habilitan tres módulos nuevos:

- `/admin/contenido`
- `/admin/normativa`
- `/admin/lecturas`

El administrador puede crear, editar, publicar y eliminar:

- introducciones;
- resúmenes;
- análisis jurídicos;
- conceptos clave;
- orientaciones para evaluación;
- ejemplos y advertencias;
- fuentes legales;
- artículos jurídicos;
- relaciones entre artículos y temas;
- lecturas recomendadas;
- relaciones entre lecturas y temas.

### Área del estudiante

Nuevas rutas:

- `/materias/:subjectSlug`
- `/materias/:subjectSlug/unidades/:unitNumber`

Cada unidad puede mostrar:

- resultado de aprendizaje;
- contenido general;
- temas y subtemas;
- análisis;
- conceptos clave;
- base normativa y artículos;
- lecturas recomendadas;
- compendios/documentos;
- referencia al simulador de 30 preguntas.

Cada materia muestra además la preparación del simulador final de 100 preguntas.

## Migración nueva

Archivo:

`supabase/migrations/20260812230000_academic_content_foundation.sql`

La migración:

1. limita cada materia a unidades numeradas del 1 al 4;
2. valida que un subtema pertenezca a la misma unidad de su tema padre;
3. valida que un bloque temático pertenezca a la misma unidad;
4. crea las 20 unidades iniciales de cuarto semestre si todavía no existen;
5. crea una configuración `unit_30` para cada unidad;
6. crea una configuración `subject_100` para cada materia;
7. crea una distribución inicial de 25 preguntas por unidad para el examen final.

**Regla académica preservada:** el simulador de 30 preguntas utiliza únicamente preguntas de su unidad. El simulador de 100 preguntas integra las cuatro unidades de la materia.

## Importante sobre las unidades precargadas

Los nombres se organizaron a partir de los compendios entregados. En los casos donde el material no presenta un título unitario explícito, se utilizó un título operativo basado en los temas que conforman la unidad. El contenido jurídico detallado seguirá siendo administrable y no queda rígidamente incrustado en React.

## Aplicación

```powershell
Set-Location D:\DERECHO

Expand-Archive `
  -Path .\derecho-estudio-v0.4-contenido-juridico.zip `
  -DestinationPath .\derecho-estudio `
  -Force

Set-Location D:\DERECHO\derecho-estudio

npm install
npx supabase migration list
npx supabase db push
npx supabase migration list
npm run build
npm run lint
npm run dev
```

## Comprobaciones

- Dashboard: cada materia debe tener el botón `Estudiar materia`.
- Cada materia debe mostrar 4 unidades.
- `/admin/contenido` debe permitir crear bloques.
- `/admin/normativa` debe permitir crear fuentes, artículos y relaciones.
- `/admin/lecturas` debe permitir crear lecturas y relaciones.
- La página de una unidad debe mostrar inmediatamente el contenido publicado.
- Los documentos de Google Drive existentes deben seguir funcionando.

## Git

Cuando todas las pruebas sean correctas:

```powershell
git add .
git commit -m "feat: implementar contenido juridico y unidades v0.4"
git push
git status
```
