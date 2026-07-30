import { PropostaForm } from '@/components/forms/PropostaForm'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/motion/reveal'
import type { PropostaBandBlock as PropostaBandBlockType } from '@/types/blocks'
import type { Media } from '@/types/media'

/**
 * Faixa de captação de proposta — o "momento de decisão" da home.
 *
 * Desenhada pra falar a língua da página, e não a do `/proposta`: a home é
 * toda alinhada à esquerda, com eyebrow-tracejado + display grande, e usa
 * **faixas full-bleed** como pausa (a banda do Garante, o CTA final). Um card
 * centralizado no meio do fluxo — que era a primeira tentativa — lê como
 * anúncio colado na página.
 *
 * A composição é a mesma que já converte 7-12% nas landings de cidade
 * (`CityLanding`): argumento à esquerda, formulário em card de vidro à
 * direita, sobre fundo atmosférico. O card reusa exatamente o tratamento de lá
 * (borda ice 22%, gradiente navy translúcido, blur 18px, sombra projetada).
 *
 * `background`:
 * - `gradiente` — `--grad-band` + brilho radial ice, a textura de banda do
 *   próprio site (a mesma de `.g-band` nas landings).
 * - `foto` — **só no desktop**: a imagem entra por cima do gradiente, com
 *   overlay direcional. No celular ela não entra, e não é nem baixada: o layer
 *   nasce `display:none` (navegador não busca `background-image` de elemento
 *   oculto), então o gradiente fica valendo sozinho.
 *
 * O corte é medido, não estético: numa tela de 390px a parte clara do overlay
 * cai fora do enquadramento e a seção vira um retângulo escuro — idêntica ao
 * gradiente, só que 124 KB mais pesada, baixados no load (não ao aproximar da
 * seção). Foto onde ela aparece; peso zero onde ela não aparece.
 */
function mediaUrl(resource?: number | Media | null): string | undefined {
  if (!resource || typeof resource === 'number') return undefined
  return resource.url ?? undefined
}

/** Mesmo tratamento do card da landing de cidade — consistência proposital. */
const CARD_VIDRO = {
  borderColor: 'rgba(173,213,235,0.22)',
  background: 'linear-gradient(160deg, rgba(16,26,72,0.82), rgba(5,8,26,0.86))',
  backdropFilter: 'blur(18px)',
  boxShadow: '0 30px 80px -30px rgba(5,8,26,0.95), inset 0 1px 0 rgba(255,255,255,0.06)',
} as const

const FUNDO_GRADIENTE =
  'radial-gradient(60% 80% at 12% 10%, rgba(173,213,235,0.16) 0%, transparent 60%), var(--grad-band)'

export function PropostaBandBlock({
  eyebrow,
  title,
  text,
  highlight,
  proofs,
  whatsapp,
  background,
  image,
}: PropostaBandBlockType) {
  const imageUrl = mediaUrl(image)
  const usaFoto = background === 'foto' && imageUrl

  return (
    <section
      className="relative isolate overflow-hidden border-y border-line py-[clamp(4rem,8vw,7rem)]"
      style={{ background: FUNDO_GRADIENTE }}
      aria-label="Solicitar proposta"
    >
      {usaFoto && (
        <>
          <div
            aria-hidden="true"
            className="-z-20 absolute inset-0 hidden bg-cover bg-[position:70%_center] lg:block"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {/*
            Overlay direcional: quase opaco onde mora o texto (esquerda) e mais
            leve à direita, deixando a foto aparecer atrás do card. Um overlay
            uniforme escuro o bastante pra segurar o contraste do texto apagava
            a imagem inteira — aí a foto não valia o download.
          */}
          <div
            aria-hidden="true"
            className="-z-10 absolute inset-0 hidden lg:block"
            style={{
              background:
                'linear-gradient(100deg, rgba(5,8,26,0.96) 0%, rgba(5,8,26,0.9) 34%, rgba(8,13,38,0.62) 68%, rgba(16,26,72,0.5) 100%)',
            }}
          />
        </>
      )}

      <Container>
        {/*
          Ordem no DOM = ordem no celular: cabeçalho → formulário → provas. Com
          tudo empilhado, deixar o argumento inteiro antes do card empurrava o
          primeiro campo uns 600px pra baixo. No desktop (lg) a grade recompõe
          as duas colunas: cabeçalho e provas à esquerda, card à direita
          ocupando as duas linhas.
        */}
        <div className="grid grid-cols-1 gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-x-[clamp(2.5rem,5vw,4.5rem)] lg:gap-y-10">
          {/* ---------------- cabeçalho ---------------- */}
          <div className="lg:col-start-1 lg:row-start-1">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <Reveal
              as="h2"
              className="max-w-[13ch] text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.02]"
            >
              {title}
            </Reveal>
            {text && (
              <Reveal as="p" delay={0.05} className="mt-5 max-w-[46ch] text-fg-2">
                {text}
              </Reveal>
            )}
          </div>

          {/* ---------------- formulário ---------------- */}
          <Reveal dir="scale" delay={0.1} className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div
              id="proposta"
              className="scroll-mt-28 rounded-[22px] border p-[clamp(1.5rem,2.6vw,2.2rem)]"
              style={CARD_VIDRO}
            >
              <PropostaForm compact withCityField />
            </div>
          </Reveal>

          {/* ---------------- provas ---------------- */}
          <div className="lg:col-start-1 lg:row-start-2">
            {/* Número gigante em gradiente ice — o mesmo recurso tipográfico
                que as landings usam pro "1%" do Garante (`.pct`/`gx-ice`).
                Aqui ele carrega a única promessa que importa nesta seção. */}
            {highlight?.value && (
              <Reveal delay={0.1} className="flex items-baseline gap-4">
                <span
                  className="gx-ice font-medium text-[clamp(3.2rem,7vw,5rem)] leading-[0.85] tracking-[-0.03em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {highlight.value}
                </span>
                {highlight.label && (
                  <span className="max-w-[22ch] text-[0.95rem] text-fg-2">{highlight.label}</span>
                )}
              </Reveal>
            )}

            {/* Provas curtas com filete no topo — ecoa as colunas do bloco de
                pilares logo acima, costurando a faixa ao resto da página. */}
            {proofs && proofs.length > 0 && (
              <Reveal
                delay={0.15}
                className="mt-[clamp(2rem,4vw,2.6rem)] grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3"
              >
                {proofs.map((proof) => (
                  <div key={proof.id ?? proof.label} className="border-line border-t pt-3">
                    <p className="m-0 text-[0.92rem] text-fg-2 leading-snug">{proof.label}</p>
                  </div>
                ))}
              </Reveal>
            )}

            {whatsapp?.href && (
              <Reveal delay={0.2} className="mt-[clamp(1.8rem,3vw,2.4rem)]">
                <a
                  href={whatsapp.href}
                  className="group inline-flex items-center gap-2 text-[0.95rem] text-fg-2 underline-offset-[6px] transition-colors hover:text-fg hover:underline"
                >
                  {whatsapp.label ?? 'Prefere conversar agora? Falar no WhatsApp'}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
