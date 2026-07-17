import type { CSSProperties, ReactNode } from 'react'

/**
 * Fiel a semog.css:195 (`section { padding-block: var(--section); position:
 * relative; }`, onde `--section: clamp(5rem,10vw,9rem)`) e :129-138
 * (.sec-light/.sec-light.white, portadas para src/styles/theme.css
 * @layer base na Task 1). `white` só tem efeito quando `light` também está
 * ativo — no ref, `.white` sozinho não corresponde a nenhuma regra. `style`
 * é um escape hatch para valores numéricos vindos do CMS que não dá pra
 * expressar como classe Tailwind estática (ex.: os campos `pageHero*` do
 * `Hero`, que variam por página).
 *
 * `flow-root` (em vez do `display:block` implícito de `<section>`) força
 * este elemento a estabelecer seu próprio bloco de formatação — sem isso, o
 * `margin-top`/`margin-bottom` de um filho direto em fluxo normal (ex.:
 * `.posts{margin-top:1.4rem}` do `BlogList`) "escapa" por cima/baixo de
 * qualquer instância com `padding-block` zerado (ex.: `tightTop`/`!pb-0`) e
 * cola no `body{background:var(--bg)}` (navy escuro) por trás, pintando uma
 * faixa escura indevida entre duas seções claras adjacentes — bug real
 * encontrado entre `BlogFeatured` e `BlogList` em `/blog` (o ref porta
 * `.posts{margin-top:1.4rem}` verbatim de `_reference/blog.html:66`, mas lá
 * `.featured`/`.posts` são irmãos dentro do MESMO `<section>`/`.container`,
 * então a margem nunca precisa atravessar um limite de seção). `flow-root`
 * não muda a caixa do próprio `<section>` no fluxo do documento (continua
 * block-level, largura 100%) nem recorta conteúdo (ao contrário de
 * `overflow:hidden`, que teria o mesmo efeito de conter a margem mas
 * cortaria sombras/decorações que ultrapassem a borda) — só contém as
 * margens dos descendentes em fluxo normal, prevenindo esta classe inteira
 * de bug em qualquer combinação futura de seção com padding zerado.
 */
export function Section({
  children,
  light,
  white,
  className = '',
  style,
  ariaLabel,
}: {
  children: ReactNode
  light?: boolean
  white?: boolean
  className?: string
  style?: CSSProperties
  /** `aria-label` do `<section>` — ex.: `.quick`/`.selfserve` de `_reference/contato.html:208,234`. */
  ariaLabel?: string
}) {
  const cls = [
    'relative flow-root py-[clamp(5rem,10vw,9rem)]',
    light && (white ? 'sec-light white' : 'sec-light'),
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <section className={cls} style={style} aria-label={ariaLabel}>
      {children}
    </section>
  )
}
