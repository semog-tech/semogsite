'use client'
import { usePathname } from 'next/navigation'
import type { FooterConfig } from '@/../content/site'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

/** Blurb fixo da marca (semog.css: `.footer-brand p`) — texto de `_reference/index.html`. */
const BRAND_BLURB =
  'Administradora de condomínios líder do Nordeste. Desde 1991 cuidando de comunidades com transparência, retidão e dinâmica.'

/**
 * Selo de reconhecimento do rodapé (27/08/2026). Fica na coluna da marca, a
 * mais larga do `.footer-grid`, logo abaixo do blurb — presente em todas as
 * páginas sem disputar espaço com as colunas de links.
 *
 * Constante local pelo mesmo motivo de `BRAND_BLURB`: é atributo da marca, não
 * navegação, e `content/site.ts` guarda só o que é lista de links.
 *
 * A redação NÃO pode virar "melhor administradora do Brasil": o Ranking Top
 * 200 classifica clientes da Superlógica. Ver `Reconhecimento/Component.tsx`.
 */
const AWARD_SEAL = 'G20 Condo Superlógica · 3º ciclo consecutivo'

/** O post que conta o resultado — o selo é a porta de entrada pra ele. */
const AWARD_HREF = '/blog/g20-superlogica-next-2026'

const LEGAL_PATHS = new Set(['/privacidade', '/termos'])

type Column = FooterConfig['columns'][number]
type LegalLink = FooterConfig['legalLinks'][number]
type FootCta = FooterConfig['footCta']

/**
 * Ilha client só pra decidir a variante do rodapé pelo pathname — mesmo
 * padrão de `Nav.tsx` (`usePathname`). Os dados já vêm resolvidos (fetch +
 * fallback) de `FooterServer`, que continua Server Component; aqui só
 * escolhe entre o markup completo e o `.footer-bottom` isolado das páginas
 * legais, sem refazer nenhum fetch.
 *
 * Por que client e não um `params`/rota dedicada: o layout de
 * `(frontend)` é compartilhado por TODAS as rotas (a raiz de `[[...slug]]`),
 * então não recebe o slug da página — só o próprio segmento renderizado
 * sabe disso, e isso quebraria a árvore de layout se o footer tentasse
 * "ler" a rota do lado do servidor sem `headers()`/middleware (que tornaria
 * o site inteiro dinâmico, incompatível com a SSG de `generateStaticParams`
 * + `revalidate`). `usePathname()` resolve certo tanto no HTML estático
 * gerado por página quanto na hidratação, sem custo de fetch duplicado.
 */
export function FooterView({
  footCta,
  columns,
  legalLinks,
  bottomText,
}: {
  footCta: FootCta
  columns: Column[]
  legalLinks: LegalLink[]
  bottomText: string
}) {
  const pathname = usePathname()
  const isLegal = LEGAL_PATHS.has(pathname)

  // `/privacidade` e `/termos` do ref usam só o `.footer-bottom`, sem
  // `.foot-cta`/`.footer-grid` — fiel a `_reference/privacidade.html:102-112`
  // / `_reference/termos.html` (mesmo markup nas 2), inclusive o
  // `border-top:0;padding-top:0;` inline que zera o hairline/padding que
  // `.footer-bottom` normalmente herda de estar depois do `.footer-grid`.
  if (isLegal) {
    return (
      <footer className="footer">
        <Container>
          <div className="footer-bottom" style={{ borderTop: 0, paddingTop: 0 }}>
            <span>{bottomText}</span>
            <nav className="legal" aria-label="Legal">
              {legalLinks.map((link) => (
                <a key={link.id ?? link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </Container>
      </footer>
    )
  }

  const cta = footCta?.cta

  return (
    <footer className="footer">
      <Container>
        <div className="foot-cta">
          <p className="slog">
            {footCta?.slogan} <em>{footCta?.sloganEm}</em>
          </p>
          {cta?.label && cta?.href && (
            <Button href={cta.href} variant="white" size="lg" withArrow magnetic>
              {cta.label}
            </Button>
          )}
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            {/* biome-ignore lint/performance/noImgElement: sem next/image (localPatterns não cobre /public fora de /api/media) */}
            <img src="/semog-logo-light.svg" alt="Semog" width={160} height={24} />
            <p>{BRAND_BLURB}</p>
            {/* Sem `uppercase`/`tracking`: com eles o texto passava de uma
                linha e o chip virava um bloco de duas linhas com o ponto
                desalinhado. Em caixa normal cabe inteiro.
                Chip clicável: leva ao post do G20. `<a>` simples, como o
                resto do rodapé; `.footer li a` não o alcança (ele não está
                numa `li`), então o visual do chip permanece — só a borda
                clareia no hover. */}
            <a
              href={AWARD_HREF}
              className="inline-flex items-center gap-2.5 rounded-input border border-line-strong px-[0.9rem] py-[0.5rem] text-[0.8rem] font-medium text-fg-3 transition-colors hover:border-ice-400"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ice-500" />
              {AWARD_SEAL}
            </a>
          </div>
          {columns.map((col) => (
            <div key={col.id ?? col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links?.map((link) => (
                  <li key={link.id ?? link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>{bottomText}</span>
          <nav className="legal" aria-label="Legal">
            {legalLinks.map((link) => (
              <a key={link.id ?? link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  )
}
