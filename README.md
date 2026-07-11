# Semog · Site institucional

Site institucional da **Semog Administradora de Condomínios**, líder do Nordeste desde 1991.

Fase atual: **validação de design em HTML estático** (sem build), pronto para migração posterior a Next.js na Vercel.

## Como rodar localmente

O site usa vídeo e imagens via caminhos relativos, então precisa de um servidor HTTP (não abra o arquivo direto no navegador).

**Windows:** duplo clique em `ABRIR-SITE.bat`

**Ou, com Python:**
```bash
python -m http.server 8347
# abra http://localhost:8347
```

**Ou, com Node:**
```bash
npx serve .
```

## Páginas

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
