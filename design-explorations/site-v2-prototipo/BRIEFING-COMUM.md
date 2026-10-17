# Briefing comum — cenas da nova home Semog

## Por que isto existe
O Leandro (sócio da Semog, administradora de condomínios com 35 anos no Nordeste) reprovou a rodada anterior da home: "animações péssimas, como se fossem feitas correndo", "ligação entre cada imagem quebrada", "gradiente muda de forma abrupta", "comunidade muito ruim", "meu site que era para ser foda não ficou tão legal". A referência de nível dele é a apresentação "Semog Tech para Brascon": fonte em C:\Users\lekoc\semogapp\brascon\v2\src\ (leia a cena equivalente à sua antes de começar; em especial scenes/02-numero, 06-microdado, 09-ciclo, 12-plano e o core/). Prints dela em ...\scratchpad\brascon\*.png. O padrão é aquele — não "bom o suficiente".

## Liberdade criativa (palavra do Leandro)
"Não quero deixar você preso ao rebrand; quero liberdade para entregar o melhor possível dentro do branding, cor, traços, forma de comunicação." A direção de arte da sua cena é um PONTO DE PARTIDA, não um roteiro fechado: se você enxergar uma ideia mais forte, mais bonita ou mais memorável que comunique a mesma mensagem, faça — e explique no relatório. Inegociáveis: paleta e tokens Semog, Saira, site claro, canto reto/ponta reta, fatos verdadeiros, sem editorial, desempenho. O resto é seu para elevar.

## Onde você trabalha
Cada cena tem uma CÓPIA ISOLADA da fundação: ...\scratchpad\cena-NN\ (NN = sua cena). Trabalhe só nela. Leia README.md da cópia (contrato de cena). Você edita SOMENTE:
- src/scenes/NN-nome.js, src/scenes/NN-nome.css, src/sections/NN-nome.html
- assets novos com prefixo da cena (src/assets/NN-...)
NÃO edite core/, styles/, page.html, main.js nem conteudo.json. Se precisar de texto novo, coloque-o no próprio HTML da seção marcado com o comentário <!-- TEXTO-NOVO --> e liste no relatório; se precisar de algo no core, implemente local na cena e explique no relatório.
Comandos na sua pasta: `pnpm build`, `pnpm capturar` (prints em capturas/; aceita filtrar cena/navegador — veja o README). node_modules é junção compartilhada: não rode pnpm install.

## Regras de identidade (o build já barra parte delas)
- Site CLARO; branco domina. Marinho #1B2D70 (via tokens) para título/botão/um mundo escuro. Lavanda/cinza só como véu. Cor só por token.
- Saira (títulos, LEVES 300–500, ênfase por peso animado) + Barlow (corpo).
- Canto reto em tudo. "Ponta sempre reta, movimento no meio": curvas só em percursos; traços SVG com stroke-linecap butt e linejoin miter.
- Métrica áurea (tokens Fibonacci; splits 61,8/38,2). Respiro enorme.
- PROIBIDO editorial: eyebrow uppercase espaçado, numerais 01/02/03 decorativos, serif. Sem cards genéricos com sombra.
- Nada inventado: só fatos do conteudo.json ou deste briefing. Sem telas fictícias de app.

## Os 10 ingredientes de elegância (obrigatórios)
1. expo.out 0.9–1.3s nas entradas; expo.inOut 1.2–1.3s em aberturas por máscara; back.out só em elemento < 40px.
2. Texto entra por máscara (helpers do core), nunca fade/blur.
3. Ênfase = peso variável animado da Saira.
4. Títulos leves e grandes.
5. Scrub 0.6–0.8 nos pins.
6. No máximo 1 pin por cena, com UMA ideia; o resto é gatilho once.
7. Imagem: moldura abre por clip-path inset em 1.3s expo.inOut, imagem assenta de scale 1.3 em 1.8s, parallax interno ±5% (helpers do core).
8. Troca de mundo por FORMA (algo com significado cresce e vira o fundo), não por fade.
9. 3 papéis de cor + 1 destaque por tela.
10. Só transform/opacity/clip-path/font-variation; laços de canvas só quando visível (helpers do core); DPR limitado; HTML legível sem JS.
CONTINUIDADE: tudo que liga uma etapa a outra deve ser UM traço contínuo desenhado (stroke-dashoffset scrubbed ou path morph), nunca pedaços de conectores soltos. Movimentos encadeados (o fim de um é o começo do próximo), com overlap de ~30%, nunca "aparece, para, aparece".

## Verificação obrigatória antes de entregar
- `pnpm build` limpo; `pnpm capturar` da sua cena em Chromium e Firefox, 1440 e 390; zero erro de console; sem scroll horizontal.
- Para cena com pin/scrub: capture 5–6 quadros AO LONGO do pin (o script aceita? se não, escreva um script local na sua pasta, scripts/NN-quadros.mjs, que rola em passos e espera ≥1.2s por quadro). OLHE cada quadro.
- Grave um vídeo curto (Playwright recordVideo, 1440×900) rolando pela sua cena em velocidade de leitura e salve em capturas/NN-video.webm — é como o revisor vai julgar fluidez.
- Autocrítica honesta comparando com a cena equivalente da Brascon.

## Relatório final
Arquivos alterados, textos novos (<!-- TEXTO-NOVO -->), decisões de movimento (eases/durações/distâncias de pin), caminhos dos prints e do vídeo, autocrítica.
