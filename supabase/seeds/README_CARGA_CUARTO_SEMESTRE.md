# Contrato de carga integral — Cuarto semestre

Este directorio queda preparado para el SQL académico final que se generará
a partir de los cinco compendios suministrados por el usuario y del documento
`Banco_150_Preguntas_Derecho_Resueltas`.

## Dataset objetivo

Semestre:
- Cuarto semestre

Materias:
- DIP — Derecho Internacional Privado
- DPC1 — Derecho Procesal Constitucional I
- LAB2 — Derecho Laboral II
- PEN1 — Derecho Penal I
- CIV3 — Derecho Civil III

Estructura:
- 5 materias
- 4 unidades por materia
- 20 unidades totales

## Orden previsto de carga

1. semestre y materias
2. unidades
3. temas y subtemas
4. bloques de contenido académico
5. fuentes jurídicas y artículos sustentados
6. relaciones tema-artículo
7. lecturas sustentadas y relaciones
8. preguntas
9. opciones A/B/C/D
10. respuesta correcta protegida
11. feedback por opción
12. configuraciones de simuladores
13. distribución 100 preguntas por materia
14. registro en `academic_dataset_versions`

## Requisitos del SQL final

- Idempotente o seguro para reejecución controlada.
- No depender de UUID escritos manualmente cuando pueda resolver IDs por código/slug.
- Mantener las respuestas correctas separadas de `question_options`.
- No inventar normativa, artículos, lecturas ni contenido atribuido a los compendios.
- Diferenciar contenido fuente de contenido didáctico elaborado.
- Conservar relación materia → unidad → tema → pregunta.
- Permitir más de 30 preguntas por unidad.
- Configurar 30 preguntas por simulador de unidad.
- Configurar 100 preguntas por simulador final.
- Registrar versión y base documental del dataset al concluir.
