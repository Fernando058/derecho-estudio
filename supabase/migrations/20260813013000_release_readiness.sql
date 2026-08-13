begin;

-- =========================================================
-- DERECHO ESTUDIO v0.9
-- Consolidación, auditoría de preparación y trazabilidad
-- del dataset académico.
-- =========================================================


-- =========================================================
-- 1. VERSIONES DE DATASET ACADÉMICO
-- =========================================================
-- Permitirá registrar la carga integral del cuarto semestre
-- que se realizará antes de v1.0.
-- =========================================================

create table if not exists public.academic_dataset_versions (
    id uuid primary key default gen_random_uuid(),

    dataset_key text not null unique,
    version_label text not null,

    description text,
    source_basis text,
    checksum text,

    applied_at timestamptz not null default now(),
    applied_by uuid
        references public.profiles(id)
        on delete set null,

    created_at timestamptz not null default now()
);

alter table public.academic_dataset_versions
enable row level security;

drop policy if exists "Admins can read academic dataset versions"
on public.academic_dataset_versions;

create policy "Admins can read academic dataset versions"
on public.academic_dataset_versions
for select
to authenticated
using (private.is_admin());

drop policy if exists "Superadmins can manage academic dataset versions"
on public.academic_dataset_versions;

create policy "Superadmins can manage academic dataset versions"
on public.academic_dataset_versions
for all
to authenticated
using (private.is_superadmin())
with check (private.is_superadmin());


-- =========================================================
-- 2. AUDITORÍA POR UNIDAD
-- =========================================================

