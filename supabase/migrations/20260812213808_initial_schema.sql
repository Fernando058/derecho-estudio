begin;

-- =========================================================
-- DERECHO ESTUDIO
-- Migración inicial
-- React + Vite + Supabase
-- =========================================================


-- =========================================================
-- 1. ESQUEMA PRIVADO PARA FUNCIONES INTERNAS
-- =========================================================

create schema if not exists private;

revoke all on schema private from public;

grant usage on schema private to anon, authenticated;


-- =========================================================
-- 2. PERFILES
-- =========================================================

create table public.profiles (
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    email text,
    full_name text,

    role text not null default 'student'
        check (role in (
            'student',
            'admin',
            'superadmin'
        )),

    avatar_url text,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 3. SEMESTRES
-- =========================================================

create table public.semesters (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    slug text not null unique,

    level_number integer not null
        check (level_number > 0),

    description text,

    is_published boolean not null default false,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 4. MATERIAS
-- =========================================================

create table public.subjects (
    id uuid primary key default gen_random_uuid(),

    semester_id uuid not null
        references public.semesters(id)
        on delete cascade,

    name text not null,
    slug text not null,

    code text,

    description text,

    credits integer
        check (credits is null or credits >= 0),

    is_published boolean not null default false,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (semester_id, slug)
);


-- =========================================================
-- 5. UNIDADES
-- =========================================================

create table public.units (
    id uuid primary key default gen_random_uuid(),

    subject_id uuid not null
        references public.subjects(id)
        on delete cascade,

    unit_number integer not null
        check (unit_number > 0),

    title text not null,

    slug text not null,

    summary text,

    learning_outcome text,

    is_published boolean not null default false,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (subject_id, unit_number),
    unique (subject_id, slug)
);


-- =========================================================
-- 6. TEMAS Y SUBTEMAS
--
-- Un subtema es simplemente otro topic cuyo parent_topic_id
-- apunta a su tema padre.
-- =========================================================

create table public.topics (
    id uuid primary key default gen_random_uuid(),

    unit_id uuid not null
        references public.units(id)
        on delete cascade,

    parent_topic_id uuid
        references public.topics(id)
        on delete cascade,

    title text not null,

    slug text not null,

    description text,

    is_published boolean not null default false,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (unit_id, slug)
);


-- =========================================================
-- 7. BLOQUES DE CONTENIDO
-- =========================================================

create table public.content_blocks (
    id uuid primary key default gen_random_uuid(),

    unit_id uuid not null
        references public.units(id)
        on delete cascade,

    topic_id uuid
        references public.topics(id)
        on delete cascade,

    content_type text not null
        check (content_type in (
            'introduction',
            'summary',
            'analysis',
            'key_concepts',
            'exam_tips',
            'example',
            'warning',
            'custom'
        )),

    title text,

    content text not null,

    is_published boolean not null default false,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 8. FUENTES LEGALES
-- =========================================================

create table public.legal_sources (
    id uuid primary key default gen_random_uuid(),

    title text not null,

    abbreviation text,

    source_type text not null
        check (source_type in (
            'constitution',
            'code',
            'law',
            'regulation',
            'treaty',
            'resolution',
            'jurisprudence',
            'other'
        )),

    jurisdiction text default 'Ecuador',

    official_url text,

    status text not null default 'active'
        check (status in (
            'active',
            'reformed',
            'repealed',
            'review'
        )),

    last_verified_at timestamptz,

    is_published boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 9. ARTÍCULOS LEGALES
-- =========================================================

create table public.legal_articles (
    id uuid primary key default gen_random_uuid(),

    legal_source_id uuid not null
        references public.legal_sources(id)
        on delete cascade,

    article_number text not null,

    heading text,

    article_text text,

    explanation text,

    official_url text,

    status text not null default 'active'
        check (status in (
            'active',
            'reformed',
            'repealed',
            'review'
        )),

    last_verified_at timestamptz,

    is_published boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (
        legal_source_id,
        article_number
    )
);


-- =========================================================
-- 10. RELACIÓN TEMAS - ARTÍCULOS
-- =========================================================

create table public.topic_legal_articles (
    topic_id uuid not null
        references public.topics(id)
        on delete cascade,

    legal_article_id uuid not null
        references public.legal_articles(id)
        on delete cascade,

    importance text default 'recommended'
        check (importance in (
            'essential',
            'recommended',
            'complementary'
        )),

    notes text,

    primary key (
        topic_id,
        legal_article_id
    )
);


-- =========================================================
-- 11. LECTURAS
-- =========================================================

create table public.readings (
    id uuid primary key default gen_random_uuid(),

    title text not null,

    author text,

    publication_year integer,

    reading_type text not null default 'other'
        check (reading_type in (
            'book',
            'article',
            'paper',
            'jurisprudence',
            'institutional',
            'website',
            'other'
        )),

    description text,

    url text,

    is_published boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 12. RELACIÓN TEMAS - LECTURAS
-- =========================================================

create table public.topic_readings (
    topic_id uuid not null
        references public.topics(id)
        on delete cascade,

    reading_id uuid not null
        references public.readings(id)
        on delete cascade,

    relevance text not null default 'recommended'
        check (relevance in (
            'essential',
            'recommended',
            'complementary'
        )),

    sort_order integer not null default 0,

    primary key (
        topic_id,
        reading_id
    )
);


-- =========================================================
-- 13. PROGRESO DE LECTURAS
-- =========================================================

create table public.student_readings (
    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    reading_id uuid not null
        references public.readings(id)
        on delete cascade,

    status text not null default 'pending'
        check (status in (
            'pending',
            'reading',
            'completed',
            'saved'
        )),

    started_at timestamptz,

    completed_at timestamptz,

    updated_at timestamptz not null default now(),

    primary key (
        user_id,
        reading_id
    )
);


-- =========================================================
-- 14. DOCUMENTOS Y COMPENDIOS
--
-- Aquí guardaremos únicamente enlaces.
-- Por ejemplo Google Drive.
-- =========================================================

create table public.documents (
    id uuid primary key default gen_random_uuid(),

    subject_id uuid
        references public.subjects(id)
        on delete cascade,

    unit_id uuid
        references public.units(id)
        on delete cascade,

    topic_id uuid
        references public.topics(id)
        on delete cascade,

    title text not null,

    description text,

    document_type text not null default 'compendium'
        check (document_type in (
            'compendium',
            'law',
            'reading',
            'guide',
            'jurisprudence',
            'other'
        )),

    provider text not null default 'google_drive'
        check (provider in (
            'google_drive',
            'external',
            'supabase_storage'
        )),

    source_url text not null,

    start_page integer,
    end_page integer,

    is_published boolean not null default true,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 15. ETIQUETAS PARA PREGUNTAS
-- =========================================================

create table public.tags (
    id uuid primary key default gen_random_uuid(),

    name text not null unique,

    description text,

    created_at timestamptz not null default now()
);


-- =========================================================
-- 16. PREGUNTAS
--
-- IMPORTANTE:
-- Esta tabla NO contiene cuál respuesta es correcta.
-- Esto evita exponer la clave directamente al navegador.
-- =========================================================

create table public.questions (
    id uuid primary key default gen_random_uuid(),

    unit_id uuid not null
        references public.units(id)
        on delete cascade,

    topic_id uuid
        references public.topics(id)
        on delete set null,

    legal_article_id uuid
        references public.legal_articles(id)
        on delete set null,

    question_text text not null,

    question_type text not null default 'multiple_choice'
        check (question_type in (
            'multiple_choice',
            'case_based',
            'normative',
            'conceptual',
            'jurisprudence'
        )),

    difficulty text not null default 'intermediate'
        check (difficulty in (
            'basic',
            'intermediate',
            'advanced'
        )),

    source_reference text,

    is_active boolean not null default true,

    is_verified boolean not null default false,

    created_by uuid
        references public.profiles(id)
        on delete set null,

    updated_by uuid
        references public.profiles(id)
        on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 17. OPCIONES DE RESPUESTA
--
-- Tampoco contiene is_correct.
-- =========================================================

create table public.question_options (
    id uuid primary key default gen_random_uuid(),

    question_id uuid not null
        references public.questions(id)
        on delete cascade,

    option_key text not null,

    option_text text not null,

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),

    unique (
        question_id,
        option_key
    )
);


-- =========================================================
-- 18. CLAVE DE RESPUESTA
--
-- Esta tabla quedará restringida a administradores
-- y funciones internas.
-- =========================================================

create table public.question_answers (
    question_id uuid primary key
        references public.questions(id)
        on delete cascade,

    correct_option_id uuid not null
        references public.question_options(id)
        on delete cascade,

    correct_explanation text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 19. FEEDBACK POR OPCIÓN
-- =========================================================

create table public.question_option_feedback (
    option_id uuid primary key
        references public.question_options(id)
        on delete cascade,

    explanation text not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 20. PREGUNTAS - ETIQUETAS
-- =========================================================

create table public.question_tags (
    question_id uuid not null
        references public.questions(id)
        on delete cascade,

    tag_id uuid not null
        references public.tags(id)
        on delete cascade,

    primary key (
        question_id,
        tag_id
    )
);


-- =========================================================
-- 21. CONFIGURACIÓN DE SIMULADORES
--
-- unit_30:
-- 30 preguntas exclusivamente de una unidad.
--
-- subject_100:
-- 100 preguntas de las cuatro unidades.
-- =========================================================

create table public.quiz_configs (
    id uuid primary key default gen_random_uuid(),

    subject_id uuid not null
        references public.subjects(id)
        on delete cascade,

    unit_id uuid
        references public.units(id)
        on delete cascade,

    quiz_type text not null
        check (quiz_type in (
            'unit_30',
            'subject_100'
        )),

    question_count integer not null,

    time_limit_minutes integer,

    randomize_questions boolean not null default true,

    randomize_options boolean not null default true,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    check (
        (
            quiz_type = 'unit_30'
            and unit_id is not null
            and question_count = 30
        )
        or
        (
            quiz_type = 'subject_100'
            and unit_id is null
            and question_count = 100
        )
    )
);


create unique index uq_quiz_config_unit_30
on public.quiz_configs(unit_id)
where quiz_type = 'unit_30';


create unique index uq_quiz_config_subject_100
on public.quiz_configs(subject_id)
where quiz_type = 'subject_100';


-- =========================================================
-- 22. DISTRIBUCIÓN DE LAS 100 PREGUNTAS
-- =========================================================

create table public.quiz_unit_distribution (
    quiz_config_id uuid not null
        references public.quiz_configs(id)
        on delete cascade,

    unit_id uuid not null
        references public.units(id)
        on delete cascade,

    question_count integer not null
        check (question_count > 0),

    primary key (
        quiz_config_id,
        unit_id
    )
);


-- =========================================================
-- 23. INTENTOS
-- =========================================================

create table public.quiz_attempts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    subject_id uuid not null
        references public.subjects(id)
        on delete cascade,

    unit_id uuid
        references public.units(id)
        on delete cascade,

    quiz_type text not null
        check (quiz_type in (
            'unit_30',
            'subject_100',
            'practice_errors'
        )),

    mode text not null default 'exam'
        check (mode in (
            'exam',
            'practice'
        )),

    status text not null default 'in_progress'
        check (status in (
            'in_progress',
            'completed',
            'abandoned'
        )),

    total_questions integer not null
        check (total_questions > 0),

    correct_answers integer not null default 0,

    incorrect_answers integer not null default 0,

    unanswered integer not null default 0,

    score numeric(5,2),

    duration_seconds integer,

    started_at timestamptz not null default now(),

    completed_at timestamptz,

    created_at timestamptz not null default now()
);


-- =========================================================
-- 24. PREGUNTAS ASIGNADAS A CADA INTENTO
-- =========================================================

create table public.quiz_attempt_questions (
    id uuid primary key default gen_random_uuid(),

    attempt_id uuid not null
        references public.quiz_attempts(id)
        on delete cascade,

    question_id uuid not null
        references public.questions(id)
        on delete cascade,

    position integer not null
        check (position > 0),

    created_at timestamptz not null default now(),

    unique (
        attempt_id,
        question_id
    ),

    unique (
        attempt_id,
        position
    )
);


-- =========================================================
-- 25. RESPUESTAS DEL ESTUDIANTE
-- =========================================================

create table public.quiz_answers (
    id uuid primary key default gen_random_uuid(),

    attempt_question_id uuid not null unique
        references public.quiz_attempt_questions(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    selected_option_id uuid
        references public.question_options(id)
        on delete set null,

    is_correct boolean,

    response_time_seconds integer,

    answered_at timestamptz not null default now()
);


-- =========================================================
-- 26. DOMINIO POR PREGUNTA
-- =========================================================

create table public.student_question_mastery (
    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    question_id uuid not null
        references public.questions(id)
        on delete cascade,

    times_seen integer not null default 0,

    times_correct integer not null default 0,

    times_incorrect integer not null default 0,

    consecutive_correct integer not null default 0,

    last_result boolean,

    mastery_score numeric(5,2)
        not null default 0
        check (
            mastery_score >= 0
            and mastery_score <= 100
        ),

    last_answered_at timestamptz,

    updated_at timestamptz not null default now(),

    primary key (
        user_id,
        question_id
    )
);


-- =========================================================
-- 27. PROGRESO POR TEMA
-- =========================================================

create table public.student_topic_progress (
    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    topic_id uuid not null
        references public.topics(id)
        on delete cascade,

    attempts_count integer not null default 0,

    questions_answered integer not null default 0,

    correct_answers integer not null default 0,

    accuracy numeric(5,2)
        not null default 0,

    mastery_score numeric(5,2)
        not null default 0,

    mastery_level text not null default 'not_started'
        check (mastery_level in (
            'not_started',
            'initial',
            'developing',
            'competent',
            'advanced',
            'mastered'
        )),

    updated_at timestamptz not null default now(),

    primary key (
        user_id,
        topic_id
    )
);


-- =========================================================
-- 28. PROGRESO POR UNIDAD
-- =========================================================

create table public.student_unit_progress (
    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    unit_id uuid not null
        references public.units(id)
        on delete cascade,

    attempts_count integer not null default 0,

    questions_answered integer not null default 0,

    correct_answers integer not null default 0,

    accuracy numeric(5,2)
        not null default 0,

    progress_percent numeric(5,2)
        not null default 0,

    updated_at timestamptz not null default now(),

    primary key (
        user_id,
        unit_id
    )
);


-- =========================================================
-- 29. PROGRESO POR MATERIA
-- =========================================================

create table public.student_subject_progress (
    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    subject_id uuid not null
        references public.subjects(id)
        on delete cascade,

    attempts_count integer not null default 0,

    questions_answered integer not null default 0,

    correct_answers integer not null default 0,

    accuracy numeric(5,2)
        not null default 0,

    progress_percent numeric(5,2)
        not null default 0,

    updated_at timestamptz not null default now(),

    primary key (
        user_id,
        subject_id
    )
);


-- =========================================================
-- 30. AUDITORÍA ADMINISTRATIVA
-- =========================================================

create table public.admin_activity (
    id bigint generated always as identity primary key,

    user_id uuid
        references auth.users(id)
        on delete set null,

    action text not null,

    entity_type text,

    entity_id uuid,

    details jsonb,

    created_at timestamptz not null default now()
);


-- =========================================================
-- 31. ÍNDICES
-- =========================================================

create index idx_subjects_semester
    on public.subjects(semester_id);

create index idx_units_subject
    on public.units(subject_id);

create index idx_topics_unit
    on public.topics(unit_id);

create index idx_topics_parent
    on public.topics(parent_topic_id);

create index idx_content_blocks_unit
    on public.content_blocks(unit_id);

create index idx_content_blocks_topic
    on public.content_blocks(topic_id);

create index idx_legal_articles_source
    on public.legal_articles(legal_source_id);

create index idx_documents_subject
    on public.documents(subject_id);

create index idx_documents_unit
    on public.documents(unit_id);

create index idx_documents_topic
    on public.documents(topic_id);

create index idx_questions_unit
    on public.questions(unit_id);

create index idx_questions_topic
    on public.questions(topic_id);

create index idx_questions_active_verified
    on public.questions(is_active, is_verified);

create index idx_question_options_question
    on public.question_options(question_id);

create index idx_quiz_attempts_user
    on public.quiz_attempts(user_id);

create index idx_quiz_attempts_subject
    on public.quiz_attempts(subject_id);

create index idx_quiz_attempts_unit
    on public.quiz_attempts(unit_id);

create index idx_attempt_questions_attempt
    on public.quiz_attempt_questions(attempt_id);

create index idx_quiz_answers_user
    on public.quiz_answers(user_id);

create index idx_mastery_user
    on public.student_question_mastery(user_id);


-- =========================================================
-- 32. FUNCIÓN UPDATED_AT
-- =========================================================

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- =========================================================
-- 33. FUNCIONES DE ROLES
-- =========================================================

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role in ('admin', 'superadmin')
          and p.is_active = true
    );
$$;


create or replace function private.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'superadmin'
          and p.is_active = true
    );
$$;


grant execute on function private.is_admin()
to anon, authenticated;

grant execute on function private.is_superadmin()
to authenticated;


-- =========================================================
-- 34. PROTECCIÓN DE ROLES
-- =========================================================

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    if old.role is distinct from new.role then

        -- SQL Editor, service role o procesos internos.
        if auth.uid() is null then
            return new;
        end if;

        -- Solo superadmin puede modificar roles.
        if not private.is_superadmin() then
            raise exception
                'No tienes permiso para modificar roles';
        end if;

    end if;

    return new;

end;
$$;


create trigger trg_protect_profile_role
before update on public.profiles
for each row
execute function private.protect_profile_role();


-- =========================================================
-- 35. CREACIÓN AUTOMÁTICA DEL PERFIL
-- =========================================================

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    insert into public.profiles (
        id,
        email,
        full_name
    )
    values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            ''
        )
    )
    on conflict (id)
    do update set
        email = excluded.email;

    return new;

end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();


-- =========================================================
-- 36. VALIDAR RESPUESTA CORRECTA
-- =========================================================

create or replace function private.validate_question_answer()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin

    if not exists (
        select 1
        from public.question_options qo
        where qo.id = new.correct_option_id
          and qo.question_id = new.question_id
    ) then
        raise exception
            'La opción correcta no pertenece a la pregunta';
    end if;

    return new;

end;
$$;


create trigger trg_validate_question_answer
before insert or update
on public.question_answers
for each row
execute function private.validate_question_answer();


-- =========================================================
-- 37. VALIDAR DISTRIBUCIÓN DEL EXAMEN GENERAL
-- =========================================================

create or replace function private.validate_quiz_distribution()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_subject_id uuid;
    v_quiz_type text;
begin

    select
        qc.subject_id,
        qc.quiz_type
    into
        v_subject_id,
        v_quiz_type
    from public.quiz_configs qc
    where qc.id = new.quiz_config_id;

    if v_quiz_type <> 'subject_100' then
        raise exception
            'Solo el simulador general admite distribución por unidad';
    end if;

    if not exists (
        select 1
        from public.units u
        where u.id = new.unit_id
          and u.subject_id = v_subject_id
    ) then
        raise exception
            'La unidad no pertenece a la materia del simulador';
    end if;

    return new;

end;
$$;


create trigger trg_validate_quiz_distribution
before insert or update
on public.quiz_unit_distribution
for each row
execute function private.validate_quiz_distribution();


-- =========================================================
-- 38. TRIGGERS UPDATED_AT
-- =========================================================

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

create trigger trg_semesters_updated_at
before update on public.semesters
for each row
execute function private.set_updated_at();

create trigger trg_subjects_updated_at
before update on public.subjects
for each row
execute function private.set_updated_at();

create trigger trg_units_updated_at
before update on public.units
for each row
execute function private.set_updated_at();

create trigger trg_topics_updated_at
before update on public.topics
for each row
execute function private.set_updated_at();

create trigger trg_content_blocks_updated_at
before update on public.content_blocks
for each row
execute function private.set_updated_at();

create trigger trg_legal_sources_updated_at
before update on public.legal_sources
for each row
execute function private.set_updated_at();

create trigger trg_legal_articles_updated_at
before update on public.legal_articles
for each row
execute function private.set_updated_at();

create trigger trg_readings_updated_at
before update on public.readings
for each row
execute function private.set_updated_at();

create trigger trg_documents_updated_at
before update on public.documents
for each row
execute function private.set_updated_at();

create trigger trg_questions_updated_at
before update on public.questions
for each row
execute function private.set_updated_at();

create trigger trg_question_answers_updated_at
before update on public.question_answers
for each row
execute function private.set_updated_at();

create trigger trg_question_feedback_updated_at
before update on public.question_option_feedback
for each row
execute function private.set_updated_at();

create trigger trg_quiz_configs_updated_at
before update on public.quiz_configs
for each row
execute function private.set_updated_at();


-- =========================================================
-- 39. HABILITAR RLS
-- =========================================================

alter table public.profiles enable row level security;

alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.topics enable row level security;

alter table public.content_blocks enable row level security;

alter table public.legal_sources enable row level security;
alter table public.legal_articles enable row level security;
alter table public.topic_legal_articles enable row level security;

alter table public.readings enable row level security;
alter table public.topic_readings enable row level security;
alter table public.student_readings enable row level security;

alter table public.documents enable row level security;

alter table public.tags enable row level security;

alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_answers enable row level security;
alter table public.question_option_feedback enable row level security;
alter table public.question_tags enable row level security;

alter table public.quiz_configs enable row level security;
alter table public.quiz_unit_distribution enable row level security;

alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_questions enable row level security;
alter table public.quiz_answers enable row level security;

alter table public.student_question_mastery enable row level security;
alter table public.student_topic_progress enable row level security;
alter table public.student_unit_progress enable row level security;
alter table public.student_subject_progress enable row level security;

alter table public.admin_activity enable row level security;


-- =========================================================
-- 40. RLS - PROFILES
-- =========================================================

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
    id = (select auth.uid())
    or private.is_admin()
);


create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (
    id = (select auth.uid())
    or private.is_admin()
)
with check (
    id = (select auth.uid())
    or private.is_admin()
);


-- =========================================================
-- 41. RLS - CONTENIDO ACADÉMICO PÚBLICO
-- =========================================================

create policy "semesters_public_read"
on public.semesters
for select
to anon, authenticated
using (is_published = true);


create policy "semesters_admin_manage"
on public.semesters
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "subjects_public_read"
on public.subjects
for select
to anon, authenticated
using (is_published = true);


create policy "subjects_admin_manage"
on public.subjects
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "units_public_read"
on public.units
for select
to anon, authenticated
using (is_published = true);


create policy "units_admin_manage"
on public.units
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "topics_public_read"
on public.topics
for select
to anon, authenticated
using (is_published = true);


create policy "topics_admin_manage"
on public.topics
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "content_blocks_public_read"
on public.content_blocks
for select
to anon, authenticated
using (is_published = true);


create policy "content_blocks_admin_manage"
on public.content_blocks
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 42. RLS - NORMATIVA
-- =========================================================

create policy "legal_sources_public_read"
on public.legal_sources
for select
to anon, authenticated
using (is_published = true);


create policy "legal_sources_admin_manage"
on public.legal_sources
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "legal_articles_public_read"
on public.legal_articles
for select
to anon, authenticated
using (is_published = true);


create policy "legal_articles_admin_manage"
on public.legal_articles
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "topic_legal_articles_public_read"
on public.topic_legal_articles
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.topics t
        where t.id = topic_id
          and t.is_published = true
    )
);


create policy "topic_legal_articles_admin_manage"
on public.topic_legal_articles
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 43. RLS - LECTURAS
-- =========================================================

create policy "readings_public_read"
on public.readings
for select
to anon, authenticated
using (is_published = true);


create policy "readings_admin_manage"
on public.readings
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "topic_readings_public_read"
on public.topic_readings
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.topics t
        where t.id = topic_id
          and t.is_published = true
    )
);


