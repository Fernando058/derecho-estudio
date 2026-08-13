# Derecho Estudio v0.9 — Consolidación y validación para v1.0

## Objetivo

Preparar la plataforma para recibir y auditar el dataset académico integral
del cuarto semestre antes del cierre v1.0.

## Nuevo módulo

`/#/admin/validacion`

Incluye:

- validación de 5 materias;
- validación de 20 unidades;
- conteo de temas y subtemas;
- conteo de contenido publicado;
- conteo de documentos;
- conteo de normativa y lecturas relacionadas;
- preguntas activas y verificadas por unidad;
- estado 30/30 de cada simulador de unidad;
- estado de los cinco simuladores finales;
- validación de distribución 100 preguntas;
- exportación JSON de la auditoría;
- listado automático de pendientes.

## Dataset versionado

Se crea `academic_dataset_versions` para registrar la futura carga integral:

- clave del dataset;
- versión;
- descripción;
- fuentes documentales;
- checksum;
- fecha de aplicación.

## Otras mejoras

- página 404 real;
- nuevo contrato técnico para el SQL final en `supabase/seeds/README_CARGA_CUARTO_SEMESTRE.md`;
- versión del frontend actualizada a 0.9.0.

## Migración

`20260813013000_release_readiness.sql`
