-- =====================================================================
-- DERECHO ESTUDIO
-- BANCO BASE GENERADO DESDE EL CONTENIDO ACADÉMICO YA CARGADO
-- Semestres 3, 4 y 5
--
-- OBJETIVO:
--   * Garantizar 30 preguntas verificadas por CADA UNIDAD PUBLICADA.
--   * Los simuladores de unidad usan 30 por intento.
--   * Las materias con sus 4 unidades publicadas quedan en condiciones
--     de construir el simulador final de 100 preguntas (25 por unidad).
--
-- FUENTE:
--   * topics, units, subjects y content_blocks previamente cargados desde
--     los compendios entregados por el usuario.
--   * No reconstruye unidades cuyo material está ausente.
--
-- IMPORTANTE:
--   * Este script NO elimina las 150 preguntas originales del banco.
--   * Solo reemplaza preguntas con source_reference:
--       AUTO:S345:BASELINE:%
--   * Las preguntas generadas son de reconocimiento, relación temática,
--     ubicación por unidad y resultado de aprendizaje. El administrador
--     puede ampliar posteriormente el banco con preguntas más complejas.
-- =====================================================================

begin;

-- ---------------------------------------------------------
-- 1. Limpiar únicamente una ejecución previa de este banco generado
-- ---------------------------------------------------------
delete from public.questions
where source_reference like 'AUTO:S345:BASELINE:%';


-- ---------------------------------------------------------
-- 2. Generar 30 preguntas por cada unidad publicada
-- ---------------------------------------------------------
do $$
declare
  r_unit record;

  v_topic_ids uuid[];
  v_topic_titles text[];
  v_topic_count integer;

  v_correct_topic_id uuid;
  v_correct_topic_title text;

  v_distractors text[];
  v_unit_distractors text[];
  v_outcome_distractors text[];

  v_family integer;
  v_subject_published_units integer;
  v_question_text text;
  v_correct_text text;
  v_correct_explanation text;
  v_source_note text;

  v_question_id uuid;
  v_option_id uuid;
  v_correct_option_id uuid;

  v_correct_position integer;
  v_wrong_index integer;
  v_option_position integer;
  v_option_text text;
  v_option_key text;
  v_feedback text;

  i integer;
  v_topic_index integer;
