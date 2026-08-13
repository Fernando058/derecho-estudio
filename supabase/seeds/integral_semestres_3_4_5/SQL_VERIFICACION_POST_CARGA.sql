-- VERIFICACIÓN POST-CARGA
-- 1) Semestres y materias
select sem.level_number, sem.name as semestre, count(s.id) as materias
from public.semesters sem
left join public.subjects s on s.semester_id=sem.id
where sem.level_number in (3,4,5)
group by sem.level_number,sem.name
order by sem.level_number;

-- 2) Estado por materia/unidades
select sem.level_number, s.code, s.name, count(u.id) as unidades,
       count(*) filter (where u.is_published) as unidades_publicadas
from public.subjects s
join public.semesters sem on sem.id=s.semester_id
left join public.units u on u.subject_id=s.id
where sem.level_number in (3,4,5)
group by sem.level_number,s.code,s.name
order by sem.level_number,s.sort_order;

-- 3) Temas y contenido por unidad
select sem.level_number, s.code, u.unit_number, u.title, u.is_published,
       count(distinct t.id) as temas,
       count(distinct cb.id) as contenidos
from public.units u
join public.subjects s on s.id=u.subject_id
join public.semesters sem on sem.id=s.semester_id
left join public.topics t on t.unit_id=u.id
left join public.content_blocks cb on cb.unit_id=u.id
where sem.level_number in (3,4,5)
group by sem.level_number,s.code,u.unit_number,u.title,u.is_published
order by sem.level_number,s.sort_order,u.unit_number;

-- 4) Banco exacto de cuarto semestre: esperado 150
select count(*) as banco_150_cargado
from public.questions
where source_reference like 'DATASET:S345:BANK150:%';

select count(*) filter (where is_verified) as verificadas_4_opciones, count(*) filter (where not is_verified) as pendientes_por_3_opciones from public.questions where source_reference like 'DATASET:S345:BANK150:%';

-- 5) Distribución de las 150 preguntas por materia y unidad
select s.code, u.unit_number, count(*) as preguntas
from public.questions q
join public.units u on u.id=q.unit_id
join public.subjects s on s.id=u.subject_id
where q.source_reference like 'DATASET:S345:BANK150:%'
group by s.code,u.unit_number
order by s.code,u.unit_number;

-- 6) Integridad del banco: 141 preguntas tienen 4 opciones; 9 preguntas de PEN1 poseen solo A-C en la fuente y quedan sin verificar
select count(*) as preguntas_fuera_del_estandar_4_opciones
from (
  select q.id,
         count(distinct qo.id) as opciones,
         count(distinct qa.question_id) as respuestas
  from public.questions q
  left join public.question_options qo on qo.question_id=q.id
  left join public.question_answers qa on qa.question_id=q.id
  where q.source_reference like 'DATASET:S345:BANK150:%'
  group by q.id
  having count(distinct qo.id) <> 4 or count(distinct qa.question_id) <> 1
) x;

-- 7) Dataset versionado
select dataset_key,version_label,checksum,applied_at
from public.academic_dataset_versions
where dataset_key='semestres-3-4-5-material-disponible';

-- 8) Fuentes legales cargadas/reutilizadas
select abbreviation,title,status
from public.legal_sources
where abbreviation in ('CRE','CC','CT','COGEP','COIP','LOGJCC','LSS','CCom','LC','COA','COFJ-N','CDIP','CNU','CG')
order by abbreviation;
