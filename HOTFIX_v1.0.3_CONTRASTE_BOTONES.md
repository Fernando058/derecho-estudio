# Derecho Estudio v1.0.3 — Corrección de contraste de botones

## Problema
En las cabeceras oscuras, los enlaces heredaban color blanco.
Los botones secundarios también son enlaces y tenían fondo blanco,
por lo que el texto quedaba blanco sobre blanco.

## Corrección
Se agregaron reglas específicas para:
- Inicio
- Dashboard
- Cabeceras de materia/unidad
- Resultados
- Acerca de

Los botones secundarios ahora usan:
- fondo blanco;
- texto azul oscuro;
- iconos dorados.

Los botones primarios conservan fondo dorado y texto oscuro.

## Base de datos
No hay migraciones ni cambios SQL.
No ejecutar `supabase db push`.
