# Derecho Estudio v0.9.1 — Carga y pruebas de semestres 3, 4 y 5

## 1. Antes de cargar

La base debe tener aplicadas las migraciones hasta:

`20260813013000_release_readiness.sql`

Haga un backup de Supabase antes de una carga académica importante.

## 2. SQL principal

Ejecutar en Supabase SQL Editor:

`supabase/seeds/integral_semestres_3_4_5/SQL_CARGA_INTEGRAL_SEMESTRES_3_4_5.sql`

Características:
- carga 3 semestres;
- carga 15 materias;
- mantiene 4 slots de unidad por materia (60 unidades);
- las unidades faltantes quedan no publicadas y con advertencia;
- carga temas y síntesis basadas en los compendios disponibles;
- carga el banco exacto de 150 preguntas de cuarto semestre;
- no inventa una cuarta opción cuando el banco original solo contiene A/B/C;
- no inserta PDFs en `documents`, porque la tabla requiere URLs accesibles;
- registra checksum y versión del dataset.

## 3. Verificación

Ejecutar:

`SQL_VERIFICACION_POST_CARGA.sql`

Esperado para el banco original:
- total: 150;
- verificadas con 4 opciones: 141;
- pendientes por tener 3 opciones en la fuente: 9.

## 4. Navegación

En el Dashboard el selector permite cambiar entre:
- Tercer semestre;
- Cuarto semestre;
- Quinto semestre.

En Administración → Validación v1.0 también se puede seleccionar el semestre.

## 5. Prueba técnica del motor de simuladores

El banco fuente de 150 preguntas no alcanza para habilitar 30 preguntas por cada una de las 20 unidades.

Para comprobar técnicamente el motor sin inventar contenido académico, ejecutar:

`SQL_PRUEBA_TECNICA_SIMULADORES.sql`

Este script crea temporalmente 30 preguntas técnicas en cada unidad de PEN1.

Después:
1. iniciar sesión como estudiante;
2. abrir Cuarto semestre → Derecho Penal I;
3. probar una unidad en modo práctica;
4. comprobar feedback inmediato;
5. finalizar y revisar resultado;
6. probar otra unidad en modo examen;
7. comprobar que no revela la correcta antes de finalizar;
8. probar el simulador final de 100 preguntas;
9. comprobar `/intentos`, `/progreso` y `/practicar-errores`.

## 6. Limpieza obligatoria

Al terminar las pruebas ejecutar:

`SQL_LIMPIAR_PRUEBA_TECNICA.sql`

Debe devolver 0 preguntas técnicas restantes.

Las preguntas temporales se identifican exclusivamente por:
`TECH_TEST:PEN1:%`

## 7. Importante

Los semestres tercero y quinto contienen material incompleto.
El sistema muestra únicamente lo que está sustentado en los archivos entregados.
No debe interpretarse una unidad no publicada como material académico faltante que haya sido reconstruido automáticamente.
