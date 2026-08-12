begin;

-- =========================================================
-- DERECHO ESTUDIO v0.5
-- Banco de preguntas y guardado transaccional seguro
-- =========================================================

-- Las preguntas de selección múltiple de la plataforma usan
-- exactamente cuatro alternativas A, B, C y D.
alter table public.question_options
  drop constraint if exists question_options_option_key_check;

alter table public.question_options
  add constraint question_options_option_key_check
  check (upper(option_key) in ('A', 'B', 'C', 'D'));

-- =========================================================
-- RPC ADMINISTRATIVO: CREAR / ACTUALIZAR PREGUNTA COMPLETA
--
-- Guarda de forma atómica:
--   - pregunta
--   - 4 opciones
--   - respuesta correcta protegida
--   - feedback individual de cada alternativa
-- =========================================================

create or replace function public.admin_save_question(
  p_question_id uuid,
  p_unit_id uuid,
  p_topic_id uuid,
  p_legal_article_id uuid,
  p_question_text text,
  p_question_type text,
  p_difficulty text,
  p_source_reference text,
  p_is_active boolean,
  p_is_verified boolean,
  p_correct_explanation text,
  p_options jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question_id uuid;
  v_option jsonb;
  v_option_id uuid;
  v_correct_option_id uuid;
  v_option_count integer;
  v_correct_count integer;
  v_distinct_keys integer;
  v_invalid_keys integer;
  v_blank_options integer;
  v_blank_feedback integer;
begin
  if not private.is_admin() then
    raise exception using
      errcode = '42501',
      message = 'No tienes permisos para administrar preguntas.';
  end if;

  if p_unit_id is null then
    raise exception 'La unidad es obligatoria.';
  end if;

  if not exists (
    select 1
    from public.units u
    where u.id = p_unit_id
  ) then
    raise exception 'La unidad seleccionada no existe.';
  end if;

  if p_topic_id is not null and not exists (
    select 1
    from public.topics t
    where t.id = p_topic_id
      and t.unit_id = p_unit_id
  ) then
    raise exception 'El tema seleccionado no pertenece a la unidad.';
  end if;

  if p_legal_article_id is not null and not exists (
    select 1
    from public.legal_articles la
    where la.id = p_legal_article_id
  ) then
    raise exception 'El artículo jurídico seleccionado no existe.';
  end if;

  if nullif(btrim(coalesce(p_question_text, '')), '') is null then
    raise exception 'El texto de la pregunta es obligatorio.';
  end if;

  if p_question_type not in (
    'multiple_choice',
    'case_based',
    'normative',
    'conceptual',
    'jurisprudence'
  ) then
    raise exception 'Tipo de pregunta no válido.';
  end if;

  if p_difficulty not in ('basic', 'intermediate', 'advanced') then
    raise exception 'Nivel de dificultad no válido.';
  end if;

  if jsonb_typeof(p_options) <> 'array' then
    raise exception 'Las opciones deben enviarse como un arreglo JSON.';
  end if;

  select
    count(*),
    count(*) filter (
      where lower(coalesce(item ->> 'is_correct', 'false')) = 'true'
    ),
    count(distinct upper(coalesce(item ->> 'key', ''))),
    count(*) filter (
      where upper(coalesce(item ->> 'key', '')) not in ('A', 'B', 'C', 'D')
    ),
    count(*) filter (
      where nullif(btrim(coalesce(item ->> 'text', '')), '') is null
    ),
    count(*) filter (
      where nullif(btrim(coalesce(item ->> 'feedback', '')), '') is null
    )
  into
    v_option_count,
    v_correct_count,
    v_distinct_keys,
    v_invalid_keys,
    v_blank_options,
    v_blank_feedback
  from jsonb_array_elements(p_options) item;

  if v_option_count <> 4 then
    raise exception 'La pregunta debe contener exactamente cuatro opciones.';
  end if;

  if v_correct_count <> 1 then
    raise exception 'Debe existir exactamente una respuesta correcta.';
  end if;

  if v_distinct_keys <> 4 or v_invalid_keys <> 0 then
    raise exception 'Las opciones deben utilizar las claves A, B, C y D sin repetir.';
  end if;

  if v_blank_options <> 0 then
    raise exception 'Ninguna opción de respuesta puede estar vacía.';
  end if;

  if v_blank_feedback <> 0 then
    raise exception 'Cada opción debe tener su explicación o feedback.';
  end if;

  if nullif(btrim(coalesce(p_correct_explanation, '')), '') is null then
    raise exception 'La explicación general de la respuesta correcta es obligatoria.';
  end if;

  if p_question_id is null then
    insert into public.questions (
      unit_id,
      topic_id,
      legal_article_id,
      question_text,
      question_type,
      difficulty,
      source_reference,
      is_active,
      is_verified,
      created_by,
      updated_by
    )
    values (
      p_unit_id,
      p_topic_id,
      p_legal_article_id,
      btrim(p_question_text),
      p_question_type,
      p_difficulty,
      nullif(btrim(coalesce(p_source_reference, '')), ''),
      coalesce(p_is_active, true),
      coalesce(p_is_verified, false),
      auth.uid(),
      auth.uid()
    )
    returning id into v_question_id;
  else
    if not exists (
      select 1
      from public.questions q
      where q.id = p_question_id
    ) then
      raise exception 'La pregunta que intentas editar no existe.';
    end if;

    update public.questions
    set
      unit_id = p_unit_id,
      topic_id = p_topic_id,
      legal_article_id = p_legal_article_id,
      question_text = btrim(p_question_text),
      question_type = p_question_type,
      difficulty = p_difficulty,
      source_reference = nullif(btrim(coalesce(p_source_reference, '')), ''),
      is_active = coalesce(p_is_active, true),
      is_verified = coalesce(p_is_verified, false),
      updated_by = auth.uid()
    where id = p_question_id;

    v_question_id := p_question_id;

    -- Al borrar opciones, las respuestas y feedback asociados
    -- se eliminan por las FK ON DELETE CASCADE.
    delete from public.question_options
    where question_id = v_question_id;
  end if;

  for v_option in
    select value
    from jsonb_array_elements(p_options)
    order by upper(value ->> 'key')
  loop
    insert into public.question_options (
      question_id,
      option_key,
      option_text,
      sort_order
    )
    values (
      v_question_id,
      upper(v_option ->> 'key'),
      btrim(v_option ->> 'text'),
      ascii(upper(v_option ->> 'key')) - ascii('A') + 1
    )
    returning id into v_option_id;

    insert into public.question_option_feedback (
      option_id,
      explanation
    )
    values (
      v_option_id,
      btrim(v_option ->> 'feedback')
    );

    if lower(coalesce(v_option ->> 'is_correct', 'false')) = 'true' then
      v_correct_option_id := v_option_id;
    end if;
  end loop;

  insert into public.question_answers (
    question_id,
    correct_option_id,
    correct_explanation
  )
  values (
    v_question_id,
    v_correct_option_id,
    btrim(p_correct_explanation)
  );

  insert into public.admin_activity (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    auth.uid(),
    case when p_question_id is null then 'question_created' else 'question_updated' end,
    'question',
    v_question_id,
    jsonb_build_object(
      'unit_id', p_unit_id,
      'topic_id', p_topic_id,
      'difficulty', p_difficulty,
      'is_verified', coalesce(p_is_verified, false)
    )
  );

  return v_question_id;
end;
$$;

revoke all on function public.admin_save_question(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  text,
  jsonb
) from public;

grant execute on function public.admin_save_question(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  boolean,
  boolean,
  text,
  jsonb
) to authenticated;

commit;
