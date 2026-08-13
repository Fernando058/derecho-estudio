-- PRUEBA TÉCNICA TEMPORAL DEL MOTOR DE SIMULADORES
-- Crea 30 preguntas verificadas en cada unidad de PEN1 para habilitar
-- tanto simuladores unitarios (30) como el final (100=25x4).
-- NO es contenido académico. Ejecute el script de limpieza al terminar.
begin;

delete from public.questions
where source_reference like 'TECH_TEST:PEN1:%';

do $$
declare
  r record;
  i integer;
  qid uuid;
  oa uuid;
  ob uuid;
  oc uuid;
  od uuid;
begin
  for r in
    select u.id as unit_id, u.unit_number
    from public.units u
    join public.subjects s on s.id=u.subject_id
    where s.code='PEN1'
      and u.unit_number between 1 and 4
    order by u.unit_number
  loop
    for i in 1..30 loop
      insert into public.questions (
        unit_id, topic_id, legal_article_id,
        question_text, question_type, difficulty,
        source_reference, is_active, is_verified
      ) values (
        r.unit_id, null, null,
        format('PRUEBA TÉCNICA U%s-%s: seleccione la opción B para validar el motor. Esta pregunta debe eliminarse después de las pruebas.', r.unit_number, lpad(i::text,2,'0')),
        'multiple_choice','basic',
        format('TECH_TEST:PEN1:U%s:Q%s',r.unit_number,lpad(i::text,2,'0')),
        true,true
      ) returning id into qid;

      insert into public.question_options(question_id,option_key,option_text,sort_order)
      values(qid,'A','Opción técnica A',1) returning id into oa;
      insert into public.question_options(question_id,option_key,option_text,sort_order)
      values(qid,'B','Opción técnica B — correcta',2) returning id into ob;
      insert into public.question_options(question_id,option_key,option_text,sort_order)
      values(qid,'C','Opción técnica C',3) returning id into oc;
      insert into public.question_options(question_id,option_key,option_text,sort_order)
      values(qid,'D','Opción técnica D',4) returning id into od;

      insert into public.question_answers(question_id,correct_option_id,correct_explanation)
      values(qid,ob,'Pregunta temporal de validación: la respuesta correcta es B.');

      insert into public.question_option_feedback(option_id,explanation) values
        (oa,'Prueba técnica: A es incorrecta.'),
        (ob,'Prueba técnica: B es correcta.'),
        (oc,'Prueba técnica: C es incorrecta.'),
        (od,'Prueba técnica: D es incorrecta.');
    end loop;
  end loop;
end;
$$;

commit;

select s.code, u.unit_number, count(*) as preguntas_tecnicas
from public.questions q
join public.units u on u.id=q.unit_id
join public.subjects s on s.id=u.subject_id
where q.source_reference like 'TECH_TEST:PEN1:%'
group by s.code,u.unit_number
order by u.unit_number;