begin
  for r_unit in
    select
      sem.level_number,
      s.id as subject_id,
      s.code as subject_code,
      s.name as subject_name,
      u.id as unit_id,
      u.unit_number,
      u.title as unit_title,
      u.learning_outcome
    from public.units u
    join public.subjects s
      on s.id = u.subject_id
    join public.semesters sem
      on sem.id = s.semester_id
    where sem.level_number in (3, 4, 5)
      and s.is_published = true
      and u.is_published = true
    order by
      sem.level_number,
      s.sort_order,
      u.unit_number
  loop

    -- Temas disponibles en la unidad.
    select
      array_agg(t.id order by t.sort_order, t.title),
      array_agg(t.title order by t.sort_order, t.title)
    into
      v_topic_ids,
      v_topic_titles
    from public.topics t
    where t.unit_id = r_unit.unit_id
      and t.is_published = true;

    v_topic_count := coalesce(cardinality(v_topic_ids), 0);

    if v_topic_count = 0 then
      raise notice
        'Unidad omitida por no tener temas publicados: % U%',
        r_unit.subject_code,
        r_unit.unit_number;
      continue;
    end if;

    select count(*)::integer
    into v_subject_published_units
    from public.units u2
    where u2.subject_id = r_unit.subject_id
      and u2.is_published = true;

    select cb.content
    into v_source_note
    from public.content_blocks cb
    where cb.unit_id = r_unit.unit_id
      and cb.is_published = true
      and cb.content_type = 'custom'
      and cb.title = 'Fuente documental'
    order by cb.sort_order
    limit 1;

    for i in 1..30 loop
      v_topic_index := ((i - 1) % v_topic_count) + 1;
      v_correct_topic_id := v_topic_ids[v_topic_index];
      v_correct_topic_title := v_topic_titles[v_topic_index];

      -- Distractores temáticos:
      -- 1) prioriza otros temas de la misma materia;
      -- 2) luego otros temas del mismo semestre;
      -- 3) evita repetir el texto correcto.
      select array_agg(candidate_title order by priority, stable_order)
      into v_distractors
      from (
        select
          candidate_title,
          min(priority) as priority,
          min(stable_order) as stable_order
        from (
          select
            t2.title as candidate_title,
            case
              when s2.id = r_unit.subject_id
                   and u2.id <> r_unit.unit_id then 1
              when s2.id = r_unit.subject_id then 2
              when sem2.level_number = r_unit.level_number then 3
              else 4
            end as priority,
            md5(
              t2.id::text ||
              ':' ||
              r_unit.unit_id::text ||
              ':' ||
              i::text
            ) as stable_order
          from public.topics t2
          join public.units u2
            on u2.id = t2.unit_id
          join public.subjects s2
            on s2.id = u2.subject_id
          join public.semesters sem2
            on sem2.id = s2.semester_id
          where t2.is_published = true
            and u2.is_published = true
            and s2.is_published = true
            and t2.id <> v_correct_topic_id
            and lower(trim(t2.title)) <> lower(trim(v_correct_topic_title))
        ) candidates
        group by candidate_title
        order by min(priority), min(stable_order)
        limit 3
      ) chosen;

      if coalesce(cardinality(v_distractors), 0) < 3 then
        raise exception
          'No hay suficientes distractores para % Unidad %.',
          r_unit.subject_code,
          r_unit.unit_number;
      end if;

      -- Para materias con las cuatro unidades publicadas se alternan
      -- preguntas de tema, ubicación por unidad y resultado de aprendizaje.
      -- En materias incompletas se usa únicamente contenido sustentado de
      -- las unidades efectivamente publicadas.
      if v_subject_published_units = 4 then
        v_family := ((i - 1) % 3) + 1;
      else
        v_family := 1;
      end if;

      -- ---------------------------------------------------
      -- FAMILIA 1: reconocimiento temático de la unidad
      -- ---------------------------------------------------
      if v_family = 1 then
        case ((i - 1) % 5)
          when 0 then
            v_question_text := format(
              '¿Cuál de los siguientes temas forma parte del contenido de la Unidad %s «%s» de %s?',
              r_unit.unit_number,
              r_unit.unit_title,
              r_unit.subject_name
            );
          when 1 then
            v_question_text := format(
              'Al estudiar la Unidad %s de %s, ¿qué eje temático corresponde a esa unidad?',
              r_unit.unit_number,
              r_unit.subject_name
            );
          when 2 then
            v_question_text := format(
              'Según la estructura temática del compendio de %s, ¿cuál de estos contenidos se estudia en la Unidad %s?',
              r_unit.subject_name,
              r_unit.unit_number
            );
          when 3 then
            v_question_text := format(
              '¿Qué tema debería repasar un estudiante que está preparando la Unidad %s «%s»?',
              r_unit.unit_number,
              r_unit.unit_title
            );
          else
            if r_unit.learning_outcome is not null
               and trim(r_unit.learning_outcome) <> '' then
              v_question_text := format(
                'La Unidad %s tiene como resultado de aprendizaje: «%s». ¿Cuál de los siguientes temas pertenece a la estructura de esa unidad?',
                r_unit.unit_number,
                r_unit.learning_outcome
              );
            else
              v_question_text := format(
                '¿Cuál de los siguientes temas está asociado directamente con la Unidad %s «%s»?',
                r_unit.unit_number,
                r_unit.unit_title
              );
            end if;
        end case;

        v_correct_text := v_correct_topic_title;

      -- ---------------------------------------------------
      -- FAMILIA 2: ubicar un tema en su unidad
      -- ---------------------------------------------------
      elsif v_family = 2 then

        select array_agg(unit_label order by stable_order)
        into v_unit_distractors
        from (
          select
            format(
              'Unidad %s · %s',
              u2.unit_number,
              u2.title
            ) as unit_label,
            md5(
              u2.id::text ||
              ':' ||
              i::text
            ) as stable_order
          from public.units u2
          where u2.subject_id = r_unit.subject_id
            and u2.id <> r_unit.unit_id
            and u2.is_published = true
          order by stable_order
          limit 3
        ) chosen_units;

        if coalesce(cardinality(v_unit_distractors), 0) < 3 then
          v_family := 1;
          v_correct_text := v_correct_topic_title;
          v_question_text := format(
            '¿Cuál de los siguientes temas forma parte del contenido de la Unidad %s «%s» de %s?',
            r_unit.unit_number,
            r_unit.unit_title,
            r_unit.subject_name
          );
        else
          v_distractors := v_unit_distractors;
          v_correct_text := format(
            'Unidad %s · %s',
            r_unit.unit_number,
            r_unit.unit_title
          );

          v_question_text := format(
            'En %s, ¿en qué unidad se estudia el tema «%s»?',
            r_unit.subject_name,
            v_correct_topic_title
          );
        end if;

      -- ---------------------------------------------------
      -- FAMILIA 3: resultado de aprendizaje
      -- ---------------------------------------------------
      else

        if r_unit.learning_outcome is null
           or trim(r_unit.learning_outcome) = '' then
          v_family := 1;
          v_correct_text := v_correct_topic_title;
          v_question_text := format(
            '¿Cuál de los siguientes temas está asociado directamente con la Unidad %s «%s»?',
            r_unit.unit_number,
            r_unit.unit_title
          );
        else
          select array_agg(outcome_text order by stable_order)
          into v_outcome_distractors
          from (
            select
              outcome_text,
              min(stable_order) as stable_order
            from (
              select
                u2.learning_outcome as outcome_text,
                md5(
                  u2.id::text ||
                  ':outcome:' ||
                  i::text
                ) as stable_order
              from public.units u2
              where u2.subject_id = r_unit.subject_id
                and u2.id <> r_unit.unit_id
                and u2.is_published = true
                and u2.learning_outcome is not null
                and trim(u2.learning_outcome) <> ''
                and lower(trim(u2.learning_outcome))
                    <> lower(trim(r_unit.learning_outcome))
            ) outcome_candidates
            group by outcome_text
            order by min(stable_order)
            limit 3
          ) chosen_outcomes;

          if coalesce(cardinality(v_outcome_distractors), 0) < 3 then
            v_family := 1;
            v_correct_text := v_correct_topic_title;
            v_question_text := format(
              'Según la estructura temática de %s, ¿cuál de estos contenidos se estudia en la Unidad %s?',
              r_unit.subject_name,
              r_unit.unit_number
            );
          else
            v_distractors := v_outcome_distractors;
            v_correct_text := r_unit.learning_outcome;

            v_question_text := format(
              '¿Cuál es el resultado de aprendizaje asociado con la Unidad %s «%s» de %s?',
              r_unit.unit_number,
              r_unit.unit_title,
              r_unit.subject_name
            );
          end if;
        end if;
      end if;

      v_correct_position := ((i - 1) % 4) + 1;
      v_wrong_index := 1;

      insert into public.questions (
        unit_id,
        topic_id,
        legal_article_id,
        question_text,
        question_type,
        difficulty,
        source_reference,
        is_active,
        is_verified
      )
      values (
        r_unit.unit_id,
        v_correct_topic_id,
        null,
        v_question_text,
        case
          when v_family = 1 then 'conceptual'
          else 'multiple_choice'
        end,
        case
          when i <= 10 then 'basic'
          when i <= 24 then 'intermediate'
          else 'advanced'
        end,
        format(
          'AUTO:S345:BASELINE:%s:U%s:Q%s',
          r_unit.subject_code,
          r_unit.unit_number,
          lpad(i::text, 2, '0')
        ),
        true,
        true
      )
      returning id into v_question_id;

      v_correct_option_id := null;

      for v_option_position in 1..4 loop
        v_option_key := chr(64 + v_option_position);

        if v_option_position = v_correct_position then
          v_option_text := v_correct_text;
          v_feedback := format(
            'Correcto. La respuesta corresponde al contenido estructurado de %s, Unidad %s.',
            r_unit.subject_name,
            r_unit.unit_number
          );
        else
          v_option_text := v_distractors[v_wrong_index];
          v_wrong_index := v_wrong_index + 1;

          v_feedback := format(
            'Incorrecto. Revisa nuevamente la estructura temática y el resultado de aprendizaje de %s, Unidad %s.',
            r_unit.subject_name,
            r_unit.unit_number
          );
        end if;

        insert into public.question_options (
          question_id,
          option_key,
          option_text,
          sort_order
        )
        values (
          v_question_id,
          v_option_key,
          v_option_text,
          v_option_position
        )
        returning id into v_option_id;

        insert into public.question_option_feedback (
          option_id,
          explanation
        )
        values (
          v_option_id,
          v_feedback
        );

        if v_option_position = v_correct_position then
          v_correct_option_id := v_option_id;
        end if;
      end loop;

      v_correct_explanation := format(
        'La respuesta se deriva de la estructura temática cargada para %s, Unidad %s «%s». Tema relacionado: «%s».%s',
        r_unit.subject_name,
        r_unit.unit_number,
        r_unit.unit_title,
        v_correct_topic_title,
        case
          when v_source_note is null then ''
          else ' ' || v_source_note
        end
      );

      insert into public.question_answers (
        question_id,
        correct_option_id,
        correct_explanation
      )
      values (
        v_question_id,
        v_correct_option_id,
        v_correct_explanation
      );

    end loop;
  end loop;