create policy "topic_readings_admin_manage"
on public.topic_readings
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "student_readings_select_own"
on public.student_readings
for select
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "student_readings_insert_own"
on public.student_readings
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "student_readings_update_own"
on public.student_readings
for update
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
)
with check (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "student_readings_delete_own"
on public.student_readings
for delete
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


-- =========================================================
-- 44. RLS - DOCUMENTOS
--
-- Solo usuarios registrados pueden acceder directamente
-- a los enlaces de compendios.
-- =========================================================

create policy "documents_authenticated_read"
on public.documents
for select
to authenticated
using (
    is_published = true
    or private.is_admin()
);


create policy "documents_admin_manage"
on public.documents
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 45. RLS - PREGUNTAS
--
-- Las preguntas sí pueden consultarse.
-- Las claves correctas NO.
-- =========================================================

create policy "questions_student_read"
on public.questions
for select
to authenticated
using (
    (
        is_active = true
        and is_verified = true
    )
    or private.is_admin()
);


create policy "questions_admin_manage"
on public.questions
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "question_options_student_read"
on public.question_options
for select
to authenticated
using (
    private.is_admin()
    or exists (
        select 1
        from public.questions q
        where q.id = question_id
          and q.is_active = true
          and q.is_verified = true
    )
);


create policy "question_options_admin_manage"
on public.question_options
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- CLAVES DE RESPUESTA:
-- Solo administradores.

create policy "question_answers_admin_only"
on public.question_answers
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "question_feedback_admin_only"
on public.question_option_feedback
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "tags_authenticated_read"
on public.tags
for select
to authenticated
using (true);


create policy "tags_admin_manage"
on public.tags
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "question_tags_authenticated_read"
on public.question_tags
for select
to authenticated
using (
    private.is_admin()
    or exists (
        select 1
        from public.questions q
        where q.id = question_id
          and q.is_active = true
          and q.is_verified = true
    )
);


create policy "question_tags_admin_manage"
on public.question_tags
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 46. RLS - CONFIGURACIÓN DE SIMULADORES
-- =========================================================

create policy "quiz_configs_authenticated_read"
on public.quiz_configs
for select
to authenticated
using (
    is_active = true
    or private.is_admin()
);


create policy "quiz_configs_admin_manage"
on public.quiz_configs
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "quiz_distribution_authenticated_read"
on public.quiz_unit_distribution
for select
to authenticated
using (true);


create policy "quiz_distribution_admin_manage"
on public.quiz_unit_distribution
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 47. RLS - INTENTOS
--
-- De momento el alumno SOLO puede leer sus datos.
--
-- La creación, corrección y finalización se realizará
-- posteriormente mediante funciones seguras RPC.
-- =========================================================

create policy "quiz_attempts_select_own"
on public.quiz_attempts
for select
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "quiz_attempts_admin_manage"
on public.quiz_attempts
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "attempt_questions_select_own"
on public.quiz_attempt_questions
for select
to authenticated
using (
    private.is_admin()
    or exists (
        select 1
        from public.quiz_attempts qa
        where qa.id = attempt_id
          and qa.user_id = (select auth.uid())
    )
);


create policy "attempt_questions_admin_manage"
on public.quiz_attempt_questions
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "quiz_answers_select_own"
on public.quiz_answers
for select
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "quiz_answers_admin_manage"
on public.quiz_answers
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 48. RLS - ANALÍTICA
-- =========================================================

create policy "mastery_select_own"
on public.student_question_mastery
for select
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "mastery_admin_manage"
on public.student_question_mastery
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "topic_progress_select_own"
on public.student_topic_progress
for select
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "topic_progress_admin_manage"
on public.student_topic_progress
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "unit_progress_select_own"
on public.student_unit_progress
for select
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "unit_progress_admin_manage"
on public.student_unit_progress
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


create policy "subject_progress_select_own"
on public.student_subject_progress
for select
to authenticated
using (
    user_id = (select auth.uid())
    or private.is_admin()
);


create policy "subject_progress_admin_manage"
on public.student_subject_progress
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 49. RLS - AUDITORÍA
-- =========================================================

create policy "admin_activity_admin_only"
on public.admin_activity
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());


