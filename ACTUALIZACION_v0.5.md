# Derecho Estudio v0.5 — Banco de preguntas

## Objetivo
Incorporar el banco administrativo de preguntas antes de habilitar el motor de simuladores.

## Funciones nuevas
- CRUD de preguntas.
- Cuatro opciones A/B/C/D.
- Una respuesta correcta protegida en `question_answers`.
- Explicación general de la respuesta correcta.
- Feedback independiente para A, B, C y D.
- Clasificación por materia, unidad, tema, tipo y dificultad.
- Artículo jurídico opcional asociado a la pregunta.
- Estado activa/inactiva y verificada/pendiente.
- Importación masiva desde CSV, XLSX o XLS.
- Plantilla CSV incluida en `public/templates/preguntas_importacion.csv`.
- Indicador de preguntas activas y verificadas por unidad para el estudiante.

## Seguridad
El navegador del estudiante sigue sin tener permisos RLS para consultar `question_answers` ni `question_option_feedback`.

El administrador guarda preguntas completas mediante la función PostgreSQL:

`public.admin_save_question(...)`

La función valida permisos de administrador y guarda pregunta, opciones, clave y feedback dentro de una sola transacción.

## Importación Excel
La pantalla de importación carga SheetJS 0.20.3 únicamente cuando es necesaria desde el CDN oficial de SheetJS. No se agrega al bundle principal.

## Migración
Aplicar:

`20260812234000_question_bank_foundation.sql`

Comando:

`npx supabase db push`

## Pruebas mínimas
1. Crear una pregunta desde `/admin/preguntas`.
2. Confirmar que aparecen las cuatro alternativas y la correcta en Administración.
3. Editarla y volver a guardar.
4. Descargar la plantilla CSV.
5. Importar una fila de prueba.
6. Confirmar que el contador de la unidad cambia de `0/30` a `1/30` cuando la pregunta está activa y verificada.
7. Eliminar las preguntas de prueba si no se desean conservar.

## Próxima versión
v0.6 implementará el motor de simuladores de 30 preguntas por unidad, selección aleatoria segura, intentos y corrección del servidor.
