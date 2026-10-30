-- Inverso de `2026-10-30-site-api-0-cms-user.sql`. Rode como `cms_user`, e só
-- DEPOIS de `2026-10-30-site-api.down.sql` — antes disso as funções de
-- `site_api` ainda existiriam e passariam a falhar com 42501.

do $$ begin
  if current_user <> 'cms_user' then
    raise exception 'Rode como cms_user (conectado: %)', current_user;
  end if;
end $$;

revoke update (
  exact_lead_id, exact_error, exact_attempts,
  desfecho, desfecho_motivo, desfecho_observacao, desfecho_em,
  uploaded_to_ads
) on cms.leads from postgres;
revoke select, insert on cms.leads from postgres;

revoke insert on cms.qr_scans from postgres;
