# Lex Academia v1.0.7 — Hotfix administrativo

## Problemas corregidos

### Banco de preguntas — `Bad Request`
El banco ya contiene una cantidad grande de preguntas. La versión anterior
intentaba enviar todos los UUID en una sola cláusula `.in(...)`, produciendo
una URL demasiado grande para PostgREST/proxy y terminando en `400 Bad Request`.

Corrección:
- preguntas paginadas en bloques de 500;
- opciones, respuestas y feedback consultados en lotes pequeños;
- relaciones FK expresadas de forma explícita;
- soporte para bancos con miles de reactivos.

### Configuración de simuladores
PostgREST detectaba más de una relación entre `quiz_configs` y `units`:

1. relación directa `quiz_configs.unit_id`;
2. relación mediante `quiz_unit_distribution`.

Corrección:
- uso explícito de:
  - `quiz_configs_subject_id_fkey`
  - `quiz_configs_unit_id_fkey`
  - `quiz_unit_distribution_quiz_config_id_fkey`
  - `quiz_unit_distribution_unit_id_fkey`

Esto elimina el error:
`Could not embed because more than one relationship was found for 'quiz_configs' and 'units'`.

### Barra administrativa
El menú lateral ya no bloquea el acceso al Dashboard:
- acceso “Volver al Dashboard” inmediatamente debajo de la marca;
- menú administrativo con scroll propio;
- cabecera y pie permanecen visibles;
- enlace adicional al Dashboard en el pie;
- scrollbar con identidad dorada.

## Base de datos
No hay migración nueva.
No ejecutar `supabase db push`.
