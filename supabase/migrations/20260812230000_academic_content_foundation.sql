begin;

-- =========================================================
-- DERECHO ESTUDIO v0.4
-- Integridad académica + 20 unidades + configuración base
-- de simuladores.
-- =========================================================

-- =========================================================
-- 1. UNA MATERIA SOLO PUEDE TENER UNIDADES 1 A 4
-- =========================================================

alter table public.units
  drop constraint if exists units_unit_number_1_4;

alter table public.units
  add constraint units_unit_number_1_4
  check (unit_number between 1 and 4);


-- =========================================================
-- 2. UN SUBTEMA DEBE PERTENECER A LA MISMA UNIDAD
-- =========================================================

create or replace function private.validate_topic_parent()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_parent_unit_id uuid;
begin
  if new.parent_topic_id is null then
    return new;
  end if;

  if new.id is not null and new.parent_topic_id = new.id then
    raise exception 'Un tema no puede ser su propio tema padre';
  end if;

  select t.unit_id
  into v_parent_unit_id
  from public.topics t
  where t.id = new.parent_topic_id;

  if v_parent_unit_id is null then
    raise exception 'El tema padre seleccionado no existe';
  end if;

  if v_parent_unit_id <> new.unit_id then
    raise exception 'El tema padre debe pertenecer a la misma unidad';
  end if;

  return new;
end;
$$;


drop trigger if exists trg_validate_topic_parent
on public.topics;

create trigger trg_validate_topic_parent
before insert or update of unit_id, parent_topic_id
on public.topics
for each row
execute function private.validate_topic_parent();


-- =========================================================
-- 3. UN BLOQUE ASOCIADO A UN TEMA DEBE USAR LA MISMA UNIDAD
-- =========================================================

create or replace function private.validate_content_block_topic()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_topic_unit_id uuid;
begin
  if new.topic_id is null then
    return new;
  end if;

  select t.unit_id
  into v_topic_unit_id
  from public.topics t
  where t.id = new.topic_id;

  if v_topic_unit_id is null then
    raise exception 'El tema seleccionado no existe';
  end if;

  if v_topic_unit_id <> new.unit_id then
    raise exception 'El tema debe pertenecer a la misma unidad del contenido';
  end if;

  return new;
end;
$$;


drop trigger if exists trg_validate_content_block_topic
on public.content_blocks;

create trigger trg_validate_content_block_topic
before insert or update of unit_id, topic_id
on public.content_blocks
for each row
execute function private.validate_content_block_topic();


-- =========================================================
-- 4. SEMILLA DE LAS 20 UNIDADES DE CUARTO SEMESTRE
--
-- Los títulos siguen los compendios aportados por el usuario.
-- Cuando el compendio no presenta un título unitario explícito
-- (LAB2 Unidad 3), se utiliza un título operativo sintetizado
-- a partir de los temas que la integran.
-- =========================================================

