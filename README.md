# Semog · Site institucional

Site institucional da **Semog Administradora de Condomínios**, líder do Nordeste desde 1991.

Fase atual: **migração para Next.js 16 + Payload 3** (Postgres + Storage no Supabase), na Vercel.

## Como rodar localmente

Veja **[`docs/DEV.md`](docs/DEV.md)** para pré-requisitos, configuração do `.env` (Supabase
Postgres + Storage) e os comandos de desenvolvimento (`pnpm dev`, `pnpm check`, migrations).

O site estático original — usado como referência visual e de conteúdo para a migração — está
congelado em [`_reference/`](_reference/) e não deve ser editado.

## Páginas (site de referência em `_reference/`)

| Arquivo | Página |
|---|---|
| `index.html` | Home |
| `semog.html` | A Semog (sobre) |
| `solucoes.html` | Soluções |
| `administracao-de-condominios.html` | Serviço: administração de condomínios |
| `garante.html` | Semog Garante |
| `incorporadoras.html` | Incorporadoras |
| `blog.html` | Blog |
| `contato.html` | Contato |
| `proposta.html` | Solicitar proposta |
| `administradora-de-condominios-{cidade}.html` | Landing pages locais (Recife, João Pessoa, Campina Grande, Belém) |
| `privacidade.html` / `termos.html` | Páginas legais |
| `guia.html` | Guia de decisões de design e do projeto |

## Stack

- HTML/CSS/JS puro, sem framework nem build
- Design system em `assets/css/semog.css`
- Motion: GSAP + ScrollTrigger + Lenis (vendorizados em `assets/js/vendor/`, sem dependência de CDN)
- Fontes: Clash Display + Satoshi (Fontshare)
- Imagens e vídeos gerados por IA (Higgsfield)

## Pendências antes de produção

Ver seção 7 do `guia.html`. Em resumo: substituir endereços/telefones placeholder das unidades, depoimentos de exemplo, confirmar registros (CRECI/ABADI/Secovi) e ligar o formulário de proposta a um backend/CRM.

---

Slogan: **Preocupe-se apenas em morar.**
