# Lex Academia v1.0.10 — Registro directo sin confirmación por correo

## Objetivo

Simplificar el registro público para que el estudiante solo ingrese:

- Nombres completos
- Correo electrónico
- Contraseña

Se elimina del formulario el campo "Confirmar contraseña".

## Flujo esperado

1. El estudiante escribe nombre, correo y contraseña.
2. `supabase.auth.signUp()` crea el usuario en Supabase Auth.
3. El trigger existente `on_auth_user_created` ejecuta
   `private.handle_new_user()`.
4. El perfil se crea automáticamente en `public.profiles` con:
   - id
   - email
   - full_name
   - role = student (valor por defecto)
   - is_active = true
5. Supabase devuelve la sesión.
6. Lex Academia entra directamente al Dashboard.

## Configuración OBLIGATORIA en Supabase

El cambio de frontend NO puede desactivar por sí solo el envío de
confirmaciones. En el proyecto alojado debe desactivarse:

Authentication → Providers → Email → Confirm email

Con "Confirm email" desactivado, el registro mediante email y contraseña
no necesita enviar un correo de confirmación y Supabase devuelve la sesión
después del registro.

## Seguridad

- La contraseña NO se guarda en `public.profiles`.
- La contraseña continúa siendo gestionada exclusivamente por Supabase Auth.
- No se utiliza `service_role` en el navegador.
- No se habilita INSERT anónimo directo en `public.profiles`.
- Las políticas RLS existentes permanecen sin cambios.

## Importante

La recuperación de contraseña continúa utilizando correo electrónico.
Para una recuperación de contraseña con alta demanda, se recomienda
posteriormente configurar SMTP propio.

## Base de datos

No existe una migración nueva.
No ejecutar `supabase db push` para esta versión.
