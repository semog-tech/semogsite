-- Inverso de `2026-11-25-ads-conversoes-rd-postgres.sql`. Rode como `postgres`,
-- depois de reverter o código do cron (ou de esvaziar as variáveis
-- GOOGLE_ADS_RD_*) e ANTES do `.down` do semogapp
-- (`db/2026-11-25-crm-rdstation-marcos.down.sql`, lá).
--
-- Perde o registro do que já subiu ao Ads: se o código voltar depois, o
-- `transactionId` estável (`rd-proposta-<id>` / `rd-ganho-<id>`) ainda impede
-- conversão dobrada no Google. Antes de aplicar, guarde uma cópia:
--   select * from cms.ads_conversoes_rd;
begin;
do $$ begin
  if current_user <> 'postgres' then
    raise exception 'Rode como postgres (conectado: %)', current_user;
  end if;
end $$;

drop function if exists cms.crm_rdstation_marcos_obter();
drop table if exists cms.ads_conversoes_rd;
commit;