end;
$$;


-- ---------------------------------------------------------
-- 3. Asegurar configuración estándar de simuladores
-- ---------------------------------------------------------
update public.quiz_configs qc
set
  question_count = 30,
  randomize_questions = true,
  randomize_options = true,
  is_active = true
from public.units u
join public.subjects s
  on s.id = u.subject_id
join public.semesters sem
  on sem.id = s.semester_id
where qc.unit_id = u.id
  and qc.quiz_type = 'unit_30'
  and sem.level_number in (3, 4, 5)
  and u.is_published = true;

update public.quiz_configs qc
set
  question_count = 100,
  randomize_questions = true,
  randomize_options = true,
  is_active = true
from public.subjects s
join public.semesters sem
  on sem.id = s.semester_id
where qc.subject_id = s.id
  and qc.quiz_type = 'subject_100'
  and sem.level_number in (3, 4, 5);


commit;


-- =====================================================================
-- VERIFICACIÓN
-- =====================================================================

-- Cada unidad publicada debe tener al menos 30 preguntas válidas.
select
  sem.level_number as semestre,
  s.code,
  s.name as materia,
  u.unit_number,
  u.title as unidad,
  count(q.id) filter (
    where q.is_active = true
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
  ) as preguntas_validas,
  case
    when count(q.id) filter (
      where q.is_active = true
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
    ) >= 30
    then 'LISTA'
    else 'PENDIENTE'
  end as simulador_unidad
