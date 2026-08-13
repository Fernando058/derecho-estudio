begin;

-- =========================================================
-- DERECHO ESTUDIO v0.7
-- Analítica, práctica de errores y configuración administrativa
-- =========================================================

-- ---------------------------------------------------------
-- 1. Permitir intentos de práctica de errores sin quiz_config_id.
--    Los simuladores normales continúan usando su configuración.
-- ---------------------------------------------------------

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
  left join public.quiz_configs qc
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

-- ---------------------------------------------------------
-- 2. Iniciar práctica personalizada con preguntas falladas.
--    Se mantienen en el pool hasta alcanzar dominio >= 90.
-- ---------------------------------------------------------

create or replace function public.start_error_practice(
  p_subject_id uuid,
  p_limit integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_subject public.subjects%rowtype;
  v_question_ids uuid[];
  v_count integer := 0;
  v_attempt_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Debes iniciar sesión para practicar tus errores.';
  end if;

  if p_limit is null or p_limit < 5 or p_limit > 30 then
    raise exception 'La práctica debe contener entre 5 y 30 preguntas.';
  end if;

  select *
  into v_subject
  from public.subjects s
  where s.id = p_subject_id
    and (s.is_published = true or private.is_admin());

  if not found then
    raise exception 'La materia no existe o no está disponible.';
  end if;

  select array_agg(chosen.id)
  into v_question_ids
  from (
    select q.id
    from public.student_question_mastery sqm
    join public.questions q
      on q.id = sqm.question_id
    join public.units u
      on u.id = q.unit_id
    where sqm.user_id = v_user_id
      and u.subject_id = p_subject_id
      and sqm.times_incorrect > 0
      and sqm.mastery_score < 90
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
      case when sqm.last_result = false then 0 else 1 end,
      sqm.mastery_score asc,
      sqm.times_incorrect desc,
      sqm.last_answered_at asc nulls first,
      random()
    limit p_limit
  ) chosen;

  v_count := coalesce(cardinality(v_question_ids), 0);

  if v_count = 0 then
    raise exception 'No tienes preguntas pendientes de refuerzo en esta materia.';
  end if;

  update public.quiz_attempts
  set
    status = 'abandoned',
    completed_at = now(),
    duration_seconds = greatest(0, extract(epoch from (now() - started_at))::integer)
  where user_id = v_user_id
    and subject_id = p_subject_id
    and quiz_type = 'practice_errors'
    and status = 'in_progress';

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
    p_subject_id,
    null,
    null,
    'practice_errors',
    'practice',
    'in_progress',
    v_count
  )
  returning id into v_attempt_id;

  insert into public.quiz_attempt_questions (
    attempt_id,
    question_id,
    position
  )
  select
    v_attempt_id,
    item.question_id,
    item.ordinality::integer
  from unnest(v_question_ids) with ordinality as item(question_id, ordinality);

  update public.quiz_attempt_questions aq
  set option_order = (
    select array_agg(qo.option_key order by random())
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

revoke all on function public.start_error_practice(uuid, integer) from public;
grant execute on function public.start_error_practice(uuid, integer) to authenticated;

-- ---------------------------------------------------------
-- 3. Dashboard analítico personal.
-- ---------------------------------------------------------

create or replace function public.get_learning_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_completed integer := 0;
  v_answered integer := 0;
  v_correct integer := 0;
  v_accuracy numeric(5,2) := 0;
  v_avg_score numeric(5,2) := 0;
  v_errors integer := 0;
  v_mastered integer := 0;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sesión requerida.';
  end if;

  select
    count(*)::integer,
    coalesce(round(avg(a.score), 2), 0)
  into v_completed, v_avg_score
  from public.quiz_attempts a
  where a.user_id = v_user_id
    and a.status = 'completed';

  select
    count(ans.id)::integer,
    count(ans.id) filter (where ans.is_correct = true)::integer
  into v_answered, v_correct
  from public.quiz_answers ans
  join public.quiz_attempt_questions aq
    on aq.id = ans.attempt_question_id
  join public.quiz_attempts a
    on a.id = aq.attempt_id
  where ans.user_id = v_user_id
    and a.status = 'completed';

  if v_answered > 0 then
    v_accuracy := round((v_correct::numeric / v_answered::numeric) * 100, 2);
  end if;

  select
    count(*) filter (
      where sqm.times_incorrect > 0
        and sqm.mastery_score < 90
    )::integer,
    count(*) filter (
      where sqm.mastery_score >= 90
        and sqm.consecutive_correct >= 2
    )::integer
  into v_errors, v_mastered
  from public.student_question_mastery sqm
  where sqm.user_id = v_user_id;

  select jsonb_build_object(
    'summary', jsonb_build_object(
      'completed_attempts', v_completed,
      'questions_answered', v_answered,
      'correct_answers', v_correct,
      'accuracy', v_accuracy,
      'average_score', v_avg_score,
      'error_questions', v_errors,
      'mastered_questions', v_mastered
    ),
    'subjects', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug,
          'code', s.code,
          'attempts_count', coalesce(ssp.attempts_count, 0),
          'questions_answered', coalesce(ssp.questions_answered, 0),
          'correct_answers', coalesce(ssp.correct_answers, 0),
          'accuracy', coalesce(ssp.accuracy, 0),
          'progress_percent', coalesce(ssp.progress_percent, 0),
          'error_questions', (
            select count(*)
            from public.student_question_mastery sqm
            join public.questions q on q.id = sqm.question_id
            join public.units u on u.id = q.unit_id
            where sqm.user_id = v_user_id
              and u.subject_id = s.id
              and sqm.times_incorrect > 0
              and sqm.mastery_score < 90
          ),
          'mastered_questions', (
            select count(*)
            from public.student_question_mastery sqm
            join public.questions q on q.id = sqm.question_id
            join public.units u on u.id = q.unit_id
            where sqm.user_id = v_user_id
              and u.subject_id = s.id
              and sqm.mastery_score >= 90
              and sqm.consecutive_correct >= 2
          ),
          'units', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', u.id,
                'unit_number', u.unit_number,
                'title', u.title,
                'attempts_count', coalesce(sup.attempts_count, 0),
                'questions_answered', coalesce(sup.questions_answered, 0),
                'accuracy', coalesce(sup.accuracy, 0),
                'progress_percent', coalesce(sup.progress_percent, 0)
              )
              order by u.unit_number
            )
            from public.units u
            left join public.student_unit_progress sup
              on sup.unit_id = u.id
             and sup.user_id = v_user_id
            where u.subject_id = s.id
              and u.is_published = true
          ), '[]'::jsonb)
        )
        order by s.sort_order, s.name
      )
      from public.subjects s
      left join public.student_subject_progress ssp
        on ssp.subject_id = s.id
       and ssp.user_id = v_user_id
      where s.is_published = true
    ), '[]'::jsonb),
    'strengths', coalesce((
      select jsonb_agg(row_data)
      from (
        select jsonb_build_object(
          'topic_id', stp.topic_id,
          'topic_title', t.title,
          'subject_name', s.name,
          'unit_number', u.unit_number,
          'questions_answered', stp.questions_answered,
          'accuracy', stp.accuracy,
          'mastery_score', stp.mastery_score,
          'mastery_level', stp.mastery_level
        ) as row_data
        from public.student_topic_progress stp
        join public.topics t on t.id = stp.topic_id
        join public.units u on u.id = t.unit_id
        join public.subjects s on s.id = u.subject_id
        where stp.user_id = v_user_id
          and stp.questions_answered > 0
        order by stp.mastery_score desc, stp.accuracy desc, stp.questions_answered desc
        limit 5
      ) ranked
    ), '[]'::jsonb),
    'weaknesses', coalesce((
      select jsonb_agg(row_data)
      from (
        select jsonb_build_object(
          'topic_id', stp.topic_id,
          'topic_title', t.title,
          'subject_name', s.name,
          'unit_number', u.unit_number,
          'questions_answered', stp.questions_answered,
          'accuracy', stp.accuracy,
          'mastery_score', stp.mastery_score,
          'mastery_level', stp.mastery_level
        ) as row_data
        from public.student_topic_progress stp
        join public.topics t on t.id = stp.topic_id
        join public.units u on u.id = t.unit_id
        join public.subjects s on s.id = u.subject_id
        where stp.user_id = v_user_id
          and stp.questions_answered > 0
        order by stp.mastery_score asc, stp.accuracy asc, stp.questions_answered desc
        limit 5
      ) ranked
    ), '[]'::jsonb),
    'recent_attempts', coalesce((
      select jsonb_agg(row_data)
      from (
        select jsonb_build_object(
          'id', a.id,
          'score', a.score,
          'quiz_type', a.quiz_type,
          'mode', a.mode,
          'completed_at', a.completed_at,
          'subject_name', s.name,
          'subject_code', s.code,
          'unit_number', u.unit_number
        ) as row_data
        from public.quiz_attempts a
        join public.subjects s on s.id = a.subject_id
        left join public.units u on u.id = a.unit_id
        where a.user_id = v_user_id
          and a.status = 'completed'
        order by a.completed_at desc
        limit 12
      ) recent
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_learning_dashboard() from public;
grant execute on function public.get_learning_dashboard() to authenticated;

-- ---------------------------------------------------------
-- 4. Administración transaccional de configuraciones.
-- ---------------------------------------------------------

create or replace function public.admin_update_quiz_config(
  p_quiz_config_id uuid,
  p_time_limit_minutes integer,
  p_randomize_questions boolean,
  p_randomize_options boolean,
  p_is_active boolean,
  p_distribution jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config public.quiz_configs%rowtype;
  v_total integer := 0;
  v_items integer := 0;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'Permisos administrativos requeridos.';
  end if;

  select * into v_config
  from public.quiz_configs qc
  where qc.id = p_quiz_config_id;

  if not found then
    raise exception 'La configuración no existe.';
  end if;

  if p_time_limit_minutes is not null
     and (p_time_limit_minutes < 5 or p_time_limit_minutes > 300) then
    raise exception 'El tiempo debe estar entre 5 y 300 minutos.';
  end if;

  update public.quiz_configs
  set
    time_limit_minutes = p_time_limit_minutes,
    randomize_questions = coalesce(p_randomize_questions, randomize_questions),
    randomize_options = coalesce(p_randomize_options, randomize_options),
    is_active = coalesce(p_is_active, is_active),
    updated_at = now()
  where id = p_quiz_config_id;

  if v_config.quiz_type = 'subject_100' and p_distribution is not null then
    if jsonb_typeof(p_distribution) <> 'array' then
      raise exception 'La distribución debe ser un arreglo JSON.';
    end if;

    v_items := jsonb_array_length(p_distribution);

    if v_items <> 4 then
      raise exception 'El simulador final debe distribuirse entre exactamente 4 unidades.';
    end if;

    select coalesce(sum((item ->> 'question_count')::integer), 0)
    into v_total
    from jsonb_array_elements(p_distribution) as dist(item);

    if v_total <> 100 then
      raise exception 'La distribución del simulador final debe sumar exactamente 100 preguntas.';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_distribution) as dist(item)
      left join public.units u
        on u.id = (item ->> 'unit_id')::uuid
      where u.id is null
         or u.subject_id <> v_config.subject_id
         or (item ->> 'question_count')::integer <= 0
    ) then
      raise exception 'La distribución contiene una unidad inválida o una cantidad no permitida.';
    end if;

    delete from public.quiz_unit_distribution
    where quiz_config_id = p_quiz_config_id;

    insert into public.quiz_unit_distribution (
      quiz_config_id,
      unit_id,
      question_count
    )
    select
      p_quiz_config_id,
      (item ->> 'unit_id')::uuid,
      (item ->> 'question_count')::integer
    from jsonb_array_elements(p_distribution) as dist(item);
  elsif v_config.quiz_type = 'unit_30' and p_distribution is not null then
    raise exception 'Los simuladores de unidad mantienen una cantidad fija de 30 preguntas.';
  end if;

  return jsonb_build_object(
    'saved', true,
    'quiz_config_id', p_quiz_config_id
  );
end;
$$;

revoke all on function public.admin_update_quiz_config(uuid, integer, boolean, boolean, boolean, jsonb) from public;
grant execute on function public.admin_update_quiz_config(uuid, integer, boolean, boolean, boolean, jsonb) to authenticated;

-- ---------------------------------------------------------
-- 5. Analítica global para administradores.
-- ---------------------------------------------------------

create or replace function public.admin_get_analytics_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'Permisos administrativos requeridos.';
  end if;

  select jsonb_build_object(
    'summary', jsonb_build_object(
      'students', (
        select count(*)
        from public.profiles p
        where p.role = 'student' and p.is_active = true
      ),
      'completed_attempts', (
        select count(*)
        from public.quiz_attempts a
        where a.status = 'completed'
      ),
      'average_score', (
        select coalesce(round(avg(a.score), 2), 0)
        from public.quiz_attempts a
        where a.status = 'completed'
      ),
      'ready_questions', (
        select count(*)
        from public.questions q
        where q.is_active = true and q.is_verified = true
      )
    ),
    'weak_topics', coalesce((
      select jsonb_agg(row_data)
      from (
        select jsonb_build_object(
          'topic_id', t.id,
          'topic_title', t.title,
          'subject_name', s.name,
          'unit_number', u.unit_number,
          'answers', count(ans.id),
          'accuracy', round(
            (count(ans.id) filter (where ans.is_correct = true)::numeric
              / nullif(count(ans.id), 0)::numeric) * 100,
            2
          )
        ) as row_data
        from public.quiz_answers ans
        join public.quiz_attempt_questions aq on aq.id = ans.attempt_question_id
        join public.quiz_attempts a on a.id = aq.attempt_id and a.status = 'completed'
        join public.questions q on q.id = aq.question_id
        join public.topics t on t.id = q.topic_id
        join public.units u on u.id = q.unit_id
        join public.subjects s on s.id = u.subject_id
        group by t.id, t.title, s.name, u.unit_number
        having count(ans.id) > 0
        order by
          (count(ans.id) filter (where ans.is_correct = true)::numeric
            / nullif(count(ans.id), 0)::numeric) asc,
          count(ans.id) desc
        limit 10
      ) weak
    ), '[]'::jsonb),
    'difficult_questions', coalesce((
      select jsonb_agg(row_data)
      from (
        select jsonb_build_object(
          'question_id', q.id,
          'question_text', q.question_text,
          'subject_name', s.name,
          'unit_number', u.unit_number,
          'answers', count(ans.id),
          'incorrect', count(ans.id) filter (where ans.is_correct = false),
          'accuracy', round(
            (count(ans.id) filter (where ans.is_correct = true)::numeric
              / nullif(count(ans.id), 0)::numeric) * 100,
            2
          )
        ) as row_data
        from public.quiz_answers ans
        join public.quiz_attempt_questions aq on aq.id = ans.attempt_question_id
        join public.quiz_attempts a on a.id = aq.attempt_id and a.status = 'completed'
        join public.questions q on q.id = aq.question_id
        join public.units u on u.id = q.unit_id
        join public.subjects s on s.id = u.subject_id
        group by q.id, q.question_text, s.name, u.unit_number
        having count(ans.id) > 0
        order by
          (count(ans.id) filter (where ans.is_correct = true)::numeric
            / nullif(count(ans.id), 0)::numeric) asc,
          count(ans.id) desc
        limit 10
      ) difficult
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_get_analytics_dashboard() from public;
grant execute on function public.admin_get_analytics_dashboard() to authenticated;

commit;
