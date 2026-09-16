# Datas de expansão confirmadas

Fonte: informação fornecida por Leandro nesta sessão, em 10/09/2026.

| Local | Ano confirmado |
| --- | --- |
| Paraíba, com chegada a João Pessoa | 2004 |
| Pará, com chegada a Belém | 2019 |
| Campina Grande | 2025 |

Campina Grande foi inicialmente informada como 2024 e corrigida explicitamente
para 2025 na mensagem seguinte. A data válida é 2025. Não agrupar sua abertura
com a chegada a João Pessoa em 2004.

Esta confirmação substitui 2010 para a Paraíba e 2018 para o Pará na linha do
tempo anterior. `_reference/` é um arquivo congelado e não deve ser tratado
como fonte atual para esses anos. A referência antiga identificava datas da
cronologia como estimativas; não restaurá-las por fidelidade ao HTML original.

Aplicação: `content/pages/semog.ts` no site atual e narrativa de presença em
`src/components/prototype/AboutSemog.tsx` na nova prévia. Teste de regressão em
`tests/int/semog-history.int.spec.ts`.

## Publicação e verificação em 10/09/2026

Publicação direta autorizada pelo pedido de corrigir o site no ar. Exportação
isolada do commit de produção `94e92477e8219a48d7f26440f8e112ebafb901c8`,
alterando apenas `content/pages/semog.ts`. Protótipo e configuração local não
foram incluídos. Nenhum commit ou push foi realizado.

- Deployment novo: `dpl_5V5tEv1TyNcf1XetwK8ULfXVwQCe`, build READY e promoção concluída.
- Deployment anterior: `dpl_GZ81ueEhd5QV1zyGuFUTt7vDvDpt`.
- URL verificada: `https://www.semog.com.br/semog`, resposta 200.
- Chromium e verificação independente Firefox confirmaram os três anos nos
  cartões correspondentes, incluindo Campina Grande em 2025, e rolagem da linha
  do tempo. Sem erro de JavaScript ou aviso de chave duplicada relacionado à mudança.
- Firefox ainda apresenta excesso horizontal de 16 px preexistente no site
  original. Não é regressão desta alteração de conteúdo.

Os cartões de Belém e Campina Grande têm IDs próprios, pois compartilham os anos
2019 e 2025 com outros marcos. Teste de regressão verifica datas e chaves únicas.
Checks locais: Biome CI (238 arquivos), TypeScript, gate Server Actions
(176 arquivos), integração (205 testes em 33 arquivos) e build (29 páginas)
passaram. Após adicionar IDs únicos, teste focal e build foram repetidos com sucesso.
Avisos anteriores de Sentry e metadataBase permanecem.

Antes de uma futura publicação via Git, incluir a alteração local do conteúdo:
o remoto ainda está no commit-base anterior e pode restaurar datas antigas.
