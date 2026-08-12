begin;

-- =========================================================
-- DERECHO ESTUDIO v0.6
-- Motor seguro de simuladores, intentos, corrección y dominio
-- =========================================================

alter table public.quiz_attempts
  add column if not exists quiz_config_id uuid
    references public.quiz_configs(id)
    on delete set null;

create index if not exists idx_quiz_attempts_config
  on public.quiz_attempts(quiz_config_id);

alter table public.quiz_attempt_questions
  add column if not exists option_order text[];

-- Preservamos la integridad histórica de los intentos. Una pregunta usada en
-- un intento ya no puede eliminarse físicamente: debe desactivarse.
alter table public.quiz_attempt_questions
  drop constraint if exists quiz_attempt_questions_question_id_fkey;

alter table public.quiz_attempt_questions
  add constraint quiz_attempt_questions_question_id_fkey
  foreign key (question_id)
  references public.questions(id)
  on delete restrict;

-- La opción seleccionada se conserva como identificador histórico aunque el
-- administrador edite posteriormente las opciones de la pregunta.
alter table public.quiz_answers
  drop constraint if exists quiz_answers_selected_option_id_fkey;

alter table public.quiz_answers
  add column if not exists selected_option_key text,
  add column if not exists selected_option_text text;

-- Snapshot privado e inmutable del enunciado, opciones, feedback y clave
-- utilizados al iniciar cada intento. Los estudiantes nunca consultan esta
-- tabla directamente.
create table if not exists public.quiz_attempt_question_snapshots (
  attempt_question_id uuid primary key
    references public.quiz_attempt_questions(id)
    on delete cascade,
  question_text text not null,
  question_type text not null,
  difficulty text not null,
  topic_id uuid,
  topic_title text,
  source_reference text,
  legal_basis jsonb,
  correct_option_id uuid not null,
  correct_option_key text not null,
  correct_option_text text not null,
  correct_explanation text,
  options_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.quiz_attempt_question_snapshots enable row level security;

create policy "quiz_attempt_snapshots_admin_only"
on public.quiz_attempt_question_snapshots
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- Los estudiantes dejan de consultar directamente quiz_answers.
-- Sus respuestas se exponen únicamente mediante RPC controlados.
drop policy if exists "quiz_answers_select_own"
  on public.quiz_answers;

-- =========================================================
-- HELPERS PRIVADOS
-- =========================================================

create or replace function private.mastery_level_from_score(
  p_score numeric,
  p_answered integer
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(p_answered, 0) = 0 then 'not_started'
    when coalesce(p_score, 0) < 40 then 'initial'
    when coalesce(p_score, 0) < 60 then 'developing'
    when coalesce(p_score, 0) < 75 then 'competent'
    when coalesce(p_score, 0) < 90 then 'advanced'
    else 'mastered'
  end;
$$;

create or replace function private.refresh_topic_progress(
  p_user_id uuid,
  p_topic_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer := 0;
  v_answered integer := 0;
  v_correct integer := 0;
  v_accuracy numeric(5,2) := 0;
  v_mastery numeric(5,2) := 0;
begin
  if p_topic_id is null then
    return;
  end if;

  select
    count(distinct a.id)::integer,
    count(ans.id)::integer,
    count(ans.id) filter (where ans.is_correct = true)::integer
  into
    v_attempts,
    v_answered,
    v_correct
  from public.quiz_answers ans
  join public.quiz_attempt_questions aq
    on aq.id = ans.attempt_question_id
  join public.quiz_attempts a
    on a.id = aq.attempt_id
  join public.questions q
    on q.id = aq.question_id
  where ans.user_id = p_user_id
    and a.status = 'completed'
    and q.topic_id = p_topic_id;

  if v_answered > 0 then
    v_accuracy := round((v_correct::numeric / v_answered::numeric) * 100, 2);
  end if;

  select coalesce(round(avg(sqm.mastery_score), 2), 0)
  into v_mastery
  from public.student_question_mastery sqm
  join public.questions q
    on q.id = sqm.question_id
  where sqm.user_id = p_user_id
    and q.topic_id = p_topic_id;

  insert into public.student_topic_progress (
    user_id,
    topic_id,
    attempts_count,
    questions_answered,
    correct_answers,
    accuracy,
    mastery_score,
    mastery_level,
    updated_at
  )
  values (
    p_user_id,
    p_topic_id,
    v_attempts,
    v_answered,
    v_correct,
    v_accuracy,
    v_mastery,
    private.mastery_level_from_score(v_mastery, v_answered),
    now()
  )
  on conflict (user_id, topic_id)
  do update set
    attempts_count = excluded.attempts_count,
    questions_answered = excluded.questions_answered,
    correct_answers = excluded.correct_answers,
    accuracy = excluded.accuracy,
    mastery_score = excluded.mastery_score,
    mastery_level = excluded.mastery_level,
    updated_at = now();
end;
$$;

create or replace function private.refresh_unit_progress(
  p_user_id uuid,
  p_unit_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer := 0;
  v_answered integer := 0;
  v_correct integer := 0;
  v_accuracy numeric(5,2) := 0;
  v_progress numeric(5,2) := 0;
begin
  if p_unit_id is null then
    return;
  end if;

  select
    count(distinct a.id)::integer,
    count(ans.id)::integer,
    count(ans.id) filter (where ans.is_correct = true)::integer
  into
    v_attempts,
    v_answered,
    v_correct
  from public.quiz_answers ans
  join public.quiz_attempt_questions aq
    on aq.id = ans.attempt_question_id
  join public.quiz_attempts a
    on a.id = aq.attempt_id
  join public.questions q
    on q.id = aq.question_id
  where ans.user_id = p_user_id
    and a.status = 'completed'
    and q.unit_id = p_unit_id;

  if v_answered > 0 then
    v_accuracy := round((v_correct::numeric / v_answered::numeric) * 100, 2);
  end if;

  select coalesce(round(avg(sqm.mastery_score), 2), 0)
  into v_progress
  from public.student_question_mastery sqm
  join public.questions q
    on q.id = sqm.question_id
  where sqm.user_id = p_user_id
    and q.unit_id = p_unit_id;

  insert into public.student_unit_progress (
    user_id,
    unit_id,
    attempts_count,
    questions_answered,
    correct_answers,
    accuracy,
    progress_percent,
    updated_at
  )
  values (
    p_user_id,
    p_unit_id,
    v_attempts,
    v_answered,
    v_correct,
    v_accuracy,
    v_progress,
    now()
  )
  on conflict (user_id, unit_id)
  do update set
    attempts_count = excluded.attempts_count,
    questions_answered = excluded.questions_answered,
    correct_answers = excluded.correct_answers,
    accuracy = excluded.accuracy,
    progress_percent = excluded.progress_percent,
    updated_at = now();
end;
$$;

create or replace function private.refresh_subject_progress(
  p_user_id uuid,
  p_subject_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer := 0;
  v_answered integer := 0;
  v_correct integer := 0;
  v_accuracy numeric(5,2) := 0;
  v_progress numeric(5,2) := 0;
begin
  if p_subject_id is null then
    return;
  end if;

  select
    count(distinct a.id)::integer,
    count(ans.id)::integer,
    count(ans.id) filter (where ans.is_correct = true)::integer
  into
    v_attempts,
    v_answered,
    v_correct
  from public.quiz_answers ans
  join public.quiz_attempt_questions aq
    on aq.id = ans.attempt_question_id
  join public.quiz_attempts a
    on a.id = aq.attempt_id
  join public.questions q
    on q.id = aq.question_id
  join public.units u
    on u.id = q.unit_id
  where ans.user_id = p_user_id
    and a.status = 'completed'
    and u.subject_id = p_subject_id;

  if v_answered > 0 then
    v_accuracy := round((v_correct::numeric / v_answered::numeric) * 100, 2);
  end if;

  select coalesce(round(avg(sqm.mastery_score), 2), 0)
  into v_progress
  from public.student_question_mastery sqm
  join public.questions q
    on q.id = sqm.question_id
  join public.units u
    on u.id = q.unit_id
  where sqm.user_id = p_user_id
    and u.subject_id = p_subject_id;

  insert into public.student_subject_progress (
    user_id,
    subject_id,
    attempts_count,
    questions_answered,
    correct_answers,
    accuracy,
    progress_percent,
    updated_at
  )
  values (
    p_user_id,
    p_subject_id,
    v_attempts,
    v_answered,
    v_correct,
    v_accuracy,
    v_progress,
    now()
  )
  on conflict (user_id, subject_id)
  do update set
    attempts_count = excluded.attempts_count,
    questions_answered = excluded.questions_answered,
    correct_answers = excluded.correct_answers,
    accuracy = excluded.accuracy,
    progress_percent = excluded.progress_percent,
    updated_at = now();
end;
$$;

create or replace function private.quiz_attempt_summary(
  p_attempt_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'attempt_id', a.id,
    'quiz_config_id', a.quiz_config_id,
    'status', a.status,
    'quiz_type', a.quiz_type,
    'mode', a.mode,
    'total_questions', a.total_questions,
    'correct_answers', a.correct_answers,
    'incorrect_answers', a.incorrect_answers,
    'unanswered', a.unanswered,
    'score', a.score,
    'duration_seconds', a.duration_seconds,
    'started_at', a.started_at,
    'completed_at', a.completed_at,
    'subject', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'slug', s.slug,
      'code', s.code
    ),
    'unit', case
      when u.id is null then null
      else jsonb_build_object(
        'id', u.id,
        'unit_number', u.unit_number,
        'title', u.title,
        'slug', u.slug
      )
    end
  )
  from public.quiz_attempts a
  join public.subjects s
    on s.id = a.subject_id
  left join public.units u
    on u.id = a.unit_id
  where a.id = p_attempt_id;
$$;


revoke all on function private.mastery_level_from_score(numeric, integer) from public, anon, authenticated;
revoke all on function private.refresh_topic_progress(uuid, uuid) from public, anon, authenticated;
revoke all on function private.refresh_unit_progress(uuid, uuid) from public, anon, authenticated;
revoke all on function private.refresh_subject_progress(uuid, uuid) from public, anon, authenticated;
revoke all on function private.quiz_attempt_summary(uuid) from public, anon, authenticated;

-- =========================================================
-- INICIAR INTENTO
-- =========================================================

create or replace function public.start_quiz_attempt(
  p_quiz_config_id uuid,
  p_mode text default 'exam'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_config public.quiz_configs%rowtype;
  v_attempt_id uuid;
  v_ready integer := 0;
  v_distribution_total integer := 0;
  v_inserted integer := 0;
  v_distribution record;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Debes iniciar sesión para comenzar un simulador.';
  end if;

  if p_mode not in ('exam', 'practice') then
    raise exception 'Modo de simulador no válido.';
  end if;

  select *
  into v_config
  from public.quiz_configs qc
  where qc.id = p_quiz_config_id
    and qc.is_active = true;

  if not found then
    raise exception 'La configuración del simulador no existe o está inactiva.';
  end if;

  -- Un nuevo intento sustituye cualquier intento inconcluso del mismo simulador.
  update public.quiz_attempts
  set
    status = 'abandoned',
    completed_at = now(),
    duration_seconds = greatest(0, extract(epoch from (now() - started_at))::integer)
  where user_id = v_user_id
    and quiz_config_id = p_quiz_config_id
    and status = 'in_progress';

  if v_config.quiz_type = 'unit_30' then
    select count(*)::integer
    into v_ready
    from public.questions q
    where q.unit_id = v_config.unit_id
      and q.is_active = true
      and q.is_verified = true
      and exists (
        select 1
        from public.question_answers qa
        where qa.question_id = q.id
      )
      and (
        select count(*)
        from public.question_options qo
        where qo.question_id = q.id
      ) = 4;

    if v_ready < v_config.question_count then
      raise exception 'El simulador requiere % preguntas listas y actualmente existen %.',
        v_config.question_count,
        v_ready;
    end if;
  elsif v_config.quiz_type = 'subject_100' then
    select coalesce(sum(qud.question_count), 0)::integer
    into v_distribution_total
    from public.quiz_unit_distribution qud
    where qud.quiz_config_id = v_config.id;

    if v_distribution_total <> v_config.question_count then
      raise exception 'La distribución del simulador final no suma % preguntas.',
        v_config.question_count;
    end if;

    for v_distribution in
      select
        qud.unit_id,
        qud.question_count
      from public.quiz_unit_distribution qud
      join public.units u
        on u.id = qud.unit_id
      where qud.quiz_config_id = v_config.id
        and u.subject_id = v_config.subject_id
      order by u.unit_number
    loop
      select count(*)::integer
      into v_ready
      from public.questions q
      where q.unit_id = v_distribution.unit_id
        and q.is_active = true
        and q.is_verified = true
        and exists (
          select 1
          from public.question_answers qa
          where qa.question_id = q.id
        )
        and (
          select count(*)
          from public.question_options qo
          where qo.question_id = q.id
        ) = 4;

      if v_ready < v_distribution.question_count then
        raise exception 'Una unidad requiere % preguntas listas y actualmente existen %.',
          v_distribution.question_count,
          v_ready;
      end if;
    end loop;
  else
    raise exception 'Tipo de simulador no soportado.';
  end if;

  insert into public.quiz_attempts (
    user_id,
    subject_id,
    unit_id,
    quiz_config_id,
    quiz_type,
    mode,
    status,
    total_questions
  )
  values (
    v_user_id,
    v_config.subject_id,
    v_config.unit_id,
    v_config.id,
    v_config.quiz_type,
    p_mode,
    'in_progress',
    v_config.question_count
  )
  returning id into v_attempt_id;

  if v_config.quiz_type = 'unit_30' then
    insert into public.quiz_attempt_questions (
      attempt_id,
      question_id,
      position
    )
    select
      v_attempt_id,
      picked.id,
      row_number() over ()::integer
    from (
      select q.id
      from public.questions q
      where q.unit_id = v_config.unit_id
        and q.is_active = true
        and q.is_verified = true
        and exists (
          select 1
          from public.question_answers qa
          where qa.question_id = q.id
        )
        and (
          select count(*)
          from public.question_options qo
          where qo.question_id = q.id
        ) = 4
      order by
        case when v_config.randomize_questions then random() else 0 end,
        q.created_at,
        q.id
      limit v_config.question_count
    ) picked;
  else
    insert into public.quiz_attempt_questions (
      attempt_id,
      question_id,
      position
    )
    select
      v_attempt_id,
      picked.question_id,
      row_number() over (order by random())::integer
    from (
      select selected.question_id
      from public.quiz_unit_distribution qud
      cross join lateral (
        select q.id as question_id
        from public.questions q
        where q.unit_id = qud.unit_id
          and q.is_active = true
          and q.is_verified = true
          and exists (
            select 1
            from public.question_answers qa
            where qa.question_id = q.id
          )
          and (
            select count(*)
            from public.question_options qo
            where qo.question_id = q.id
          ) = 4
        order by
          case when v_config.randomize_questions then random() else 0 end,
          q.created_at,
          q.id
        limit qud.question_count
      ) selected
      where qud.quiz_config_id = v_config.id
    ) picked;
  end if;

  get diagnostics v_inserted = row_count;

  if v_inserted <> v_config.question_count then
    raise exception 'No se pudo construir el intento completo. Se asignaron % de % preguntas.',
      v_inserted,
      v_config.question_count;
  end if;

  update public.quiz_attempt_questions aq
  set option_order = (
    select array_agg(qo.option_key order by
      case when v_config.randomize_options then random() else qo.sort_order::double precision end,
      qo.sort_order
    )
    from public.question_options qo
    where qo.question_id = aq.question_id
  )
  where aq.attempt_id = v_attempt_id;

  insert into public.quiz_attempt_question_snapshots (
    attempt_question_id,
    question_text,
    question_type,
    difficulty,
    topic_id,
    topic_title,
    source_reference,
    legal_basis,
    correct_option_id,
    correct_option_key,
    correct_option_text,
    correct_explanation,
    options_snapshot
  )
  select
    aq.id,
    q.question_text,
    q.question_type,
    q.difficulty,
    q.topic_id,
    t.title,
    q.source_reference,
    case
      when la.id is null then null
      else jsonb_build_object(
        'article_number', la.article_number,
        'heading', la.heading,
        'explanation', la.explanation,
        'official_url', coalesce(la.official_url, ls.official_url),
        'source_title', ls.title,
        'source_abbreviation', ls.abbreviation
      )
    end,
    qa.correct_option_id,
    correct_option.option_key,
    correct_option.option_text,
    qa.correct_explanation,
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', qo.id,
          'key', qo.option_key,
          'text', qo.option_text,
          'feedback', qof.explanation,
          'is_correct', qo.id = qa.correct_option_id
        )
        order by coalesce(array_position(aq.option_order, qo.option_key), qo.sort_order)
      )
      from public.question_options qo
      left join public.question_option_feedback qof
        on qof.option_id = qo.id
      where qo.question_id = q.id
    )
  from public.quiz_attempt_questions aq
  join public.questions q
    on q.id = aq.question_id
  join public.question_answers qa
    on qa.question_id = q.id
  join public.question_options correct_option
    on correct_option.id = qa.correct_option_id
  left join public.topics t
    on t.id = q.topic_id
  left join public.legal_articles la
    on la.id = q.legal_article_id
  left join public.legal_sources ls
    on ls.id = la.legal_source_id
  where aq.attempt_id = v_attempt_id;

  return private.quiz_attempt_summary(v_attempt_id);
end;
$$;

revoke all on function public.start_quiz_attempt(uuid, text) from public;
grant execute on function public.start_quiz_attempt(uuid, text) to authenticated;

-- =========================================================
-- OBTENER INTENTO SIN EXPONER CLAVES
-- =========================================================

create or replace function public.get_quiz_attempt(
  p_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
  v_is_admin boolean := false;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sesión requerida.';
  end if;

  v_is_admin := private.is_admin();

  select *
  into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id;

  if not found then
    raise exception 'El intento no existe.';
  end if;

  if v_attempt.user_id <> v_user_id and not v_is_admin then
    raise exception using errcode = '42501', message = 'No puedes consultar este intento.';
  end if;

  select jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', a.id,
      'quiz_config_id', a.quiz_config_id,
      'quiz_type', a.quiz_type,
      'mode', a.mode,
      'status', a.status,
      'total_questions', a.total_questions,
      'started_at', a.started_at,
      'completed_at', a.completed_at,
      'time_limit_minutes', qc.time_limit_minutes,
      'subject', jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'slug', s.slug,
        'code', s.code
      ),
      'unit', case
        when u.id is null then null
        else jsonb_build_object(
          'id', u.id,
          'unit_number', u.unit_number,
          'title', u.title,
          'slug', u.slug
        )
      end
    ),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'attempt_question_id', aq.id,
          'question_id', aq.question_id,
          'position', aq.position,
          'question_text', snap.question_text,
          'question_type', snap.question_type,
          'difficulty', snap.difficulty,
          'topic', case
            when snap.topic_title is null then null
            else jsonb_build_object('id', snap.topic_id, 'title', snap.topic_title)
          end,
          'selected_option_id', ans.selected_option_id,
          'answered_at', ans.answered_at,
          'options', coalesce((
            select jsonb_agg(item - 'feedback' - 'is_correct' order by ordinality)
            from jsonb_array_elements(snap.options_snapshot)
              with ordinality as option_item(item, ordinality)
          ), '[]'::jsonb)
        )
        order by aq.position
      )
      from public.quiz_attempt_questions aq
      join public.quiz_attempt_question_snapshots snap
        on snap.attempt_question_id = aq.id
      left join public.quiz_answers ans
        on ans.attempt_question_id = aq.id
      where aq.attempt_id = a.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.quiz_attempts a
  join public.quiz_configs qc
    on qc.id = a.quiz_config_id
  join public.subjects s
    on s.id = a.subject_id
  left join public.units u
    on u.id = a.unit_id
  where a.id = p_attempt_id;

  return v_result;