-- =========================================================
-- 50. DATOS INICIALES
-- CUARTO SEMESTRE
-- =========================================================

insert into public.semesters (
    name,
    slug,
    level_number,
    description,
    is_published,
    sort_order
)
values (
    'Cuarto semestre',
    'cuarto-semestre',
    4,
    'Cuarto nivel de la carrera de Derecho',
    true,
    4
)
on conflict (slug)
do nothing;


-- =========================================================
-- 51. CINCO MATERIAS INICIALES
-- =========================================================

with fourth_semester as (
    select id
    from public.semesters
    where slug = 'cuarto-semestre'
)
insert into public.subjects (
    semester_id,
    name,
    slug,
    code,
    credits,
    is_published,
    sort_order
)
select
    fourth_semester.id,
    data.name,
    data.slug,
    data.code,
    data.credits,
    true,
    data.sort_order
from fourth_semester
cross join (
    values

    (
        'Derecho Internacional Privado',
        'derecho-internacional-privado',
        'DIP',
        2,
        1
    ),

    (
        'Derecho Procesal Constitucional I',
        'derecho-procesal-constitucional-i',
        'DPC1',
        3,
        2
    ),

    (
        'Derecho Laboral II',
        'derecho-laboral-ii',
        'LAB2',
        3,
        3
    ),

    (
        'Derecho Penal I',
        'derecho-penal-i',
        'PEN1',
        3,
        4
    ),

    (
        'Derecho Civil III',
        'derecho-civil-iii',
        'CIV3',
        3,
        5
    )

) as data(
    name,
    slug,
    code,
    credits,
    sort_order
)

on conflict (
    semester_id,
    slug
)
do nothing;


commit;