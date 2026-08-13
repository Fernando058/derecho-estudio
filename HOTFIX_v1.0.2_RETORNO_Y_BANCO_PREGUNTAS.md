# Derecho Estudio v1.0.2 — Retorno al Dashboard + banco base de preguntas

## Frontend
- Botón flotante universal “Dashboard” en todas las rutas protegidas.
- El botón se oculta automáticamente en `/dashboard`.
- En móvil queda como icono compacto.
- Las pantallas de unidades ahora muestran “N disponibles · 30 por intento”.
- Se mantiene el botón “Repetir simulador” en resultados.
- Se conservan página Acerca de, fotos y nueva identidad azul/gris/dorada.

## Banco de preguntas
Se incluye:

`supabase/seeds/preguntas/SQL_GENERAR_BANCO_BASE_30_POR_UNIDAD.sql`

El script:
- genera 30 preguntas verificadas por cada unidad publicada de los semestres 3, 4 y 5;
- usa la estructura temática, resultados de aprendizaje y referencias documentales ya cargadas desde los compendios;
- conserva las 150 preguntas originales de cuarto semestre;
- no genera contenido para unidades sin compendio/material;
- permite repetir indefinidamente los simuladores;
- deja listos los finales de 100 preguntas únicamente en materias con las 4 unidades sustentadas y publicadas.

## Importante
No se inventan unidades faltantes de tercero o quinto semestre.
Una materia incompleta no puede tener un examen final académico de 4 unidades sin la fuente faltante.

## Base de datos
No hay nueva migración de esquema.
El SQL de preguntas se ejecuta desde Supabase SQL Editor como carga de datos.
