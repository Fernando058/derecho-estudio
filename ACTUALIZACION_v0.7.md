# Derecho Estudio v0.7 — Analítica y refuerzo personalizado

## Incluye

- Dashboard de progreso del estudiante.
- Precisión y dominio por materia y por unidad.
- Fortalezas y temas a reforzar.
- Evolución de calificaciones mediante gráficos.
- Banco personal de errores pendientes de refuerzo.
- Prácticas de errores de 1 a 20 preguntas disponibles por materia (el límite solicitado se mantiene entre 5 y 30; si existen menos preguntas pendientes, se usan las disponibles).
- Las preguntas permanecen en refuerzo hasta alcanzar dominio >= 90 con respuestas correctas repetidas.
- Configuración administrativa de simuladores: tiempo, aleatorización, disponibilidad y distribución 100 preguntas.
- Analítica administrativa: estudiantes, intentos, promedio, preguntas listas, temas débiles y preguntas difíciles.
- Corrección de las 4 advertencias de lint detectadas en v0.6.

## Migración

`supabase/migrations/20260813003000_analytics_error_practice.sql`

## Instalación

1. Descomprimir sobre el proyecto actual.
2. `npm install`
3. `npx supabase migration list`
4. `npx supabase db push`
5. `npx supabase migration list`
6. `npm run build`
7. `npm run lint`
8. `npm run dev`

## Nuevas rutas

- `/#/progreso`
- `/#/practicar-errores`
- `/#/admin/simuladores`
- `/#/admin/analitica`

## Seguridad

La práctica de errores se crea mediante RPC `start_error_practice`. La selección de preguntas se realiza en PostgreSQL y las claves continúan protegidas en el snapshot privado del intento.
