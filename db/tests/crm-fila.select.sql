-- SELECT sintético; nenhuma leitura/escrita de propostas reais.
-- Valores importados das constantes TS e backoffCrm(3); esperado: 35, true, NULL.
with configuracao(teto,espera_ms,lease_ms,backoff_ms) as(values (5,1800000,300000,14400000)),
casos(nome,crm_status,crm_provider,crm_deal_id,exact_lead_id,crm_attempts,exact_attempts,created_at,crm_travado_ate,crm_reconciliar_em,crm_proxima_tentativa_em,esperado_rd,esperado_exact) as(values
('novo','pendente',null::text,null::text,null::bigint,0,0,now() - interval '1 hour',null::timestamptz,null::timestamptz,now() - interval '1 minute',true,true),
('teto5','pendente',null::text,null::text,null::bigint,5,0,now() - interval '1 hour',null::timestamptz,null::timestamptz,now() - interval '1 minute',false,false),
('historicoExact5','pendente',null::text,null::text,null::bigint,0,5,now() - interval '1 hour',null::timestamptz,null::timestamptz,now() - interval '1 minute',true,false),
('leaseOcupado','pendente',null::text,null::text,null::bigint,0,0,now() - interval '1 hour',now() + interval '1 minute',null::timestamptz,now() - interval '1 minute',false,false),
('retryFuturo','pendente',null::text,null::text,null::bigint,0,0,now() - interval '1 hour',null::timestamptz,null::timestamptz,now() + interval '1 hour',false,false),
('antigoSemConciliacao','pendente',null::text,null::text,null::bigint,0,0,now() - interval '49 hours',null::timestamptz,null::timestamptz,now() - interval '1 minute',false,false),
('conciliacaoDepois48h','pendente',null::text,'card',null::bigint,5,0,now() - interval '49 hours',null::timestamptz,now() - interval '1 minute',now() - interval '1 minute',true,false),
('conciliacaoLeaseOcupado','pendente',null::text,'card',null::bigint,5,0,now() - interval '49 hours',now() + interval '1 minute',now() - interval '1 minute',now() - interval '1 minute',false,false),
('outroProvedor','pendente','exact',null::text,null::bigint,0,0,now() - interval '1 hour',null::timestamptz,null::timestamptz,now() - interval '1 minute',false,true),
('conciliacaoFutura','pendente',null::text,'card',null::bigint,0,0,now() - interval '1 hour',null::timestamptz,now() + interval '1 hour',now() - interval '1 minute',false,false),
('cardConfirmado','pendente',null::text,'card',null::bigint,0,0,now() - interval '1 hour',null::timestamptz,null::timestamptz,now() - interval '1 minute',false,false),
('backoffNaConciliacao','pendente',null::text,'card',null::bigint,0,0,now() - interval '1 hour',null::timestamptz,now() - interval '1 minute',now() + interval '1 hour',false,false),
('duplicadoTerminal','duplicado',null::text,null::text,null::bigint,0,0,now() - interval '1 hour',null::timestamptz,now() - interval '1 minute',now() - interval '1 minute',false,false),
('esgotadoTerminal','esgotado',null::text,null::text,null::bigint,0,0,now() - interval '1 hour',null::timestamptz,now() - interval '1 minute',now() - interval '1 minute',false,false)),
avaliacoes as (select nome || ':' || provedor as nome,coalesce((crm_status not in ('duplicado', 'esgotado')
    and (crm_provider is null or crm_provider = provedor)
    and (crm_travado_ate is null or crm_travado_ate < now())
    and crm_proxima_tentativa_em <= now()
    and ((provedor = 'rdstation' and crm_reconciliar_em <= now()) or (
      crm_deal_id is null and exact_lead_id is null
      and crm_attempts < teto
      and (provedor <> 'exact' or exact_attempts < teto)
      and created_at > now() - interval '48 hours'))),false) as resultado,case when provedor='rdstation' then esperado_rd else esperado_exact end as esperado from casos cross join configuracao cross join (values ('rdstation'),('exact')) as provedores(provedor)),
operacoes as (select 'M4_29_59' as nome, (not(now() - interval '29 minutes 59 seconds' + espera_ms * interval '1 millisecond' <= now())) as resultado, true as esperado from configuracao
union all select 'M4_30_00' as nome, (now() - interval '30 minutes' + espera_ms * interval '1 millisecond' <= now()) as resultado, true as esperado from configuracao
union all select 'M5_4' as nome, (4 < teto) as resultado, true as esperado from configuracao
union all select 'M5_5' as nome, (not(5 < teto)) as resultado, true as esperado from configuracao
union all select 'M9_agendamento' as nome, (now() + espera_ms * interval '1 millisecond' = now() + interval '30 minutes') as resultado, true as esperado from configuracao
union all select 'M10_lease' as nome, (lease_ms * interval '1 millisecond' = interval '5 minutes') as resultado, true as esperado from configuracao
union all select 'M25_backoff' as nome, (backoff_ms * interval '1 millisecond' = interval '4 hours') as resultado, true as esperado from configuracao),
todos as(select * from avaliacoes union all select * from operacoes)
select count(*) as cenarios, bool_and(resultado=esperado) as todos_passaram,jsonb_agg(jsonb_build_object('caso',nome,'resultado',resultado,'esperado',esperado)) filter(where resultado<>esperado) as falhas from todos;