create or replace function public.admin_unit_readiness(
    p_level_number integer default 4
)
returns table (
    semester_id uuid,
    semester_name text,

    subject_id uuid,
    subject_code text,
    subject_name text,

    unit_id uuid,
    unit_number integer,
    unit_title text,

    topic_count bigint,
    content_count bigint,
    document_count bigint,
    legal_article_count bigint,
    reading_count bigint,

    active_verified_questions bigint,

    unit_quiz_active boolean,
    unit_ready boolean
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        sem.id as semester_id,
        sem.name as semester_name,

        s.id as subject_id,
        s.code as subject_code,
        s.name as subject_name,

        u.id as unit_id,
        u.unit_number,
        u.title as unit_title,

        (
            select count(*)
            from public.topics t
            where t.unit_id = u.id
        ) as topic_count,

        (
            select count(*)
            from public.content_blocks cb
            where cb.unit_id = u.id
              and cb.is_published = true
        ) as content_count,

        (
            select count(*)
            from public.documents d
            where d.unit_id = u.id
              and d.is_published = true
        ) as document_count,

        (
            select count(distinct tla.legal_article_id)
            from public.topics t
            join public.topic_legal_articles tla
              on tla.topic_id = t.id
            where t.unit_id = u.id
        ) as legal_article_count,

        (
            select count(distinct tr.reading_id)
            from public.topics t
            join public.topic_readings tr
              on tr.topic_id = t.id
            where t.unit_id = u.id
        ) as reading_count,

        (
            select count(*)
            from public.questions q
            where q.unit_id = u.id
              and q.is_active = true
              and q.is_verified = true
        ) as active_verified_questions,

        exists (
            select 1
            from public.quiz_configs qc
            where qc.unit_id = u.id
              and qc.quiz_type = 'unit_30'
              and qc.is_active = true
        ) as unit_quiz_active,

        (
            (
                select count(*)
                from public.questions q
                where q.unit_id = u.id
                  and q.is_active = true
                  and q.is_verified = true
            ) >= 30
            and exists (
                select 1
                from public.quiz_configs qc
                where qc.unit_id = u.id
                  and qc.quiz_type = 'unit_30'
                  and qc.is_active = true
            )
        ) as unit_ready

    from public.units u
    join public.subjects s
      on s.id = u.subject_id
    join public.semesters sem
      on sem.id = s.semester_id

    where private.is_admin()
      and sem.level_number = p_level_number

    order by
        s.sort_order,
        s.name,
        u.unit_number;
$$;

revoke all
on function public.admin_unit_readiness(integer)
from public;

grant execute
on function public.admin_unit_readiness(integer)
to authenticated;


-- =========================================================
-- 3. AUDITORÍA POR MATERIA
-- =========================================================

create or replace function public.admin_subject_readiness(
    p_level_number integer default 4
)
returns table (
    semester_id uuid,
    semester_name text,

    subject_id uuid,
    subject_code text,
    subject_name text,
    credits integer,

    unit_count bigint,
    ready_unit_count bigint,

    topic_count bigint,
    content_count bigint,
    document_count bigint,
    active_verified_questions bigint,

    final_quiz_active boolean,
    final_distribution_total bigint,
    final_distribution_units bigint,
    subject_ready boolean
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        sem.id as semester_id,
        sem.name as semester_name,

        s.id as subject_id,
        s.code as subject_code,
        s.name as subject_name,
        s.credits,

        (
            select count(*)
            from public.units u
            where u.subject_id = s.id
        ) as unit_count,

        (
            select count(*)
            from public.units u
            where u.subject_id = s.id
              and (
                    select count(*)
                    from public.questions q
                    where q.unit_id = u.id
                      and q.is_active = true
                      and q.is_verified = true
                  ) >= 30
              and exists (
                    select 1
                    from public.quiz_configs qc
                    where qc.unit_id = u.id
                      and qc.quiz_type = 'unit_30'
                      and qc.is_active = true
                  )
        ) as ready_unit_count,

        (
            select count(*)
            from public.topics t
            join public.units u
              on u.id = t.unit_id
            where u.subject_id = s.id
        ) as topic_count,

        (
            select count(*)
            from public.content_blocks cb
            join public.units u
              on u.id = cb.unit_id
            where u.subject_id = s.id
              and cb.is_published = true
        ) as content_count,

        (
            select count(*)
            from public.documents d
            where d.subject_id = s.id
              and d.is_published = true
        ) as document_count,

        (
            select count(*)
            from public.questions q
            join public.units u
              on u.id = q.unit_id
            where u.subject_id = s.id
              and q.is_active = true
              and q.is_verified = true
        ) as active_verified_questions,

        exists (
            select 1
            from public.quiz_configs qc
            where qc.subject_id = s.id
              and qc.quiz_type = 'subject_100'
              and qc.is_active = true
        ) as final_quiz_active,

        coalesce(
            (
                select sum(qud.question_count)
                from public.quiz_configs qc
                join public.quiz_unit_distribution qud
                  on qud.quiz_config_id = qc.id
                where qc.subject_id = s.id
                  and qc.quiz_type = 'subject_100'
                  and qc.is_active = true
            ),
            0
        )::bigint as final_distribution_total,

        (
            select count(*)
            from public.quiz_configs qc
            join public.quiz_unit_distribution qud
              on qud.quiz_config_id = qc.id
            where qc.subject_id = s.id
              and qc.quiz_type = 'subject_100'
              and qc.is_active = true
        ) as final_distribution_units,

        (
            (
                select count(*)
                from public.units u
                where u.subject_id = s.id
            ) = 4

            and (
                select count(*)
                from public.units u
                where u.subject_id = s.id
                  and (
                        select count(*)
                        from public.questions q
                        where q.unit_id = u.id
                          and q.is_active = true
                          and q.is_verified = true
                      ) >= 30
                  and exists (
                        select 1
                        from public.quiz_configs qc
                        where qc.unit_id = u.id
                          and qc.quiz_type = 'unit_30'
                          and qc.is_active = true
                      )
            ) = 4

            and exists (
                select 1
                from public.quiz_configs qc
                where qc.subject_id = s.id
                  and qc.quiz_type = 'subject_100'
                  and qc.is_active = true
            )

            and coalesce(
                (
                    select sum(qud.question_count)
                    from public.quiz_configs qc
                    join public.quiz_unit_distribution qud
                      on qud.quiz_config_id = qc.id
                    where qc.subject_id = s.id
                      and qc.quiz_type = 'subject_100'
                      and qc.is_active = true
                ),
                0
            ) = 100

            and (
                select count(*)
                from public.quiz_configs qc
                join public.quiz_unit_distribution qud
                  on qud.quiz_config_id = qc.id
                where qc.subject_id = s.id
                  and qc.quiz_type = 'subject_100'
                  and qc.is_active = true
            ) = 4

            and not exists (
                select 1
                from public.quiz_configs qc
                join public.quiz_unit_distribution qud
                  on qud.quiz_config_id = qc.id
                where qc.subject_id = s.id
                  and qc.quiz_type = 'subject_100'
                  and qc.is_active = true
                  and (
                        select count(*)
                        from public.questions q
                        where q.unit_id = qud.unit_id
                          and q.is_active = true
                          and q.is_verified = true
                      ) < qud.question_count
            )
        ) as subject_ready

    from public.subjects s
    join public.semesters sem
      on sem.id = s.semester_id

    where private.is_admin()
      and sem.level_number = p_level_number

    order by
        s.sort_order,
        s.name;
$$;

revoke all
on function public.admin_subject_readiness(integer)
from public;

grant execute
on function public.admin_subject_readiness(integer)
to authenticated;


-- =========================================================
-- 4. RESUMEN GLOBAL DE PREPARACIÓN
-- =========================================================

create or replace function public.admin_release_summary(
    p_level_number integer default 4
)
returns table (
    semester_count bigint,
    subject_count bigint,
    unit_count bigint,
    ready_unit_count bigint,

    topic_count bigint,
    content_count bigint,
    document_count bigint,

    legal_source_count bigint,
    legal_article_count bigint,
    reading_count bigint,

    active_verified_question_count bigint,

    final_quiz_count bigint,
    ready_subject_count bigint,

    dataset_version_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        (
            select count(*)
            from public.semesters sem
            where sem.level_number = p_level_number
        ) as semester_count,

        (
            select count(*)
            from public.subjects s
            join public.semesters sem
              on sem.id = s.semester_id
            where sem.level_number = p_level_number
        ) as subject_count,

        (
            select count(*)
            from public.units u
            join public.subjects s
              on s.id = u.subject_id
            join public.semesters sem
              on sem.id = s.semester_id
            where sem.level_number = p_level_number
        ) as unit_count,

        (
            select count(*)
            from public.admin_unit_readiness(p_level_number) r
            where r.unit_ready = true
        ) as ready_unit_count,

        (
            select count(*)
            from public.topics t
            join public.units u
              on u.id = t.unit_id
            join public.subjects s
              on s.id = u.subject_id
            join public.semesters sem
              on sem.id = s.semester_id
            where sem.level_number = p_level_number
        ) as topic_count,

        (
            select count(*)
            from public.content_blocks cb
            join public.units u
              on u.id = cb.unit_id
            join public.subjects s
              on s.id = u.subject_id
            join public.semesters sem
              on sem.id = s.semester_id
            where sem.level_number = p_level_number
              and cb.is_published = true
        ) as content_count,

        (
            select count(*)
            from public.documents d
            join public.subjects s
              on s.id = d.subject_id
            join public.semesters sem
              on sem.id = s.semester_id
            where sem.level_number = p_level_number
              and d.is_published = true
        ) as document_count,

        (
            select count(*)
            from public.legal_sources
        ) as legal_source_count,

        (
            select count(*)
            from public.legal_articles
        ) as legal_article_count,

        (
            select count(*)
            from public.readings
        ) as reading_count,

        (
            select count(*)
            from public.questions q
            join public.units u
              on u.id = q.unit_id
            join public.subjects s
              on s.id = u.subject_id
            join public.semesters sem
              on sem.id = s.semester_id
            where sem.level_number = p_level_number
              and q.is_active = true
              and q.is_verified = true
        ) as active_verified_question_count,

        (
            select count(*)
            from public.quiz_configs qc
            join public.subjects s
              on s.id = qc.subject_id
            join public.semesters sem
              on sem.id = s.semester_id
            where sem.level_number = p_level_number
              and qc.quiz_type = 'subject_100'
              and qc.is_active = true
        ) as final_quiz_count,

        (
            select count(*)
            from public.admin_subject_readiness(p_level_number) r
            where r.subject_ready = true
        ) as ready_subject_count,

        (
            select count(*)
            from public.academic_dataset_versions
        ) as dataset_version_count

    where private.is_admin();
$$;

revoke all
on function public.admin_release_summary(integer)
from public;

grant execute
on function public.admin_release_summary(integer)
to authenticated;

commit;
