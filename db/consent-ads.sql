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
-- NULL identifica linha gravada ANTES desta coluna existir. O cron a traduz
-- para `CONSENT_GRANTED` — decisão deliberada e TEMPORÁRIA de 11/09/2026,
-- documentada em `paraDataManager` (`src/lib/adsConsent.ts`): essas linhas
-- foram coletadas com o banner no ar, parte dessas pessoas aceitou de fato, e
-- as demais são tráfego brasileiro, para quem o desenho novo concede por
-- padrão. Como o cron só olha 3 dias para trás (`WINDOW_DAYS`), três dias
-- depois do deploy não existe mais nenhuma linha nessa condição. Medido em
-- 11/09/2026, a regra alcança UMA linha: 1 em `cms.leads`, 0 em
-- `cms.whatsapp_clicks` (contagem em `paraDataManager`).

alter table cms.leads
  add column if not exists ads_consent text;

alter table cms.whatsapp_clicks
  add column if not exists ads_consent text;
