# Derecho Estudio v0.2.1 — Hotfix Temas

## Corrección
Se eliminó el embed autorreferencial `topics -> topics` de la consulta `listTopics()`,
que producía el mensaje:

`Could not find a relationship between 'topics' and 'topics' in the schema cache`

El nombre del tema padre ahora se resuelve en React a partir de `parent_topic_id`,
sin depender de una relación autorreferencial embebida en PostgREST.

## Base de datos
No requiere migración SQL.
No requiere `supabase db push`.

## Aplicación
Descomprimir este ZIP sobre la carpeta actual del proyecto con `-Force`,
luego ejecutar:

- `npm install`
- `npm run build`
- `npm run dev`

Después comprobar `/#/admin/temas`.
