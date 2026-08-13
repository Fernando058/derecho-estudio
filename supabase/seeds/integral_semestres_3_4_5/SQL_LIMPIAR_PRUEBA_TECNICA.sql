-- ELIMINA EXCLUSIVAMENTE LAS PREGUNTAS TÉCNICAS TEMPORALES
begin;
delete from public.questions where source_reference like 'TECH_TEST:PEN1:%';
commit;
select count(*) as preguntas_tecnicas_restantes from public.questions where source_reference like 'TECH_TEST:PEN1:%';
