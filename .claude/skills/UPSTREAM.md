# Skills de terceiros nesta pasta

As pastas abaixo são cópias sem alteração de um repositório externo. Não edite os arquivos
delas: para atualizar, copie de novo a pasta inteira do upstream e troque o commit aqui.

| Pasta | Origem | Commit | Licença |
| --- | --- | --- | --- |
| `vercel-react-best-practices/` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), `skills/react-best-practices/` | `5a37a6329fbad3666c3207392a6a7c0110e92efb` (20/11/2026) | MIT (frontmatter do `SKILL.md` e seção "License" do README do repositório; o repositório não tem arquivo `LICENSE`) |
| `vercel-composition-patterns/` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), `skills/composition-patterns/` | `5a37a6329fbad3666c3207392a6a7c0110e92efb` (20/11/2026) | MIT (idem) |

O nome da pasta segue o `name` do frontmatter de cada `SKILL.md`, não o nome da pasta no
upstream. O Codex chega a elas pelos ponteiros em `.agents/skills/<nome>/SKILL.md`.

Ficaram de fora do mesmo repositório: `react-native-skills` (o site não é React Native),
`vercel-cli-with-tokens` e `deploy-to-vercel` (o deploy de produção é pelo Deploy Hook, ver
`docs/DEPLOY.md`), e as demais, que não tratam de Next.js.
