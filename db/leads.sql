-- Tabela `leads` — armazena as submissões de formulário fora do Payload.
-- Fica no schema `cms` (o mesmo do resto dos dados, acessível ao `cms_user`
-- via DATABASE_URI). Como o PostgREST do Supabase só expõe o schema `public`
-- à API pública (anon), uma tabela em `cms` é privada por construção — sem
-- necessidade de RLS. O runtime (submit-form, cron do Ads) lê/escreve via
-- `pg` sobre o DATABASE_URI, sempre qualificando `cms.leads`.

create table if not exists cms.leads (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  -- 'contato' | 'proposta' | 'experience' (lista canônica: `FormType` em
  -- src/lib/forms.ts). `experience` é inscrição no Semog Experience e fica
  -- DE PROPÓSITO fora das allow-lists dos dois crons — o do CRM
  -- (src/app/api/cron/push-exact-leads) e o do Google Ads
  -- (src/app/api/cron/upload-ads-conversions): evento de relacionamento não
  -- é captação comercial. Coluna é `text` sem enum/CHECK, então um formulário
  -- novo não exige migration — o preço é este comentário precisar ser mantido.
  form            text not null,
  data            jsonb not null,         -- todos os campos do formulário {campo: valor}
  gclid           text,                   -- extraído p/ o cron do Google Ads
  email           text,
  uploaded_to_ads boolean not null default false
);

create index if not exists leads_created_at_idx on cms.leads (created_at);

-- Migração do histórico de `cms.form_submissions` (schema do Payload) para
-- `cms.leads`. Guardada por `where not exists (...)` para ser idempotente:
-- se `cms.leads` já tiver qualquer linha, não faz nada (evita duplicar se
-- rodar de novo). `submissionData` do Payload é a tabela filha relacional
-- `form_submissions_submission_data` (field/value/_parent_id), então o pivot
-- é um `jsonb_object_agg`. `gclid` e `email` saem para colunas próprias
-- (o cron filtra por `gclid`); o nome do campo de gclid é o rótulo literal
-- do form-builder ("origem — gclid (Google Ads)").
insert into cms.leads (created_at, form, data, gclid, email)
select
  fs.created_at,
  lower(f.title) as form,
  coalesce(
    jsonb_object_agg(sd.field, sd.value) filter (where sd.field is not null),
    '{}'::jsonb
  ) as data,
  max(sd.value) filter (where sd.field = 'origem — gclid (Google Ads)') as gclid,
  max(sd.value) filter (where sd.field = 'email') as email
from cms.form_submissions fs
join cms.forms f on f.id = fs.form_id
left join cms.form_submissions_submission_data sd on sd._parent_id = fs.id
where not exists (select 1 from cms.leads)
group by fs.id, fs.created_at, f.title;
