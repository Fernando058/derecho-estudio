# Derecho Estudio v0.6 — Motor de simuladores

## Objetivo
Habilitar intentos reales para los simuladores de 30 preguntas por unidad y 100 preguntas por materia, manteniendo las claves de respuesta protegidas en PostgreSQL.

## Funciones nuevas
- Inicio seguro de intentos mediante RPC.
- Selección aleatoria en servidor.
- 30 preguntas exclusivamente de la unidad seleccionada.
- 100 preguntas finales según `quiz_unit_distribution`.
- Modo examen: la corrección se revela solo al finalizar.
- Modo práctica: feedback inmediato después de guardar cada respuesta.
- Temporizador según `quiz_configs.time_limit_minutes`.
- Navegación entre preguntas y contador de respuestas.
- Finalización manual o automática cuando termina el tiempo en el cliente.
- Historial de intentos.
- Revisión completa pregunta por pregunta.
- Snapshot privado del enunciado, opciones, feedback y clave utilizado en cada intento, para conservar la revisión aunque el banco se edite posteriormente.
- Explicación general y feedback de cada distractor.
- Base legal asociada a la pregunta cuando existe.
- Fortalezas y temas a reforzar por intento.
- Actualización de dominio por pregunta, tema, unidad y materia.

## Seguridad
La política de lectura directa del estudiante sobre `quiz_answers` se elimina.

El estudiante interactúa con la evaluación mediante RPC `security definer` que validan `auth.uid()` y la propiedad del intento:

- `start_quiz_attempt`
- `get_quiz_attempt`
- `submit_quiz_answer`
- `finish_quiz_attempt`
- `abandon_quiz_attempt`
- `get_quiz_attempt_review`

`question_answers`, `question_option_feedback`, `quiz_answers` y `quiz_attempt_question_snapshots` permanecen sin acceso directo para estudiantes.

Las preguntas utilizadas en intentos dejan de eliminarse físicamente por cascada; deben desactivarse para preservar el historial académico.

## Regla de dominio
Una respuesta correcta aislada no marca una pregunta como dominada. El dominio empieza en 25 puntos por una respuesta correcta y aumenta con respuestas correctas posteriores. Un error reduce el dominio y reinicia la racha de respuestas correctas.

## Requisitos para habilitar simuladores
- Unidad: al menos 30 preguntas activas y verificadas con clave y cuatro opciones válidas.
- Materia: cada unidad debe disponer de la cantidad exigida por `quiz_unit_distribution` (inicialmente 25 por unidad).

## Migración
Aplicar:

`20260813000000_quiz_engine.sql`

Comando:

`npx supabase db push`

## Rutas nuevas
- `/simuladores/intentos/:attemptId`
- `/simuladores/intentos/:attemptId/resultados`
- `/intentos`

## Prueba mínima
1. Tener 30 preguntas activas y verificadas en una unidad.
2. Abrir la unidad y confirmar que aparecen los botones Modo examen y Modo práctica.
3. Iniciar Modo práctica y responder al menos dos preguntas.
4. Confirmar feedback inmediato.
5. Finalizar y revisar resultados.
6. Iniciar Modo examen y confirmar que no se muestra corrección antes de finalizar.
7. Revisar `/intentos`.

## Próxima versión
v0.7 incorporará dashboard analítico, práctica de errores y configuración administrativa avanzada de simuladores.