with unit_seed(
  subject_code,
  unit_number,
  title,
  slug,
  learning_outcome
) as (
  values
    -- DERECHO INTERNACIONAL PRIVADO
    ('DIP', 1,
      'Introducción al Derecho Internacional Privado',
      'introduccion-al-derecho-internacional-privado',
      'Comprender los diferentes conceptos y evolución histórica del Derecho Internacional Privado e identificar la estructura de sus fuentes que han permitido el desarrollo de las normas convencionales desarrolladas en América Latina a través de los organismos regionales especializados.'
    ),
    ('DIP', 2,
      'Estructura de las normas de Derecho Internacional Privado',
      'estructura-de-las-normas-de-derecho-internacional-privado',
      'Comprender como funcionan las normas en el Derecho Internacional Privado y conocer su estructura formativa.'
    ),
    ('DIP', 3,
      'Jurisdicción y competencia en el Derecho Internacional Privado',
      'jurisdiccion-y-competencia-en-el-derecho-internacional-privado',
      'Reconocer las situaciones de competencia judicial internacional y los fenómenos jurídicos a los que se exponen los tribunales y jueces al momento de aplicar el Derecho Internacional Privado.'
    ),
    ('DIP', 4,
      'Aplicación del Derecho Internacional Privado',
      'aplicacion-del-derecho-internacional-privado',
      'Ejercitar la capacidad de interpretar críticamente la regulación de los conflictos normativos internos y externos propios del Derecho Internacional Privado.'
    ),

    -- DERECHO PROCESAL CONSTITUCIONAL I
    ('DPC1', 1,
      'Teoría General del Proceso',
      'teoria-general-del-proceso',
      'Analizar la doctrina y principios procesales y su relación con el proceso constitucional.'
    ),
    ('DPC1', 2,
      'Garantías jurisdiccionales',
      'garantias-jurisdiccionales',
      'Interpretar los ámbitos en los que actúan las garantías jurisdiccionales para evitar la vulneración de derechos.'
    ),
    ('DPC1', 3,
      'Garantías jurisdiccionales de los derechos constitucionales',
      'garantias-jurisdiccionales-de-los-derechos-constitucionales',
      'Solucionar los conflictos de vulneración de derechos a partir del trámite de las garantías jurisdiccionales.'
    ),
    ('DPC1', 4,
      'Control de Constitucionalidad',
      'control-de-constitucionalidad',
      'Identificar las formas de control de constitucionalidad e interpretar las maneras de resolver conflictos de constitucionalidad.'
    ),

    -- DERECHO LABORAL II
    ('LAB2', 1,
      'Licencias y sanciones, prescripción, medios alternativos de solución de conflictos y procedimientos judiciales',
      'licencias-sanciones-prescripcion-solucion-de-conflictos-y-procedimientos',
      'Conocer las figuras licencias y sanciones, prescripción, medios alternativos de solución de conflictos, procedimientos judiciales, actor y demandado en demandas laborales.'
    ),
    ('LAB2', 2,
      'Formas de terminación del contrato individual de trabajo, prueba y excepciones previas',
      'terminacion-del-contrato-prueba-y-excepciones-previas',
      'Diseñar formas de terminación del contrato individual de trabajo y analizar las pruebas y excepciones previas en materia laboral.'
    ),
    ('LAB2', 3,
      'Fondo de reserva, desahucio, despido intempestivo y conclusión del proceso',
      'fondo-de-reserva-desahucio-despido-y-conclusion-del-proceso',
      null
    ),
    ('LAB2', 4,
      'Jubilación, contrato colectivo, alegatos y sentencia',
      'jubilacion-contrato-colectivo-alegatos-y-sentencia',
      'Demostrar conocimientos y experticia en temas de jubilación, contrato colectivo y alegatos y sentencia en derecho laboral.'
    ),

    -- DERECHO PENAL I
    ('PEN1', 1,
      'Principio de legalidad y fuente del Derecho Penal',
      'principio-de-legalidad-y-fuente-del-derecho-penal',
      'Distinguir las fuentes generales del derecho penal.'
    ),
    ('PEN1', 2,
      'Iter criminis',
      'iter-criminis',
      'Diferenciar las fases del iter criminis.'
    ),
    ('PEN1', 3,
      'Teoría del delito',
      'teoria-del-delito',
      'Comprender las categorías de la teoría del delito.'
    ),
    ('PEN1', 4,
      'Teorías de la pena',
      'teorias-de-la-pena',
      'Comprender las teorías sobre la finalidad de las penas.'
    ),

    -- DERECHO CIVIL III
    ('CIV3', 1,
      'De la Sucesión por Causa de Muerte',
      'de-la-sucesion-por-causa-de-muerte',
      'Identificar las reglas que deben aplicarse frente a los fenómenos de los procesos intestados y testados.'
    ),
    ('CIV3', 2,
      'Del Testamento y de las Asignaciones Testamentarias',
      'del-testamento-y-de-las-asignaciones-testamentarias',
      null
    ),
    ('CIV3', 3,
      'De la Apertura de la Sucesión',
      'de-la-apertura-de-la-sucesion',
      'Reconocer las reglas relativas a la herencia, identificar los ejecutores testamentarios e interpretar la aceptación y el repudio de la herencia.'
    ),
    ('CIV3', 4,
      'De las Donaciones entre Vivos',
      'de-las-donaciones-entre-vivos',
      'Identificar las habilidades e inhabilidades para donar, reconocer las capacidades e incapacidades para recibir donaciones y distinguir las clases de donaciones.'
    )
)
insert into public.units (
  subject_id,
  unit_number,
  title,
  slug,
  learning_outcome,
  is_published,
  sort_order
)
select
  s.id,
  us.unit_number,
  us.title,
  us.slug,
  us.learning_outcome,
  true,
  us.unit_number
from unit_seed us
join public.subjects s
  on s.code = us.subject_code
where not exists (
  select 1
  from public.units u
  where u.subject_id = s.id
    and u.unit_number = us.unit_number
);


-- =========================================================
-- 5. CONFIGURACIÓN DE SIMULADORES DE UNIDAD
-- REGLA FIJA: 30 PREGUNTAS EXCLUSIVAS DE ESA UNIDAD
-- =========================================================

insert into public.quiz_configs (
  subject_id,
  unit_id,
  quiz_type,
  question_count,
  time_limit_minutes,
  randomize_questions,
  randomize_options,
  is_active
)
select
  u.subject_id,
  u.id,
  'unit_30',
  30,
  30,
  true,
  true,
  true
from public.units u
join public.subjects s
  on s.id = u.subject_id
where s.code in ('DIP', 'DPC1', 'LAB2', 'PEN1', 'CIV3')
  and not exists (
    select 1
    from public.quiz_configs qc
    where qc.quiz_type = 'unit_30'
      and qc.unit_id = u.id
  );


-- =========================================================
-- 6. SIMULADOR FINAL POR MATERIA
-- REGLA FIJA: 100 PREGUNTAS DE LAS CUATRO UNIDADES
-- =========================================================

insert into public.quiz_configs (
  subject_id,
  unit_id,
  quiz_type,
  question_count,
  time_limit_minutes,
  randomize_questions,
  randomize_options,
  is_active
)
select
  s.id,
  null,
  'subject_100',
  100,
  100,
  true,
  true,
  true
from public.subjects s
where s.code in ('DIP', 'DPC1', 'LAB2', 'PEN1', 'CIV3')
  and not exists (
    select 1
    from public.quiz_configs qc
    where qc.quiz_type = 'subject_100'
      and qc.subject_id = s.id
  );


-- =========================================================
-- 7. DISTRIBUCIÓN INICIAL DEL SIMULADOR FINAL
-- 25 PREGUNTAS POR CADA UNA DE LAS CUATRO UNIDADES
-- =========================================================

insert into public.quiz_unit_distribution (
  quiz_config_id,
  unit_id,
  question_count
)
select
  qc.id,
  u.id,
  25
from public.quiz_configs qc
join public.units u
  on u.subject_id = qc.subject_id
where qc.quiz_type = 'subject_100'
  and u.unit_number between 1 and 4
  and not exists (
    select 1
    from public.quiz_unit_distribution qud
    where qud.quiz_config_id = qc.id
      and qud.unit_id = u.id
  );

commit;
