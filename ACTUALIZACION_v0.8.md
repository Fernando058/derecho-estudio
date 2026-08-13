# Derecho Estudio v0.8 — Usuarios, perfil y recuperación de contraseña

## Funciones nuevas

- Página `/perfil` para nombre, avatar y cambio de contraseña.
- Recuperación de contraseña por correo.
- Página segura para establecer la nueva contraseña.
- Pantalla `/admin/usuarios` con búsqueda, filtros, roles y activación/desactivación.
- Métricas básicas de intentos por usuario.
- Bloqueo de las rutas privadas para perfiles desactivados.
- Protección reforzada de `public.profiles`.
- Un administrador normal puede gestionar estudiantes.
- Solo un superadmin puede modificar roles.
- No se puede desactivar la propia cuenta desde la aplicación.
- No se puede eliminar funcionalmente al último superadmin activo.
- El correo del perfil queda protegido contra cambios directos desde el navegador.

## Seguridad

No se utiliza `service_role` ni una secret key en React.

La administración de perfiles se realiza mediante RLS, triggers y funciones PostgreSQL
que verifican el rol de la sesión autenticada.

Las operaciones de Supabase Auth que requieren privilegios de servidor
(listUsers de Auth, createUser de Auth, ban/delete del usuario de Auth)
no se ejecutan desde el navegador.

## Migración

`20260813010000_user_management_security.sql`

## Comprobación

1. `npx supabase db push`
2. `npm run build`
3. `npm run lint`
4. Probar `/perfil`
5. Probar recuperación de contraseña
6. Probar `/admin/usuarios`
7. Desactivar una cuenta de prueba y comprobar `/cuenta-inactiva`

## Nota para v1.0

La carga académica completa del cuarto semestre se realizará mediante un SQL integral
basado en los cinco compendios y el banco de 150 preguntas suministrado por el usuario.
