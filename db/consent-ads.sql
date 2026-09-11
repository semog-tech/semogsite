-- Consentimento de publicidade do visitante, gravado junto com o lead e com o
-- clique no WhatsApp, para subir junto da conversão no Google Ads.
--
-- Até 11/09/2026 o cron `upload-ads-conversions` mandava `adUserData` e
-- `adPersonalization` como `CONSENT_GRANTED` fixo no código — uma afirmação
-- que o site não tinha como sustentar. O valor agora é decidido no servidor no
-- momento da captura (ver `src/lib/adsConsent.ts`): escolha explícita no
-- cookie `semog-consent` se houver, senão a região da requisição (EEA, Reino
-- Unido e Suíça negam; o resto concede).
--
-- `text` sem enum/CHECK pelo mesmo motivo de `cms.leads.form`: um valor novo
-- não exigiria migration. Os valores usados hoje são 'granted' e 'denied'.
--
-- NULL é estado legítimo e significa "não sabemos": são as linhas gravadas
-- antes desta coluna existir. O cron traduz NULL para
-- `CONSENT_STATUS_UNSPECIFIED`, não para concedido. Como ele só olha 3 dias
-- para trás (`WINDOW_DAYS`), essa população se extingue sozinha.

alter table cms.leads
  add column if not exists ads_consent text;

alter table cms.whatsapp_clicks
  add column if not exists ads_consent text;