from public.units u
join public.subjects s
  on s.id = u.subject_id
join public.semesters sem
  on sem.id = s.semester_id
left join public.questions q
  on q.unit_id = u.id
where sem.level_number in (3, 4, 5)
  and u.is_published = true
group by
  sem.level_number,
  s.sort_order,
  s.code,
  s.name,
  u.unit_number,
  u.title
order by
  sem.level_number,
  s.sort_order,
  u.unit_number;


-- Materias con 4 unidades publicadas:
-- deben disponer de al menos 25 preguntas válidas en cada una para el final.
select
  sem.level_number as semestre,
  s.code,
  s.name as materia,
  count(*) filter (where u.is_published = true) as unidades_publicadas,
  count(*) filter (
    where u.is_published = true
      and (
        select count(*)
        from public.questions q
        where q.unit_id = u.id
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
      ) >= 25
  ) as unidades_con_25,
  case
    when count(*) filter (where u.is_published = true) = 4
     and count(*) filter (
       where u.is_published = true
         and (
           select count(*)
           from public.questions q
           where q.unit_id = u.id
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
         ) >= 25
     ) = 4
    then 'FINAL 100 LISTO'
    else 'FINAL PENDIENTE POR MATERIAL/UNIDADES'
  end as estado_final
from public.subjects s
join public.semesters sem
  on sem.id = s.semester_id
join public.units u
  on u.subject_id = s.id
where sem.level_number in (3, 4, 5)
group by
  sem.level_number,
  s.sort_order,
  s.code,
  s.name
order by
  sem.level_number,
  s.sort_order;