end;
$$;

revoke all on function public.get_quiz_attempt(uuid) from public;
grant execute on function public.get_quiz_attempt(uuid) to authenticated;

-- =========================================================
-- RESPONDER UNA PREGUNTA
-- =========================================================

create or replace function public.submit_quiz_answer(
  p_attempt_id uuid,
  p_attempt_question_id uuid,
  p_selected_option_id uuid,
  p_response_time_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
  v_time_limit_minutes integer;
  v_question_id uuid;
  v_snapshot public.quiz_attempt_question_snapshots%rowtype;
  v_correct_option_id uuid;
  v_is_correct boolean;
  v_existing_option uuid;
  v_selected_key text;
  v_selected_text text;
  v_feedback jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sesión requerida.';
  end if;

  select *
  into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id
    and a.user_id = v_user_id;

  if not found then
    raise exception using errcode = '42501', message = 'Intento no disponible.';
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'Este intento ya no admite respuestas.';
  end if;

  select qc.time_limit_minutes
  into v_time_limit_minutes
  from public.quiz_configs qc
  where qc.id = v_attempt.quiz_config_id;

  if v_time_limit_minutes is not null
     and v_time_limit_minutes > 0
     and now() > v_attempt.started_at + make_interval(mins => v_time_limit_minutes) then
    raise exception 'El tiempo del simulador ha finalizado. Debes finalizar el intento.';
  end if;

  select aq.question_id
  into v_question_id
  from public.quiz_attempt_questions aq
  where aq.id = p_attempt_question_id
    and aq.attempt_id = p_attempt_id;

  if v_question_id is null then
    raise exception 'La pregunta no pertenece a este intento.';
  end if;

  select *
  into v_snapshot
  from public.quiz_attempt_question_snapshots snap
  where snap.attempt_question_id = p_attempt_question_id;

  if not found then
    raise exception 'No existe el snapshot seguro de esta pregunta.';
  end if;

  select
    option_item.item ->> 'key',
    option_item.item ->> 'text'
  into
    v_selected_key,
    v_selected_text
  from jsonb_array_elements(v_snapshot.options_snapshot) as option_item(item)
  where (option_item.item ->> 'id')::uuid = p_selected_option_id;

  if v_selected_key is null then
    raise exception 'La opción seleccionada no pertenece a la pregunta asignada.';
  end if;

  select ans.selected_option_id
  into v_existing_option
  from public.quiz_answers ans
  where ans.attempt_question_id = p_attempt_question_id;

  if v_existing_option is not null and v_existing_option <> p_selected_option_id then
    raise exception 'Esta pregunta ya fue respondida y no puede modificarse.';
  end if;

  v_correct_option_id := v_snapshot.correct_option_id;

  if v_correct_option_id is null then
    raise exception 'La pregunta no tiene una clave de respuesta válida.';
  end if;

  v_is_correct := p_selected_option_id = v_correct_option_id;

  insert into public.quiz_answers (
    attempt_question_id,
    user_id,
    selected_option_id,
    selected_option_key,
    selected_option_text,
    is_correct,
    response_time_seconds,
    answered_at
  )
  values (
    p_attempt_question_id,
    v_user_id,
    p_selected_option_id,
    v_selected_key,
    v_selected_text,
    v_is_correct,
    case
      when p_response_time_seconds is null then null
      else greatest(0, p_response_time_seconds)
    end,
    now()
  )
  on conflict (attempt_question_id)
  do update set
    response_time_seconds = coalesce(
      public.quiz_answers.response_time_seconds,
      excluded.response_time_seconds
    );

  if v_attempt.mode = 'practice' then
    select jsonb_build_object(
      'saved', true,
      'is_correct', v_is_correct,
      'selected_option_id', p_selected_option_id,
      'correct_option', jsonb_build_object(
        'id', v_snapshot.correct_option_id,
        'key', v_snapshot.correct_option_key,
        'text', v_snapshot.correct_option_text
      ),
      'correct_explanation', v_snapshot.correct_explanation,
      'selected_feedback', (
        select option_item.item ->> 'feedback'
        from jsonb_array_elements(v_snapshot.options_snapshot) as option_item(item)
        where (option_item.item ->> 'id')::uuid = p_selected_option_id
      ),
      'options_feedback', v_snapshot.options_snapshot
    )
    into v_feedback;

    return v_feedback;
  end if;

  return jsonb_build_object('saved', true);
end;
$$;

revoke all on function public.submit_quiz_answer(uuid, uuid, uuid, integer) from public;
grant execute on function public.submit_quiz_answer(uuid, uuid, uuid, integer) to authenticated;

-- =========================================================
-- FINALIZAR Y CALCULAR DOMINIO
-- =========================================================

create or replace function public.finish_quiz_attempt(
  p_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
  v_total integer := 0;
  v_correct integer := 0;
  v_incorrect integer := 0;
  v_unanswered integer := 0;
  v_score numeric(5,2) := 0;
  v_duration integer := 0;
  v_answer record;
  v_topic record;
  v_unit record;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sesión requerida.';
  end if;

  select *
  into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id
    and a.user_id = v_user_id;

  if not found then
    raise exception using errcode = '42501', message = 'Intento no disponible.';
  end if;

  if v_attempt.status = 'completed' then
    return private.quiz_attempt_summary(p_attempt_id);
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'El intento no puede finalizarse porque está %.', v_attempt.status;
  end if;

  v_total := v_attempt.total_questions;

  select
    count(*) filter (where ans.is_correct = true)::integer,
    count(*) filter (where ans.is_correct = false)::integer
  into
    v_correct,
    v_incorrect
  from public.quiz_answers ans
  join public.quiz_attempt_questions aq
    on aq.id = ans.attempt_question_id
  where aq.attempt_id = p_attempt_id;

  v_correct := coalesce(v_correct, 0);
  v_incorrect := coalesce(v_incorrect, 0);
  v_unanswered := greatest(0, v_total - v_correct - v_incorrect);

  if v_total > 0 then
    v_score := round((v_correct::numeric / v_total::numeric) * 100, 2);
  end if;

  v_duration := greatest(
    0,
    extract(epoch from (now() - v_attempt.started_at))::integer
  );

  update public.quiz_attempts
  set
    status = 'completed',
    correct_answers = v_correct,
    incorrect_answers = v_incorrect,
    unanswered = v_unanswered,
    score = v_score,
    duration_seconds = v_duration,
    completed_at = now()
  where id = p_attempt_id;

  -- Cada respuesta modifica el dominio de la pregunta.
  -- Una sola respuesta correcta nunca marca una pregunta como dominada:
  -- se necesitan varias respuestas correctas para elevar el score a >= 90.
  for v_answer in
    select
      q.id as question_id,
      q.topic_id,
      q.unit_id,
      ans.is_correct,
      ans.answered_at
    from public.quiz_answers ans
    join public.quiz_attempt_questions aq
      on aq.id = ans.attempt_question_id
    join public.questions q
      on q.id = aq.question_id
    where aq.attempt_id = p_attempt_id
  loop
    insert into public.student_question_mastery as sqm (
      user_id,
      question_id,
      times_seen,
      times_correct,
      times_incorrect,
      consecutive_correct,
      last_result,
      mastery_score,
      last_answered_at,
      updated_at
    )
    values (
      v_user_id,
      v_answer.question_id,
      1,
      case when v_answer.is_correct then 1 else 0 end,
      case when v_answer.is_correct then 0 else 1 end,
      case when v_answer.is_correct then 1 else 0 end,
      v_answer.is_correct,
      case when v_answer.is_correct then 25 else 0 end,
      v_answer.answered_at,
      now()
    )
    on conflict (user_id, question_id)
    do update set
      times_seen = sqm.times_seen + 1,
      times_correct = sqm.times_correct
        + case when excluded.last_result then 1 else 0 end,
      times_incorrect = sqm.times_incorrect
        + case when excluded.last_result then 0 else 1 end,
      consecutive_correct = case
        when excluded.last_result
          then sqm.consecutive_correct + 1
        else 0
      end,
      last_result = excluded.last_result,
      mastery_score = case
        when excluded.last_result
          then least(100, sqm.mastery_score + 25)
        else greatest(0, sqm.mastery_score - 20)
      end,
      last_answered_at = excluded.last_answered_at,
      updated_at = now();
  end loop;

  for v_topic in
    select distinct q.topic_id
    from public.quiz_answers ans
    join public.quiz_attempt_questions aq
      on aq.id = ans.attempt_question_id
    join public.questions q
      on q.id = aq.question_id
    where aq.attempt_id = p_attempt_id
      and q.topic_id is not null
  loop
    perform private.refresh_topic_progress(v_user_id, v_topic.topic_id);
  end loop;

  for v_unit in
    select distinct q.unit_id
    from public.quiz_answers ans
    join public.quiz_attempt_questions aq
      on aq.id = ans.attempt_question_id
    join public.questions q
      on q.id = aq.question_id
    where aq.attempt_id = p_attempt_id
  loop
    perform private.refresh_unit_progress(v_user_id, v_unit.unit_id);
  end loop;

  perform private.refresh_subject_progress(v_user_id, v_attempt.subject_id);

  return private.quiz_attempt_summary(p_attempt_id);
end;
$$;

revoke all on function public.finish_quiz_attempt(uuid) from public;
grant execute on function public.finish_quiz_attempt(uuid) to authenticated;

-- =========================================================
-- ABANDONAR INTENTO
-- =========================================================

create or replace function public.abandon_quiz_attempt(
  p_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sesión requerida.';
  end if;

  select *
  into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id
    and a.user_id = v_user_id;

  if not found then
    raise exception using errcode = '42501', message = 'Intento no disponible.';
  end if;

  if v_attempt.status = 'in_progress' then
    update public.quiz_attempts
    set
      status = 'abandoned',
      completed_at = now(),
      duration_seconds = greatest(0, extract(epoch from (now() - started_at))::integer)
    where id = p_attempt_id;
  end if;

  return private.quiz_attempt_summary(p_attempt_id);
end;
$$;

revoke all on function public.abandon_quiz_attempt(uuid) from public;
grant execute on function public.abandon_quiz_attempt(uuid) to authenticated;

-- =========================================================
-- REVISIÓN COMPLETA SOLO DESPUÉS DE FINALIZAR
-- =========================================================

create or replace function public.get_quiz_attempt_review(
  p_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
  v_is_admin boolean := false;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sesión requerida.';
  end if;

  v_is_admin := private.is_admin();

  select *
  into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id;

  if not found then
    raise exception 'El intento no existe.';
  end if;

  if v_attempt.user_id <> v_user_id and not v_is_admin then
    raise exception using errcode = '42501', message = 'No puedes revisar este intento.';
  end if;

  if v_attempt.status <> 'completed' then
    raise exception 'La revisión solo está disponible cuando el intento ha finalizado.';
  end if;

  select jsonb_build_object(
    'summary', private.quiz_attempt_summary(a.id),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'attempt_question_id', aq.id,
          'position', aq.position,
          'question_id', aq.question_id,
          'question_text', snap.question_text,
          'question_type', snap.question_type,
          'difficulty', snap.difficulty,
          'source_reference', snap.source_reference,
          'topic', case
            when snap.topic_title is null then null
            else jsonb_build_object('id', snap.topic_id, 'title', snap.topic_title)
          end,
          'selected_option_id', ans.selected_option_id,
          'is_correct', coalesce(ans.is_correct, false),
          'was_answered', ans.id is not null,
          'correct_option', jsonb_build_object(
            'id', snap.correct_option_id,
            'key', snap.correct_option_key,
            'text', snap.correct_option_text
          ),
          'correct_explanation', snap.correct_explanation,
          'legal_basis', snap.legal_basis,
          'options', coalesce((
            select jsonb_agg(
              option_item.item || jsonb_build_object(
                'is_selected',
                (option_item.item ->> 'id')::uuid = ans.selected_option_id
              )
              order by option_item.ordinality
            )
            from jsonb_array_elements(snap.options_snapshot)
              with ordinality as option_item(item, ordinality)
          ), '[]'::jsonb)
        )
        order by aq.position
      )
      from public.quiz_attempt_questions aq
      join public.quiz_attempt_question_snapshots snap
        on snap.attempt_question_id = aq.id
      left join public.quiz_answers ans
        on ans.attempt_question_id = aq.id
      where aq.attempt_id = a.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.quiz_attempts a
  where a.id = p_attempt_id;

  return v_result;
end;
$$;

revoke all on function public.get_quiz_attempt_review(uuid) from public;
grant execute on function public.get_quiz_attempt_review(uuid) to authenticated;

commit;
