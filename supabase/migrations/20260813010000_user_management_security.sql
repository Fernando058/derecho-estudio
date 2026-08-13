begin;

-- =========================================================
-- v0.8 - SEGURIDAD Y ADMINISTRACIÓN DE USUARIOS
-- =========================================================

-- Endurece la protección de public.profiles.
-- Desde el navegador:
--   * estudiante: solo full_name y avatar_url propios;
--   * admin: puede gestionar nombre/estado de estudiantes;
--   * superadmin: además puede gestionar roles;
--   * email e id nunca se modifican desde el cliente.
create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor_role text;
    remaining_active_superadmins integer;
begin
    -- SQL Editor, service role o procesos internos sin auth.uid().
    if auth.uid() is null then
        return new;
    end if;

    select p.role
      into actor_role
      from public.profiles p
     where p.id = auth.uid()
       and p.is_active = true;

    if actor_role is null then
        raise exception 'La cuenta no está activa o no tiene perfil válido';
    end if;

    if new.id is distinct from old.id then
        raise exception 'El identificador del perfil no puede modificarse';
    end if;

    if new.email is distinct from old.email then
        raise exception 'El correo del perfil se sincroniza desde Supabase Auth y no puede modificarse aquí';
    end if;

    -- Usuario normal: únicamente nombre y avatar propios.
    if actor_role not in ('admin', 'superadmin') then
        if old.id <> auth.uid() then
            raise exception 'No tienes permiso para modificar este perfil';
        end if;

        if new.role is distinct from old.role
           or new.is_active is distinct from old.is_active
           or new.created_at is distinct from old.created_at then
            raise exception 'Solo puedes modificar tu nombre y avatar';
        end if;

        return new;
    end if;

    -- Cambios de rol: solo superadmin.
    if new.role is distinct from old.role
       and actor_role <> 'superadmin' then
        raise exception 'Solo un superadministrador puede modificar roles';
    end if;

    -- Un admin normal solo puede activar/desactivar estudiantes.
    if new.is_active is distinct from old.is_active
       and actor_role = 'admin'
       and old.role <> 'student' then
        raise exception 'Un administrador solo puede cambiar el estado de estudiantes';
    end if;

    -- Ningún usuario puede desactivarse a sí mismo desde la aplicación.
    if old.id = auth.uid()
       and new.is_active = false then
        raise exception 'No puedes desactivar tu propia cuenta';
    end if;

    -- Debe existir siempre al menos un superadmin activo.
    if old.role = 'superadmin'
       and (
            new.role <> 'superadmin'
            or new.is_active = false
       ) then

        select count(*)
          into remaining_active_superadmins
          from public.profiles p
         where p.role = 'superadmin'
           and p.is_active = true
           and p.id <> old.id;

        if remaining_active_superadmins = 0 then
            raise exception 'No se puede retirar o desactivar al último superadministrador activo';
        end if;
    end if;

    return new;
end;
$$;


-- =========================================================
-- LISTADO ADMINISTRATIVO CON MÉTRICAS BÁSICAS
-- =========================================================

create or replace function public.admin_list_users()
returns table (
    id uuid,
    email text,
    full_name text,
    role text,
    avatar_url text,
    is_active boolean,
    created_at timestamptz,
    updated_at timestamptz,
    completed_attempts bigint,
    average_score numeric,
    last_attempt_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        p.id,
        p.email,
        p.full_name,
        p.role,
        p.avatar_url,
        p.is_active,
        p.created_at,
        p.updated_at,
        count(a.id) filter (where a.status = 'completed') as completed_attempts,
        round(
            avg(a.score) filter (
                where a.status = 'completed'
                  and a.score is not null
            ),
            2
        ) as average_score,
        max(a.created_at) as last_attempt_at
    from public.profiles p
    left join public.quiz_attempts a
      on a.user_id = p.id
    where private.is_admin()
    group by
        p.id,
        p.email,
        p.full_name,
        p.role,
        p.avatar_url,
        p.is_active,
        p.created_at,
        p.updated_at
    order by p.created_at desc;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;


-- =========================================================
-- ACTUALIZACIÓN ADMINISTRATIVA SEGURA
-- =========================================================

create or replace function public.admin_update_user(
    p_user_id uuid,
    p_full_name text,
    p_role text,
    p_is_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
    updated_profile public.profiles;
begin
    if not private.is_admin() then
        raise exception 'No tienes permisos administrativos';
    end if;

    if p_role not in ('student', 'admin', 'superadmin') then
        raise exception 'Rol no válido';
    end if;

    update public.profiles
       set full_name = nullif(trim(coalesce(p_full_name, '')), ''),
           role = p_role,
           is_active = p_is_active
     where id = p_user_id
     returning * into updated_profile;

    if updated_profile.id is null then
        raise exception 'Usuario no encontrado';
    end if;

    insert into public.admin_activity (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    )
    values (
        auth.uid(),
        'update_user',
        'profile',
        p_user_id,
        jsonb_build_object(
            'role', updated_profile.role,
            'is_active', updated_profile.is_active,
            'full_name', updated_profile.full_name
        )
    );

    return updated_profile;
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, boolean) from public;
grant execute on function public.admin_update_user(uuid, text, text, boolean) to authenticated;

commit;
