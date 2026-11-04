-- Preparado antes do avanço. Reverter código antes de remover a fachada.
begin;
drop function if exists cms.crm_rdstation_config_obter();
commit;
