-- Verificación resumida del banco base generado.

select
  sem.level_number as semestre,
  count(distinct s.id) as materias,
  count(distinct u.id) filter (where u.is_published) as unidades_publicadas,
  count(q.id) filter (
    where q.source_reference like 'AUTO:S345:BASELINE:%'
  ) as preguntas_generadas
from public.semesters sem
join public.subjects s
  on s.semester_id = sem.id
join public.units u
  on u.subject_id = s.id
left join public.questions q
  on q.unit_id = u.id
where sem.level_number in (3,4,5)
group by sem.level_number
order by sem.level_number;

select
  count(*) as total_preguntas_baseline
from public.questions
where source_reference like 'AUTO:S345:BASELINE:%';

select
  count(*) as unidades_publicadas_con_menos_de_30
from public.units u
join public.subjects s on s.id = u.subject_id
join public.semesters sem on sem.id = s.semester_id
where sem.level_number in (3,4,5)
  and u.is_published = true
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
  ) < 30;
