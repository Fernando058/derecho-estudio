begin;

-- =========================================================
-- DERECHO ESTUDIO v0.3
-- Integridad jerárquica de documentos
-- =========================================================

alter table public.documents
  add constraint documents_start_page_positive
  check (start_page is null or start_page >= 1);

alter table public.documents
  add constraint documents_end_page_positive
  check (end_page is null or end_page >= 1);

alter table public.documents
  add constraint documents_page_range_valid
  check (
    start_page is null
    or end_page is null
    or end_page >= start_page
  );

create or replace function private.validate_document_hierarchy()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_unit_subject_id uuid;
  v_topic_unit_id uuid;
begin
  if new.topic_id is not null then
    select t.unit_id
      into v_topic_unit_id
    from public.topics t
    where t.id = new.topic_id;

    if v_topic_unit_id is null then
      raise exception 'El tema seleccionado no existe';
    end if;

    if new.unit_id is null then
      new.unit_id := v_topic_unit_id;
    elsif new.unit_id <> v_topic_unit_id then
      raise exception 'El tema seleccionado no pertenece a la unidad indicada';
    end if;
  end if;

  if new.unit_id is not null then
    select u.subject_id
      into v_unit_subject_id
    from public.units u
    where u.id = new.unit_id;

    if v_unit_subject_id is null then
      raise exception 'La unidad seleccionada no existe';
    end if;

    if new.subject_id is null then
      new.subject_id := v_unit_subject_id;
    elsif new.subject_id <> v_unit_subject_id then
      raise exception 'La unidad seleccionada no pertenece a la materia indicada';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_validate_document_hierarchy
before insert or update
on public.documents
for each row
execute function private.validate_document_hierarchy();

commit;
