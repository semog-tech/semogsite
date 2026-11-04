-- NÃO APLICADO. Após crm-provider/crm-config-site, antes do deploy das conversões.
-- Colunas exclusivas; não altera crm_*, exact_* nem cria negociações.
begin;
do $$
begin
  if current_user <> 'cms_user' then
    raise exception 'Execute esta migração conectado como cms_user (current_user: %).', current_user;
  end if;
end;
$$;
alter table cms.leads
  add column rd_marketing_payload jsonb,
  add column rd_marketing_status text not null default 'pendente'
    check (rd_marketing_status in ('pendente', 'enviando', 'enviado', 'incerto', 'erro', 'esgotado')),
  add column rd_marketing_attempts smallint not null default 0
    check (rd_marketing_attempts between 0 and 2),
  add column rd_marketing_proxima_tentativa_em timestamptz not null default now(),
  add column rd_marketing_event_uuid text,
  add column rd_marketing_error text,
  add column rd_marketing_enviado_em timestamptz;

comment on column cms.leads.rd_marketing_payload is
  'Snapshot sem credencial, capturado com o INSERT apenas com API Key configurada; NULL exclui histórico e recusas, e data->>duplicaDe is null exclui duplicados no predicado da fila.';
comment on column cms.leads.rd_marketing_attempts is
  'Reserva atômica antes do HTTP; máximo 2 POSTs por lead, só 1 normalmente, retry incerto após 30 min (decisão do dono).';
comment on column cms.leads.rd_marketing_proxima_tentativa_em is
  'Também protege o POST em andamento por 30 min; worker encerrado pode consumir a segunda e última tentativa.';
comment on column cms.leads.rd_marketing_error is
  'Somente código técnico fixo, nunca corpo de resposta, dados do lead ou URL com API Key.';

create index leads_rd_marketing_fila_idx on cms.leads (rd_marketing_proxima_tentativa_em, id)
  where rd_marketing_payload is not null
    and rd_marketing_status in ('pendente', 'incerto', 'enviando')
    and rd_marketing_attempts < 2;
commit;
