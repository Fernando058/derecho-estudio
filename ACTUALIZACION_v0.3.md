# Derecho Estudio v0.3 — Documentos y compendios

## Incluye

- CRUD administrativo de documentos.
- Asociación opcional con materia, unidad y tema.
- Google Drive como proveedor principal.
- Vista previa PDF dentro del panel administrativo.
- Biblioteca de documentos para estudiantes autenticados.
- Visor individual integrado.
- Filtros por materia y unidad.
- Páginas inicial/final recomendadas.
- Migración SQL de integridad jerárquica y validación de rangos de páginas.

## Regla de actualización

Los PDF no se almacenan en GitHub. El administrador cambia únicamente `source_url` desde el panel.

## Aplicación

1. Descomprimir el ZIP sobre la carpeta actual del proyecto con `-Force`.
2. Ejecutar `npm install`.
3. Ejecutar `npx supabase migration list`.
4. Ejecutar `npx supabase db push` y confirmar la migración `20260812223000_documents_integrity.sql`.
5. Ejecutar `npm run build`.
6. Ejecutar `npm run dev`.
7. Probar `/#/admin/documentos`.
8. Registrar un PDF de Google Drive compartido mediante enlace.
9. Probar la biblioteca `/#/documentos` y el visor individual.

## Git

Después de validar:

- `git add .`
- `git commit -m "feat: implementar documentos y visor administrable v0.3"`
- `git push`
